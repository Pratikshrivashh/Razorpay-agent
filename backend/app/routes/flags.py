from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from ..db import db
from ..models import RiskFlag, ReviewActionRequest, AuthorizeRequest, AuditLog, RiskFlagStatus

router = APIRouter(prefix="/api/flags", tags=["Risk Flags"])

@router.get("", response_model=List[RiskFlag])
async def list_flags(
    merchant_id: Optional[str] = None,
    status: Optional[str] = None,
    min_score: Optional[int] = Query(None, ge=0, le=100)
):
    """List risk flags with optional filtering. Filters out authorized/cleared/dismissed flags by default for active queue."""
    flags = db.list_risk_flags(merchant_id=merchant_id, status=status)
    
    # If listing for active review queue, filter out authorized/cleared/dismissed transactions
    if status is None or status.lower() in ("open", "needs_review"):
        flags = [f for f in flags if f.status.value in ("open", "context_requested")]
        
    if min_score is not None:
        flags = [f for f in flags if f.confidence_score >= min_score]
    return flags

@router.get("/{flag_id}", response_model=RiskFlag)
async def get_flag(flag_id: str):
    """Retrieve full evidence breakdown for a single flag."""
    flag = db.get_risk_flag(flag_id) or db.get_risk_flag_by_payment_id(flag_id)
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk flag not found.")
    return flag

@router.post("/authorize", response_model=RiskFlag)
async def authorize_flag_global(req: AuthorizeRequest):
    """
    Authorize / Clear payment endpoint:
    Updates status to 'dismissed' (cleared/authorized) in the database and audit log.
    """
    target_id = req.flag_id or req.transaction_id
    if not target_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must provide flag_id or transaction_id.")

    flag = db.get_risk_flag(target_id) or db.get_risk_flag_by_payment_id(target_id)
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Risk flag '{target_id}' not found.")

    now_iso = datetime.now(timezone.utc).isoformat()
    updated = db.update_risk_flag(flag.id, {
        "status": RiskFlagStatus.DISMISSED_FP.value,
        "reviewed_at": now_iso,
        "reviewed_by": req.reviewer_name,
        "review_notes": req.notes or "Authorized & Cleared by Ops Analyst"
    })

    if not updated:
        flag.status = RiskFlagStatus.DISMISSED_FP
        flag.reviewed_at = now_iso
        flag.reviewed_by = req.reviewer_name
        flag.review_notes = req.notes or "Authorized & Cleared by Ops Analyst"
        updated = flag

    # Update associated payment status in DB as well
    if flag.payment_id:
        payment = db.get_payment(flag.payment_id)
        if payment:
            payment.status = "authorized"
            db.add_payment(payment)

    db.add_audit_log(AuditLog(
        entity_type="risk_flag",
        entity_id=flag.id,
        action="HUMAN_REVIEW_AUTHORIZE_CLEARED",
        actor=req.reviewer_name,
        detail={
            "previous_status": flag.status.value if hasattr(flag.status, "value") else str(flag.status),
            "new_status": "dismissed",
            "score": flag.confidence_score,
            "amount": flag.amount,
            "payer_vpa": flag.payer_vpa
        }
    ))

    return updated

@router.post("/transactions/{transaction_id}/status", response_model=RiskFlag)
async def update_transaction_status(transaction_id: str, req: AuthorizeRequest):
    """
    Updates transaction status to 'authorized' / 'cleared' in DB.
    """
    req.transaction_id = transaction_id
    return await authorize_flag_global(req)

@router.post("/{flag_id}/review", response_model=RiskFlag)
async def review_flag(flag_id: str, req: ReviewActionRequest):
    """
    Human-in-the-loop review action:
    - 'confirm_risk': Flag confirmed as genuine anomaly/mule pattern
    - 'dismiss_false_positive': Flag cleared as normal customer behavior
    - 'request_context': Merchant context requested before payout release
    """
    flag = db.get_risk_flag(flag_id) or db.get_risk_flag_by_payment_id(flag_id)
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Risk flag '{flag_id}' not found.")

    action_map = {
        "confirm_risk": RiskFlagStatus.CONFIRMED_RISK,
        "reviewed_confirmed": RiskFlagStatus.CONFIRMED_RISK,
        "dismiss_false_positive": RiskFlagStatus.DISMISSED_FP,
        "dismissed": RiskFlagStatus.DISMISSED_FP,
        "dismiss_fp": RiskFlagStatus.DISMISSED_FP,
        "authorized": RiskFlagStatus.DISMISSED_FP,
        "cleared": RiskFlagStatus.DISMISSED_FP,
        "reviewed_dismissed": RiskFlagStatus.DISMISSED_FP,
        "request_context": RiskFlagStatus.CONTEXT_REQUESTED,
        "context_requested": RiskFlagStatus.CONTEXT_REQUESTED
    }

    new_status = action_map.get(req.action.lower() if req.action else "")
    if not new_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action '{req.action}'. Allowed: confirm_risk, dismiss_false_positive, request_context"
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    updated = db.update_risk_flag(flag.id, {
        "status": new_status.value,
        "reviewed_at": now_iso,
        "reviewed_by": req.reviewed_by,
        "review_notes": req.notes
    })

    if not updated:
        flag.status = new_status
        flag.reviewed_at = now_iso
        flag.reviewed_by = req.reviewed_by
        flag.review_notes = req.notes
        updated = flag

    # Log immutable audit event
    db.add_audit_log(AuditLog(
        entity_type="risk_flag",
        entity_id=flag.id,
        action=f"HUMAN_REVIEW_{req.action.upper()}",
        actor=req.reviewed_by,
        detail={
            "previous_status": flag.status.value if hasattr(flag.status, "value") else str(flag.status),
            "new_status": new_status.value,
            "score": flag.confidence_score,
            "notes": req.notes,
            "amount": flag.amount,
            "payer_vpa": flag.payer_vpa
        }
    ))

    return updated

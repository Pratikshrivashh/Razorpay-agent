from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from ..db import db
from ..models import RiskFlag, ReviewActionRequest, AuditLog, RiskFlagStatus

router = APIRouter(prefix="/api/flags", tags=["Risk Flags"])

@router.get("", response_model=List[RiskFlag])
async def list_flags(
    merchant_id: Optional[str] = None,
    status: Optional[str] = None,
    min_score: Optional[int] = Query(None, ge=0, le=100)
):
    """List risk flags with optional filtering."""
    flags = db.list_risk_flags(merchant_id=merchant_id, status=status)
    if min_score is not None:
        flags = [f for f in flags if f.confidence_score >= min_score]
    return flags

@router.get("/{flag_id}", response_model=RiskFlag)
async def get_flag(flag_id: str):
    """Retrieve full evidence breakdown for a single flag."""
    flag = db.get_risk_flag(flag_id)
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk flag not found.")
    return flag

@router.post("/{flag_id}/review", response_model=RiskFlag)
async def review_flag(flag_id: str, req: ReviewActionRequest):
    """
    Human-in-the-loop review action:
    - 'confirm_risk': Flag confirmed as genuine anomaly/mule pattern
    - 'dismiss_false_positive': Flag cleared as normal customer behavior
    - 'request_context': Merchant context requested before payout release
    """
    flag = db.get_risk_flag(flag_id)
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk flag not found.")

    action_map = {
        "confirm_risk": RiskFlagStatus.CONFIRMED_RISK,
        "dismiss_false_positive": RiskFlagStatus.DISMISSED_FP,
        "request_context": RiskFlagStatus.CONTEXT_REQUESTED
    }

    new_status = action_map.get(req.action)
    if not new_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action '{req.action}'. Allowed: confirm_risk, dismiss_false_positive, request_context"
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    updated = db.update_risk_flag(flag_id, {
        "status": new_status.value,
        "reviewed_at": now_iso,
        "reviewed_by": req.reviewed_by,
        "review_notes": req.notes
    })

    # Log immutable audit event
    db.add_audit_log(AuditLog(
        entity_type="risk_flag",
        entity_id=flag_id,
        action=f"HUMAN_REVIEW_{req.action.upper()}",
        actor=req.reviewed_by,
        detail={
            "previous_status": flag.status.value,
            "new_status": new_status.value,
            "score": flag.confidence_score,
            "notes": req.notes,
            "amount": flag.amount,
            "payer_vpa": flag.payer_vpa
        }
    ))

    return updated

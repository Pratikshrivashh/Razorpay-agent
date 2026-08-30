import hmac
import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional
from .config import settings
from .db import db
from .models import Payment, RiskFlag, AuditLog, ConfidenceLevel, RiskFlagStatus
from .scoring_engine import score_payment
from .ai_service import explain_risk_flag

logger = logging.getLogger(__name__)

def verify_razorpay_signature(raw_body: bytes, signature: str, secret: Optional[str] = None) -> bool:
    """Verifies HMAC SHA-256 signature sent by Razorpay webhook."""
    webhook_secret = secret or settings.RAZORPAY_WEBHOOK_SECRET
    if not webhook_secret or not signature:
        return False
    try:
        expected_sig = hmac.new(
            webhook_secret.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_sig, signature)
    except Exception as e:
        logger.error(f"Signature verification error: {e}")
        return False

async def process_incoming_payment(
    payment_data: Dict[str, Any],
    merchant_id: Optional[str] = None,
    is_synthetic: bool = False
) -> Tuple[Payment, Optional[RiskFlag]]:
    """
    Core Pipeline:
    PAYMENT -> ANOMALY SCORE -> RISK SIGNALS -> CONTEXT CHECK (FP GUARD) -> CONFIDENCE (AI) -> HUMAN REVIEW QUEUE
    """
    # 1. Resolve merchant
    merchants = db.list_merchants()
    merchant = None
    if merchant_id:
        merchant = db.get_merchant(merchant_id)
    if not merchant and merchants:
        merchant = merchants[0]  # default to primary merchant if not specified

    if not merchant:
        raise ValueError("No merchant configured in database.")

    # 2. Extract payment entity (handle both native Razorpay webhook format and flat format)
    if "payload" in payment_data and "payment" in payment_data["payload"]:
        entity = payment_data["payload"]["payment"]["entity"]
        rzp_id = entity.get("id", f"pay_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}")
        raw_amt = float(entity.get("amount", 0))
        # Razorpay sends amounts in paise (1 INR = 100 paise)
        amount = raw_amt / 100.0 if raw_amt > 1000 and entity.get("currency") == "INR" else raw_amt
        payer_vpa = entity.get("vpa", "unknown.payer@upi")
        order_id = entity.get("order_id")
        currency = entity.get("currency", "INR")
        status = entity.get("status", "captured")
        created_at = datetime.fromtimestamp(entity.get("created_at", datetime.now(timezone.utc).timestamp())).isoformat()
        metadata = entity.get("notes", {}) or {}
    else:
        rzp_id = payment_data.get("razorpay_payment_id", f"pay_syn_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}")
        amount = float(payment_data.get("amount", 550.0))
        payer_vpa = payment_data.get("payer_vpa", "stranger@upi")
        order_id = payment_data.get("order_id")
        currency = payment_data.get("currency", "INR")
        status = payment_data.get("status", "captured")
        created_at = payment_data.get("created_at", datetime.now(timezone.utc).isoformat())
        metadata = payment_data.get("metadata", {})

    # 3. Create & Persist Payment
    payment = Payment(
        razorpay_payment_id=rzp_id,
        merchant_id=merchant.id,
        payer_vpa=payer_vpa,
        amount=amount,
        currency=currency,
        order_id=order_id,
        status=status,
        created_at=created_at,
        is_synthetic_mule=is_synthetic,
        metadata=metadata
    )
    db.add_payment(payment)

    # 4. Check historical payer transactions with this merchant
    prior_tx_count = db.get_payer_history_count(merchant.id, payment.payer_vpa, exclude_payment_id=payment.id)
    recent_payments = db.list_payments(merchant_id=merchant.id, limit=20)

    # 5. Deterministic Anomaly Scoring + False-Positive Guard
    score, confidence, signals, mitigators = score_payment(
        payment=payment,
        merchant=merchant,
        prior_payer_tx_count=prior_tx_count,
        recent_merchant_payments=recent_payments
    )

    risk_flag = None
    # If score >= 30, flag for Human-In-The-Loop review
    if score >= settings.SCORE_LOW_THRESHOLD:
        # 6. AI Explanation Layer (Gemini)
        ai_resp = await explain_risk_flag(
            payment=payment,
            merchant=merchant,
            score=score,
            confidence=confidence,
            signals=signals,
            mitigators=mitigators
        )

        risk_flag = RiskFlag(
            payment_id=payment.id,
            merchant_id=merchant.id,
            merchant_name=merchant.name,
            payer_vpa=payment.payer_vpa,
            amount=payment.amount,
            order_id=payment.order_id,
            payment_created_at=payment.created_at,
            confidence_score=score,
            confidence_level=confidence,
            signals_triggered=signals,
            signals_mitigating=mitigators,
            ai_summary=ai_resp.summary,
            ai_explanation=ai_resp.explanation,
            ai_mitigating_note=ai_resp.mitigating_note,
            ai_recommended_action=ai_resp.recommended_action,
            status=RiskFlagStatus.OPEN,
            is_synthetic_mule=is_synthetic
        )
        db.add_risk_flag(risk_flag)

        # 7. Audit Log Entry
        db.add_audit_log(AuditLog(
            entity_type="risk_flag",
            entity_id=risk_flag.id,
            action="SCORED_AND_FLAGGED",
            actor="system",
            detail={
                "score": score,
                "confidence": confidence.value,
                "signals_count": len(signals),
                "mitigators_count": len(mitigators),
                "amount": payment.amount,
                "payer_vpa": payment.payer_vpa
            }
        ))
    else:
        # Normal payment logged
        db.add_audit_log(AuditLog(
            entity_type="payment",
            entity_id=payment.id,
            action="SCORED_CLEARED",
            actor="system",
            detail={"score": score, "confidence": confidence.value, "amount": payment.amount}
        ))

    return payment, risk_flag

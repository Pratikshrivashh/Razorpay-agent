import json
from fastapi import APIRouter, Request, HTTPException, Header, status
from typing import Optional, Dict, Any
from ..webhook_handler import verify_razorpay_signature, process_incoming_payment

router = APIRouter(tags=["Webhooks"])

@router.post("/webhooks/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None)
):
    """
    Standard Razorpay webhook endpoint.
    Verifies HMAC SHA-256 signature and processes payment.captured events.
    """
    raw_body = await request.body()
    
    # Verify signature if header is provided
    if x_razorpay_signature:
        is_valid = verify_razorpay_signature(raw_body, x_razorpay_signature)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Razorpay webhook signature."
            )

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON body."
        )

    event_type = payload.get("event")
    # Process payment.captured or direct payment object
    payment, flag = await process_incoming_payment(payload, is_synthetic=False)

    return {
        "status": "success",
        "event": event_type or "payment.captured",
        "payment_id": payment.id,
        "razorpay_payment_id": payment.razorpay_payment_id,
        "flagged": flag is not None,
        "flag_id": flag.id if flag else None,
        "confidence_score": flag.confidence_score if flag else 0
    }

@router.post("/api/webhooks/synthetic")
async def synthetic_webhook_ingest(payload: Dict[str, Any]):
    """Endpoint for synthetic simulation or external payment ingestion."""
    payment, flag = await process_incoming_payment(
        payload,
        merchant_id=payload.get("merchant_id"),
        is_synthetic=payload.get("is_synthetic", True)
    )
    return {
        "status": "success",
        "payment": payment,
        "flag": flag,
        "is_flagged": flag is not None
    }

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from ..db import db
from ..models import Merchant, RiskFlag, Payment

router = APIRouter(prefix="/api/merchants", tags=["Merchants"])

@router.get("", response_model=List[Merchant])
async def list_merchants():
    """List all registered merchants."""
    return db.list_merchants()

@router.get("/{merchant_id}", response_model=Merchant)
async def get_merchant(merchant_id: str):
    """Retrieve details for a specific merchant."""
    m = db.get_merchant(merchant_id)
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found.")
    return m

@router.get("/{merchant_id}/flags", response_model=List[RiskFlag])
async def get_merchant_flags(merchant_id: str, status: Optional[str] = None):
    """List all risk flags for a specific merchant."""
    return db.list_risk_flags(merchant_id=merchant_id, status=status)

@router.get("/{merchant_id}/payments", response_model=List[Payment])
async def get_merchant_payments(merchant_id: str, limit: int = 100):
    """List recent payments processed for a merchant."""
    return db.list_payments(merchant_id=merchant_id, limit=limit)

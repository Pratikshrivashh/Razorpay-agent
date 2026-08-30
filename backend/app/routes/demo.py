from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, Optional
from ..synthetic_generator import generate_dataset, inject_single_mule, calculate_evaluation_metrics
from ..models import SyntheticTrafficRequest, SyntheticMuleInjectRequest, CustomSimulationInjectRequest
from ..db import db

router = APIRouter(prefix="/api/demo", tags=["Demo & Simulation"])

@router.post("/generate")
async def generate_demo_traffic(req: SyntheticTrafficRequest):
    """Generates synthetic normal traffic and labeled mule transactions for demo."""
    merchants = db.list_merchants()
    merchant_id = req.merchant_id or (merchants[0].id if merchants else None)
    if not merchant_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No merchant configured.")

    result = await generate_dataset(
        merchant_id=merchant_id,
        normal_count=req.normal_count,
        mule_count=req.mule_count,
        clear_existing=req.clear_existing
    )
    return result

@router.post("/inject-mule-pattern")
async def inject_mule_pattern(req: SyntheticMuleInjectRequest):
    """Injects a live mule-pattern payment to demonstrate real-time flag detection."""
    merchants = db.list_merchants()
    merchant_id = req.merchant_id or (merchants[0].id if merchants else None)
    if not merchant_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No merchant configured.")

    payment, flag = await inject_single_mule(
        merchant_id=merchant_id,
        pattern_type=req.mule_pattern_type,
        custom_amount=req.custom_amount,
        custom_vpa=req.custom_vpa
    )

    return {
        "status": "success",
        "payment": payment,
        "flag": flag,
        "is_flagged": flag is not None
    }

@router.post("/inject-custom")
async def inject_custom_simulation(req: CustomSimulationInjectRequest):
    """Injects a custom simulation mule payment into Sentinel's pipeline."""
    merchants = db.list_merchants()
    merchant_id = req.merchant_id or (merchants[0].id if merchants else None)
    if not merchant_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No merchant configured.")

    payment, flag = await inject_single_mule(
        merchant_id=merchant_id,
        pattern_type=req.pattern_type or "task_app_round_deposit",
        custom_amount=req.amount,
        custom_vpa=req.payer_vpa
    )

    return {
        "status": "success",
        "payment": payment,
        "flag": flag,
        "is_flagged": flag is not None
    }

@router.post("/reset")
async def reset_demo_data():
    """Resets database back to clean state."""
    db.reset_dataset()
    return {"status": "success", "message": "Database reset to initial merchant baseline."}

@router.get("/metrics")
async def get_demo_metrics(merchant_id: Optional[str] = None):
    """Returns ground-truth precision, recall, and specificity evaluation."""
    return calculate_evaluation_metrics(merchant_id)

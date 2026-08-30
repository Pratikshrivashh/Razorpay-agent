from fastapi import APIRouter
from typing import Dict, Any, List, Optional
from ..db import db
from ..models import DashboardSummary, RiskFlagStatus
from ..synthetic_generator import calculate_evaluation_metrics

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(merchant_id: Optional[str] = None):
    """Returns top-level KPI metrics for the Sentinel dashboard."""
    payments = db.list_payments(merchant_id=merchant_id, limit=1000)
    flags = db.list_risk_flags(merchant_id=merchant_id)

    total_tx = len(payments)
    total_flagged = len(flags)
    
    under_review = len([f for f in flags if f.status in (RiskFlagStatus.OPEN, RiskFlagStatus.CONTEXT_REQUESTED)])
    resolved_cleared = len([f for f in flags if f.status == RiskFlagStatus.DISMISSED_FP])
    confirmed_risks = len([f for f in flags if f.status == RiskFlagStatus.CONFIRMED_RISK])

    risk_exposure_pct = round((total_flagged / total_tx) * 100, 1) if total_tx > 0 else 0.0
    avg_score = round(sum(f.confidence_score for f in flags) / total_flagged, 1) if total_flagged > 0 else 0.0

    # Ground truth metrics from synthetic dataset
    eval_metrics = calculate_evaluation_metrics(merchant_id)

    return DashboardSummary(
        total_transactions=total_tx,
        total_flagged=total_flagged,
        under_review=under_review,
        resolved_cleared=resolved_cleared,
        confirmed_risks=confirmed_risks,
        overall_risk_exposure_pct=risk_exposure_pct,
        avg_confidence_score=avg_score,
        false_positive_rate_pct=eval_metrics.get("false_positive_rate_pct", 0.0),
        precision=eval_metrics.get("precision_pct", 100.0),
        recall=eval_metrics.get("recall_pct", 100.0),
        specificity=eval_metrics.get("specificity_pct", 100.0)
    )

@router.get("/timeline")
async def get_dashboard_timeline(limit: int = 20):
    """Returns recent audit events and flagged transaction activity."""
    audit_logs = db.list_audit_logs(limit=limit)
    flags = db.list_risk_flags()[:limit]
    return {
        "audit_logs": audit_logs,
        "recent_flags": flags
    }

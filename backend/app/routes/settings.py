from fastapi import APIRouter, HTTPException, status
from ..db import db
from ..models import AutoFreezePolicy, AuditLog
from datetime import datetime, timezone

router = APIRouter(prefix="/api/settings", tags=["Settings & Policy Rules"])

@router.get("/auto-freeze", response_model=AutoFreezePolicy)
async def get_auto_freeze_policy():
    """Retrieve active autonomous Auto-Freeze Shield policy rule configuration."""
    return db.get_auto_freeze_policy()

@router.post("/auto-freeze", response_model=AutoFreezePolicy)
async def update_auto_freeze_policy(policy: AutoFreezePolicy):
    """Update active autonomous Auto-Freeze Shield policy thresholds & parameters."""
    policy.updated_at = datetime.now(timezone.utc).isoformat()
    updated = db.update_auto_freeze_policy(policy)

    db.add_audit_log(AuditLog(
        entity_type="settings",
        entity_id="auto_freeze_policy",
        action="POLICY_RULE_UPDATED",
        actor="system",
        detail={
            "enabled": updated.enabled,
            "min_score_threshold": updated.min_score_threshold,
            "freeze_duration_hours": updated.freeze_duration_hours,
            "action_type": updated.action_type
        }
    ))

    return updated

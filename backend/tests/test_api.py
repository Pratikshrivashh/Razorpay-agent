import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import db
from app.models import RiskFlagStatus

client = TestClient(app)

def test_root_health():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["health"] == "healthy"

def test_list_merchants():
    res = client.get("/api/merchants")
    assert res.status_code == 200
    merchants = res.json()
    assert len(merchants) >= 1
    assert "id" in merchants[0]

def test_dashboard_summary():
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    summary = res.json()
    assert "total_transactions" in summary
    assert "overall_risk_exposure_pct" in summary
    assert "precision" in summary

def test_inject_mule_and_review_workflow():
    # 1. Inject a mule pattern
    merchants = db.list_merchants()
    mer_id = merchants[0].id
    
    inject_res = client.post("/api/demo/inject-mule-pattern", json={
        "merchant_id": mer_id,
        "mule_pattern_type": "task_app_round_deposit",
        "custom_amount": 550.0,
        "custom_vpa": "test_mule_hacker@upi"
    })
    assert inject_res.status_code == 200
    inject_data = inject_res.json()
    assert inject_data["is_flagged"] is True
    flag_id = inject_data["flag"]["id"]

    # 2. Get flag evidence details
    flag_res = client.get(f"/api/flags/{flag_id}")
    assert flag_res.status_code == 200
    flag_data = flag_res.json()
    assert flag_data["confidence_score"] >= 30
    assert len(flag_data["signals_triggered"]) >= 1

    # 3. Perform human-in-the-loop review (Confirm Risk)
    review_res = client.post(f"/api/flags/{flag_id}/review", json={
        "action": "confirm_risk",
        "reviewed_by": "Senior Fraud Ops Analyst",
        "notes": "Verified stranger VPA without order reference matching known task-app scam."
    })
    assert review_res.status_code == 200
    updated_flag = review_res.json()
    assert updated_flag["status"] == RiskFlagStatus.CONFIRMED_RISK.value
    assert updated_flag["reviewed_by"] == "Senior Fraud Ops Analyst"

def test_webhook_signature_verification():
    # Send synthetic webhook
    res = client.post("/api/webhooks/synthetic", json={
        "amount": 550.0,
        "payer_vpa": "newbie@okaxis",
        "order_id": None
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"

import pytest
from app.models import Merchant, Payment, ConfidenceLevel
from app.scoring_engine import score_payment

@pytest.fixture
def mock_merchant():
    return Merchant(
        id="mer_test_01",
        name="Test Luxe Retail",
        business_category="Fashion & Luxury",
        typical_order_min=1000.0,
        typical_order_max=5000.0,
        business_hours_start="09:00",
        business_hours_end="21:00",
        vpa="testluxe@razorpay"
    )

def test_normal_payment_cleared(mock_merchant):
    """A repeat customer paying ₹2,500 with order ID during business hours should be CLEARED (score < 30)."""
    payment = Payment(
        razorpay_payment_id="pay_norm_01",
        merchant_id=mock_merchant.id,
        payer_vpa="verified.customer@icici",
        amount=2500.0,
        order_id="order_12345",
        created_at="2026-08-29T14:30:00"
    )
    score, confidence, signals, mitigators = score_payment(
        payment=payment,
        merchant=mock_merchant,
        prior_payer_tx_count=4
    )
    assert score < 30
    assert confidence == ConfidenceLevel.CLEARED
    assert any(m.code == "repeat_customer" for m in mitigators)
    assert any(m.code == "has_order_reference" for m in mitigators)
    assert any(m.code == "within_business_hours" for m in mitigators)

def test_mule_pattern_task_app_deposit(mock_merchant):
    """An unknown payer paying flat ₹550 without an order reference should be flagged as MEDIUM/HIGH risk."""
    payment = Payment(
        razorpay_payment_id="pay_mule_01",
        merchant_id=mock_merchant.id,
        payer_vpa="stranger_task88@ybl",
        amount=550.0,
        order_id=None,
        created_at="2026-08-29T15:00:00"
    )
    score, confidence, signals, mitigators = score_payment(
        payment=payment,
        merchant=mock_merchant,
        prior_payer_tx_count=0
    )
    assert score >= 60
    assert confidence in (ConfidenceLevel.MEDIUM, ConfidenceLevel.HIGH)
    assert any(s.code == "first_time_payer" for s in signals)
    assert any(s.code == "amount_outside_typical_range" for s in signals)
    assert any(s.code == "no_order_reference" for s in signals)

def test_off_hours_burst_signal(mock_merchant):
    """Off-hours transaction should trigger outside_business_hours signal."""
    payment = Payment(
        razorpay_payment_id="pay_night_01",
        merchant_id=mock_merchant.id,
        payer_vpa="nocturnal_user@paytm",
        amount=2000.0,
        order_id="order_998",
        created_at="2026-08-29T03:30:00"  # 3:30 AM
    )
    score, confidence, signals, mitigators = score_payment(
        payment=payment,
        merchant=mock_merchant,
        prior_payer_tx_count=0
    )
    assert any(s.code == "outside_business_hours" for s in signals)

def test_false_positive_guard_mitigation(mock_merchant):
    """A repeat customer placing an atypical large order with a valid order ID has their score safely damped."""
    payment = Payment(
        razorpay_payment_id="pay_large_repeat",
        merchant_id=mock_merchant.id,
        payer_vpa="vip.customer@okhdfcbank",
        amount=12000.0,  # Above typical max
        order_id="order_bulk_custom",
        created_at="2026-08-29T12:00:00"
    )
    score, confidence, signals, mitigators = score_payment(
        payment=payment,
        merchant=mock_merchant,
        prior_payer_tx_count=8
    )
    # The repeat customer + order ID mitigations should keep score low
    assert score < 30
    assert confidence == ConfidenceLevel.CLEARED

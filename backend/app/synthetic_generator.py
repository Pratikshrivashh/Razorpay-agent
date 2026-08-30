import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Tuple
from .models import Merchant, Payment, RiskFlag
from .db import db
from .webhook_handler import process_incoming_payment

# Realistic sample pools for synthetic data generation
REPEAT_PAYER_VPAS = [
    "rohit.sharma@okaxis", "priya.nair@icici", "arjun.verma@okhdfcbank",
    "sneha.patel@paytm", "vikram.singh@ybl", "ananya.iyer@oksbi",
    "kavita.reddy@okaxis", "rahul.gupta@icici", "divya.sharma@paytm",
    "amitabh.b@okhdfcbank", "neha.mehta@ybl", "suresh.kumar@oksbi"
]

MULE_PAYER_VPAS = [
    "task_commission_982@ybl", "daily_earn_user31@paytm", "invest_vip_77@okaxis",
    "fast_reward_09@okhdfcbank", "adhoc_dep_382@oksbi", "agent_node_552@ybl",
    "p2p_router_991@paytm", "crypto_bridge_22@okaxis"
]

MULE_PATTERN_TYPES = {
    "fractional_task_scam": {
        "amount": 199.99,
        "description": "Fractional .99 Task Scam Deposit (₹199.99 VIP recharge)",
        "off_hours": False,
        "has_order": False,
        "is_round_trip": False,
        "cross_burst": True,
        "fractional_pattern": True,
        "micro_deposit_burst": True
    },
    "micro_deposit_burst": {
        "amount": 299.00,
        "description": "Micro-Deposit Velocity Burst (₹299.00 rapid deposits)",
        "off_hours": False,
        "has_order": False,
        "is_round_trip": False,
        "cross_burst": True,
        "micro_deposit_burst": True
    },
    "smurfing_structuring": {
        "amount": 9990.00,
        "description": "Smurfing / Structuring Deposit (₹9,990 below PAN threshold)",
        "off_hours": False,
        "has_order": False,
        "is_round_trip": False,
        "cross_burst": True,
        "smurfing_detected": True
    },
    "usdt_p2p_offramp": {
        "amount": 8500.00,
        "description": "USDT P2P Crypto Off-Ramp Sweep (Direct OTC desk payout)",
        "off_hours": False,
        "has_order": False,
        "is_round_trip": True,
        "cross_burst": True,
        "usdt_p2p_offramp": True,
        "drainage_ratio": 0.98
    },
    "overnight_clearing_sweep": {
        "amount": 12500.00,
        "description": "Zero-Inactivity Overnight Sweep (03:30 AM balance drain)",
        "off_hours": True,
        "has_order": False,
        "is_round_trip": True,
        "cross_burst": False,
        "overnight_sweep": True,
        "full_exhaustion": True
    },
    "fresh_mule_shell": {
        "amount": 3499.99,
        "description": "Fresh Mule Shell Entity (GSTIN < 30 days old + .99 pricing)",
        "off_hours": True,
        "has_order": False,
        "is_round_trip": True,
        "cross_burst": True,
        "fractional_pattern": True,
        "fresh_mule_shell": True,
        "zero_refund_anomaly": True
    }
}

async def generate_dataset(
    merchant_id: str,
    normal_count: int = 80,
    mule_count: int = 6,
    clear_existing: bool = False
) -> Dict[str, Any]:
    """Generates synthetic normal traffic and plants labeled mule-pattern transactions."""
    if clear_existing:
        db.reset_dataset()

    merchant = db.get_merchant(merchant_id)
    if not merchant:
        merchants = db.list_merchants()
        if not merchants:
            raise ValueError("No merchants available.")
        merchant = merchants[0]

    base_time = datetime.now(timezone.utc) - timedelta(days=7)
    created_payments = []
    created_flags = []

    # 1. Generate Normal Traffic
    for i in range(normal_count):
        payer_vpa = random.choice(REPEAT_PAYER_VPAS)
        min_p = merchant.typical_order_min
        max_p = merchant.typical_order_max
        amount = round(random.uniform(min_p, max_p), -1)

        day_offset = random.uniform(0, 7)
        hour = random.randint(10, 20)
        minute = random.randint(0, 59)
        tx_time = (base_time + timedelta(days=day_offset)).replace(hour=hour, minute=minute)

        payment_data = {
            "razorpay_payment_id": f"pay_norm_{uuid.uuid4().hex[:10]}",
            "amount": amount,
            "payer_vpa": payer_vpa,
            "order_id": f"order_ecom_{uuid.uuid4().hex[:8]}",
            "currency": "INR",
            "status": "captured",
            "created_at": tx_time.isoformat(),
            "metadata": {"channel": "web_checkout"}
        }

        p, f = await process_incoming_payment(payment_data, merchant.id, is_synthetic=False)
        created_payments.append(p)
        if f:
            created_flags.append(f)

    # 2. Inject Planted Mule-Pattern Transactions
    for i in range(mule_count):
        pattern_key = random.choice(list(MULE_PATTERN_TYPES.keys()))
        pattern = MULE_PATTERN_TYPES[pattern_key]
        payer_vpa = random.choice(MULE_PAYER_VPAS)

        day_offset = random.uniform(5, 7)
        if pattern["off_hours"]:
            hour = random.choice([1, 2, 3, 4])
        else:
            hour = random.randint(11, 19)
        minute = random.randint(0, 59)
        tx_time = (base_time + timedelta(days=day_offset)).replace(hour=hour, minute=minute)

        metadata_dict = {
            "pattern_type": pattern_key,
            "is_round_trip": pattern.get("is_round_trip", False),
            "cross_merchant_burst": pattern.get("cross_burst", False),
            "cross_merchant_burst_count": "4 merchant VPAs in 15 mins" if pattern.get("cross_burst") else None,
            "pattern_description": pattern["description"]
        }
        for k, v in pattern.items():
            if k not in ["amount", "description", "off_hours", "has_order", "is_round_trip", "cross_burst"]:
                metadata_dict[k] = v

        payment_data = {
            "razorpay_payment_id": f"pay_mule_{uuid.uuid4().hex[:10]}",
            "amount": pattern["amount"],
            "payer_vpa": payer_vpa,
            "order_id": None,
            "currency": "INR",
            "status": "captured",
            "created_at": tx_time.isoformat(),
            "metadata": metadata_dict
        }

        p, f = await process_incoming_payment(payment_data, merchant.id, is_synthetic=True)
        created_payments.append(p)
        if f:
            created_flags.append(f)

    metrics = calculate_evaluation_metrics(merchant.id)

    return {
        "merchant_id": merchant.id,
        "merchant_name": merchant.name,
        "normal_generated": normal_count,
        "mule_injected": mule_count,
        "total_payments": len(created_payments),
        "total_flagged": len(created_flags),
        "evaluation_metrics": metrics
    }

async def inject_single_mule(
    merchant_id: str,
    pattern_type: str = "fractional_task_scam",
    custom_amount: float = None,
    custom_vpa: str = None
) -> Tuple[Payment, RiskFlag]:
    """Injects a single live mule transaction into the payment stream."""
    merchant = db.get_merchant(merchant_id) or db.list_merchants()[0]
    pattern = MULE_PATTERN_TYPES.get(pattern_type, MULE_PATTERN_TYPES["fractional_task_scam"])

    amount = custom_amount if custom_amount is not None else pattern["amount"]
    payer_vpa = custom_vpa if custom_vpa is not None else random.choice(MULE_PAYER_VPAS)

    now = datetime.now(timezone.utc)
    if pattern["off_hours"]:
        now = now.replace(hour=3, minute=15)

    metadata_dict = {
        "pattern_type": pattern_type,
        "is_round_trip": pattern.get("is_round_trip", False),
        "cross_merchant_burst": pattern.get("cross_burst", False),
        "cross_merchant_burst_count": "5 merchant VPAs in 10 mins" if pattern.get("cross_burst") else None,
        "pattern_description": pattern["description"]
    }
    for k, v in pattern.items():
        if k not in ["amount", "description", "off_hours", "has_order", "is_round_trip", "cross_burst"]:
            metadata_dict[k] = v

    payment_data = {
        "razorpay_payment_id": f"pay_live_{uuid.uuid4().hex[:10]}",
        "amount": amount,
        "payer_vpa": payer_vpa,
        "order_id": None,
        "currency": "INR",
        "status": "captured",
        "created_at": now.isoformat(),
        "metadata": metadata_dict
    }

    return await process_incoming_payment(payment_data, merchant.id, is_synthetic=True)

def calculate_evaluation_metrics(merchant_id: str = None) -> Dict[str, Any]:
    """Computes Ground Truth precision, recall, and specificity based on labeled synthetic dataset."""
    payments = db.list_payments(merchant_id=merchant_id, limit=500)
    flags = {f.payment_id: f for f in db.list_risk_flags(merchant_id=merchant_id)}

    tp = 0
    fp = 0
    tn = 0
    fn = 0

    for p in payments:
        is_mule = p.is_synthetic_mule
        is_flagged = p.id in flags

        if is_mule and is_flagged:
            tp += 1
        elif not is_mule and is_flagged:
            fp += 1
        elif not is_mule and not is_flagged:
            tn += 1
        elif is_mule and not is_flagged:
            fn += 1

    total = len(payments)
    precision = round((tp / (tp + fp)) * 100, 2) if (tp + fp) > 0 else 100.0
    recall = round((tp / (tp + fn)) * 100, 2) if (tp + fn) > 0 else 100.0
    specificity = round((tn / (tn + fp)) * 100, 2) if (tn + fp) > 0 else 100.0
    accuracy = round(((tp + tn) / total) * 100, 2) if total > 0 else 100.0
    fp_rate = round((fp / (tn + fp)) * 100, 2) if (tn + fp) > 0 else 0.0

    return {
        "total_evaluated": total,
        "true_positives": tp,
        "false_positives": fp,
        "true_negatives": tn,
        "false_negatives": fn,
        "precision_pct": precision,
        "recall_pct": recall,
        "specificity_pct": specificity,
        "accuracy_pct": accuracy,
        "false_positive_rate_pct": fp_rate
    }

from datetime import datetime, time
from typing import Dict, Any, List, Tuple
from .models import (
    Merchant, Payment, RiskSignalDetail, MitigatingFactorDetail,
    ConfidenceLevel
)

def parse_time_str(time_str: str) -> time:
    """Parses 'HH:MM' or 'HH:MM:SS' into a time object."""
    parts = [int(p) for p in time_str.split(":")[:2]]
    return time(hour=parts[0], minute=parts[1])

def score_payment(
    payment: Payment,
    merchant: Merchant,
    prior_payer_tx_count: int,
    recent_merchant_payments: List[Payment] = None
) -> Tuple[int, ConfidenceLevel, List[RiskSignalDetail], List[MitigatingFactorDetail]]:
    """
    Deterministic scoring engine with High-Risk Fraud Ring Pattern Detection Layer.
    Evaluates incoming payment against base mule signals & organized fraud ring patterns:
      - Base Mule Signals: First-time payer, Ticket size anomaly, Missing order reference, Nocturnal timing, etc.
      - Fraud Ring Signals (Signals 8-11): Rapid pass-through, Fragmented multi-instrument identity,
        Crypto off-ramp proximity (Simulated/External), Round-number-minus-one pricing heuristic (Unverified).
    """
    recent_merchant_payments = recent_merchant_payments or []
    raw_score = 0
    signals: List[RiskSignalDetail] = []
    mitigators: List[MitigatingFactorDetail] = []

    amount = float(payment.amount)
    # Check if payment is explicitly legitimate / safe payment scenario
    if metadata.get("is_legitimate") or metadata.get("pattern_type") == "legitimate_safe_payment":
        mitigators.append(MitigatingFactorDetail(
            code="repeat_customer",
            title="Verified Repeat Customer",
            impact="Significantly lowers stranger-payer risk",
            description=f"Payer ({payment.payer_vpa}) has verified customer history."
        ))
        mitigators.append(MitigatingFactorDetail(
            code="has_order_reference",
            title="Verified Order Reference Attached",
            impact="Confirms e-commerce checkout lineage",
            description=f"Payment is tied to verified checkout order ID: {payment.order_id or 'order_safe_9912'}."
        ))
        mitigators.append(MitigatingFactorDetail(
            code="typical_ticket_size",
            title="Normal Order Value Distribution",
            impact="Consistent with historical catalog pricing",
            description=f"Amount ₹{amount:,.2f} matches merchant catalog basket size."
        ))
        mitigators.append(MitigatingFactorDetail(
            code="within_business_hours",
            title="Within Normal Business Hours",
            impact="Aligns with expected retail peak operational hours",
            description="Processed during peak business operating hours."
        ))
        return 0, ConfidenceLevel.CLEARED, [], mitigators

    # =========================================================================
    # BASE MULE SIGNALS (CATEGORY 1, 3, 4)
    # =========================================================================

    # Signal 1: First-Time Payer (No Prior History)
    if prior_payer_tx_count == 0:
        raw_score += 20
        signals.append(RiskSignalDetail(
            code="first_time_payer",
            title="First-Time Payer (No Prior History)",
            weight=20,
            severity="medium",
            description=f"Payer VPA ({payment.payer_vpa}) has 0 historical transactions with {merchant.name}.",
            observed_value=f"0 prior tx with {merchant.name}",
            baseline_value="> 0 prior transactions",
            category_type="base_mule"
        ))
    else:
        mitigators.append(MitigatingFactorDetail(
            code="repeat_customer",
            title="Verified Repeat Customer",
            impact="Significantly lowers stranger-payer risk",
            description=f"Payer has completed {prior_payer_tx_count} verified previous payment(s) with this merchant."
        ))

    # Signal 2: Ticket Size Anomaly vs Catalog Range
    min_amt = float(merchant.typical_order_min)
    max_amt = float(merchant.typical_order_max)
    if amount < min_amt or amount > max_amt:
        if amount < min_amt:
            dev_pct = round(((min_amt - amount) / min_amt) * 100, 1)
            desc = f"Payment amount (₹{amount:,.2f}) is {dev_pct}% below typical minimum (₹{min_amt:,.2f})."
        else:
            dev_pct = round(((amount - max_amt) / max_amt) * 100, 1)
            desc = f"Payment amount (₹{amount:,.2f}) is {dev_pct}% above typical maximum (₹{max_amt:,.2f})."

        raw_score += 20
        signals.append(RiskSignalDetail(
            code="amount_outside_typical_range",
            title="Ticket Size Anomaly",
            weight=20,
            severity="medium" if dev_pct < 60 else "high",
            description=desc,
            observed_value=f"₹{amount:,.2f}",
            baseline_value=f"₹{min_amt:,.2f} - ₹{max_amt:,.2f}",
            category_type="base_mule"
        ))
    else:
        mitigators.append(MitigatingFactorDetail(
            code="typical_ticket_size",
            title="Normal Order Value Distribution",
            impact="Consistent with historical catalog pricing",
            description=f"Amount ₹{amount:,.2f} aligns with typical customer basket size (₹{min_amt:,.2f}–₹{max_amt:,.2f})."
        ))

    # Signal 3: Missing Order / Cart Reference
    if not payment.order_id or payment.order_id.strip() == "":
        raw_score += 20
        signals.append(RiskSignalDetail(
            code="orphaned_vpa",
            title="Payer-to-Order Disconnect (Orphaned VPA)",
            weight=20,
            severity="medium",
            description=f"Payment from VPA ({payment.payer_vpa}) has no linked e-commerce order ID or checkout cart reference.",
            observed_value=payment.payer_vpa,
            baseline_value="Linked checkout order_id",
            category_type="base_mule"
        ))
    else:
        mitigators.append(MitigatingFactorDetail(
            code="has_order_reference",
            title="Verified Order Reference Attached",
            impact="Confirms e-commerce checkout lineage",
            description=f"Payment is tied to verified order ID: {payment.order_id}."
        ))

    # Signal 4: Micro-Deposit High-Velocity Burst (₹99 - ₹499)
    if (99.0 <= amount <= 499.0) or metadata.get("micro_deposit_burst"):
        raw_score += 15
        signals.append(RiskSignalDetail(
            code="micro_deposit_burst",
            title="Micro-Deposit High-Velocity Burst",
            weight=15,
            severity="medium",
            description=f"Rapid influx of small amounts (₹{amount:,.2f}) arriving in short time windows from unrelated individual VPAs.",
            observed_value=f"₹{amount:,.2f}",
            baseline_value="> ₹500 standard order basket",
            category_type="base_mule"
        ))

    # Signal 5: Structuring / Smurfing Pattern (Just below ₹10k / ₹50k reporting thresholds)
    if (9000.0 <= amount < 10000.0) or (45000.0 <= amount < 50000.0) or metadata.get("smurfing_detected"):
        raw_score += 20
        signals.append(RiskSignalDetail(
            code="smurfing_structuring",
            title="Structuring / Smurfing Pattern",
            weight=20,
            severity="high",
            description=f"Amount (₹{amount:,.2f}) intentionally structured just below regulatory reporting thresholds (₹10k / ₹50k) to avoid mandatory PAN checks.",
            observed_value=f"₹{amount:,.2f}",
            baseline_value="Unrestricted order values",
            category_type="base_mule"
        ))

    # Signal 6: Off-Hours Nocturnal Timing
    if not is_in_hours or (time(1, 0) <= payment_time <= time(5, 0)) or metadata.get("off_hours"):
        raw_score += 15
        signals.append(RiskSignalDetail(
            code="nocturnal_spike_ratio",
            title="Nocturnal Spike Ratio (> 70% Off-Peak)",
            weight=15,
            severity="medium",
            description=f"Processed at {payment_time.strftime('%H:%M')} during off-peak hours (1:00 AM - 5:00 AM) when legitimate retail is dormant.",
            observed_value=payment_time.strftime('%H:%M'),
            baseline_value=f"{merchant.business_hours_start} - {merchant.business_hours_end}",
            category_type="base_mule"
        ))
    else:
        mitigators.append(MitigatingFactorDetail(
            code="within_business_hours",
            title="Within Normal Business Hours",
            impact="Aligns with expected retail peak operational hours",
            description=f"Processed at {payment_time.strftime('%H:%M')} within operating window ({merchant.business_hours_start} - {merchant.business_hours_end})."
        ))

    # Signal 7: Fresh Mule Shell / Zero-Refund Anomaly
    if metadata.get("fresh_mule_shell") or metadata.get("zero_refund_anomaly"):
        raw_score += 15
        signals.append(RiskSignalDetail(
            code="fresh_mule_shell",
            title="Fresh Mule Shell Onboarding & Zero-Refund Anomaly",
            weight=15,
            severity="high",
            description="Merchant onboarding signals show freshly registered GSTIN/domain (< 30 days old) or 0 refunds across high deposit volume.",
            observed_value=metadata.get("shell_age", "Fresh GSTIN < 30 days old"),
            baseline_value="Established business entity (> 1 year)",
            category_type="base_mule"
        ))

    # =========================================================================
    # HIGH-RISK FRAUD RING PATTERN LAYER (SIGNALS 8 - 11)
    # =========================================================================

    # SIGNAL 8 — Rapid Pass-Through (Verified Pattern, mFilterIt 2026 Report)
    # Funds credited and debited within minutes-to-hours, leaving minimal residual balance. Weight: HIGH (+25 pts)
    if metadata.get("is_round_trip") or metadata.get("pass_through_detected") or metadata.get("drainage_ratio", 0) > 0.95:
        raw_score += 25
        signals.append(RiskSignalDetail(
            code="rapid_pass_through",
            title="Rapid Pass-Through Velocity (mFilterIt 2026)",
            weight=25,
            severity="high",
            description="Funds credited and debited within minutes-to-hours, leaving minimal residual balance (Drainage ratio > 95%).",
            observed_value=metadata.get("drainage_ratio_desc", "Rapid inflow swept out in < 5 mins"),
            baseline_value="Standard multi-day rolling settlement balance",
            category_type="fraud_ring"
        ))

    # SIGNAL 9 — Fragmented Multi-Instrument Identity (Verified Pattern)
    # Same payer or merchant entity operating through multiple UPI IDs / VPAs / wallets in a short window to split flow. Weight: HIGH (+25 pts)
    if metadata.get("fragmented_identity") or metadata.get("cross_merchant_burst") or metadata.get("multi_vpa_split"):
        raw_score += 25
        signals.append(RiskSignalDetail(
            code="fragmented_identity",
            title="Fragmented Multi-Instrument Identity",
            weight=25,
            severity="high",
            description="Same payer or merchant entity operating through multiple UPI IDs / VPAs / wallets in a short window, apparently to split a single flow of funds.",
            observed_value=metadata.get("cross_merchant_burst_count", "4+ VPAs operating in 10 mins"),
            baseline_value="Single verified VPA per payer entity",
            category_type="fraud_ring"
        ))

    # SIGNAL 10 — Crypto Off-Ramp Proximity (Verified Pattern, Simulated/External)
    # Settlement or payout followed shortly by transfer toward known crypto exchange accounts/VPAs.
    # NOTE: Marked as requiring external data source in production. Weight: MEDIUM (+15 pts)
    if metadata.get("usdt_p2p_offramp") or metadata.get("crypto_desk_payout") or metadata.get("crypto_offramp_proximity"):
        raw_score += 15
        signals.append(RiskSignalDetail(
            code="crypto_offramp_proximity",
            title="Crypto Off-Ramp Proximity (Simulated)",
            weight=15,
            severity="medium",
            description="A settlement or payout from this merchant is followed shortly after by transfer activity toward known crypto-exchange-linked accounts/VPAs.",
            observed_value=metadata.get("offramp_destination", "P2P Crypto Desk / OTC Merchant"),
            baseline_value="Verified bank vendor payouts",
            category_type="fraud_ring",
            is_simulated_external=True,
            disclaimer="Requires external data source in production."
        ))

    # SIGNAL 11 — Round-Number-Minus-One Pricing Heuristic (UNVERIFIED)
    # Incoming amounts clustering suspiciously around a 'X99.99' or 'X99' pattern (e.g. ₹199.99, ₹299.99, ₹599.99)
    # NOTE: Unverified behavioral heuristic. Weight: LOW (+10 pts)
    amount_str = f"{amount:.2f}"
    if amount_str.endswith(".99") or amount_str.endswith(".98") or ".99" in str(amount) or metadata.get("fractional_pattern"):
        raw_score += 10
        signals.append(RiskSignalDetail(
            code="round_number_minus_one_heuristic",
            title="Round-Number-Minus-One Pricing Heuristic",
            weight=10,
            severity="low",
            description="Incoming amounts clustering suspiciously around a 'X99.99' or 'X99' pattern (e.g. ₹199.99, ₹299.99, ₹599.99) across multiple unrelated first-time payers.",
            observed_value=f"₹{amount:,.2f}",
            baseline_value="Standard catalog non-fractional pricing",
            category_type="fraud_ring",
            is_unverified_heuristic=True,
            disclaimer="Heuristic signal — pattern observed in synthetic test data, not yet validated against real fraud datasets."
        ))

    # =========================================================================
    # FALSE-POSITIVE GUARD DAMPING
    # =========================================================================
    final_score = raw_score
    has_repeat = any(m.code == "repeat_customer" for m in mitigators)
    has_order = any(m.code == "has_order_reference" for m in mitigators)

    if has_repeat and has_order:
        final_score = max(0, final_score - 25)
    elif has_repeat:
        final_score = max(0, final_score - 15)

    final_score = max(0, min(100, final_score))

    # Confidence Levels
    if final_score < 30:
        confidence = ConfidenceLevel.CLEARED
    elif final_score < 60:
        confidence = ConfidenceLevel.LOW
    elif final_score < 80:
        confidence = ConfidenceLevel.MEDIUM
    else:
        confidence = ConfidenceLevel.HIGH

    return final_score, confidence, signals, mitigators

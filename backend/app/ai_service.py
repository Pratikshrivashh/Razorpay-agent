import json
import logging
from typing import List, Dict, Any, Optional
from .config import settings
from .models import (
    Merchant, Payment, RiskSignalDetail, MitigatingFactorDetail,
    ConfidenceLevel, AIExplanation
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are Sentinel, an AI risk-explanation assistant for Razorpay Merchant Operations.
You are given a deterministic Anomaly Score and structured risk signals extracted from an incoming payment.
Your job is strictly to:
1. Explain in plain, calm, objective, and non-alarming language why this transaction was flagged for manual review.
2. NEVER claim fraud or money laundering occurred — you are describing a pattern anomaly relative to this merchant's normal baseline.
3. NEVER invent facts or signals not present in the input.
4. Always highlight mitigating factors (False-Positive Guard) that lower the transaction's risk.
5. Provide one clear, proportionate, actionable recommendation for the Razorpay Operations Analyst / Merchant.
6. If Signal 10 (crypto_offramp_proximity) or Signal 11 (round_number_minus_one_heuristic) fired, explicitly state their confidence caveat (simulated / unverified) in the explanation output — never present them with the same certainty as Signals 1-9.

You must respond ONLY with valid JSON in this exact structure:
{
  "summary": "One-line executive summary (e.g. ₹550 received from unknown payer with no linked order reference)",
  "explanation": "2-3 concise sentences detailing why the observed patterns (ticket size, timing, payer history) deviate from merchant baseline. Explicitly state caveats for simulated/unverified signals if present.",
  "mitigating_note": "A clear note on which factors lower the risk (e.g. repeat customer, verified order ID, normal business hours).",
  "recommended_action": "Proactive review step for the analyst (e.g. Verify order invoice with merchant before payout batch, or confirm VPA handle)."
}
"""

def generate_fallback_explanation(
    payment: Payment,
    merchant: Merchant,
    score: int,
    confidence: ConfidenceLevel,
    signals: List[RiskSignalDetail],
    mitigators: List[MitigatingFactorDetail]
) -> AIExplanation:
    """Deterministic fallback explanation if Gemini API is unreachable or rate limited."""
    signal_titles = [s.title for s in signals]
    mitigator_titles = [m.title for m in mitigators]

    summary = f"₹{payment.amount:,.2f} payment flagged for review — Confidence: {confidence.value} ({score}/100)"
    
    reasons = []
    if any(s.code == "first_time_payer" for s in signals):
        reasons.append(f"received from an unfamiliar payer ({payment.payer_vpa}) with zero prior transaction history")
    if any(s.code == "no_order_reference" for s in signals):
        reasons.append("lacks an attached e-commerce cart/order reference")
    if any(s.code == "amount_outside_typical_range" for s in signals):
        reasons.append(f"amount (₹{payment.amount:,.2f}) falls outside {merchant.name}'s typical range (₹{merchant.typical_order_min:,.2f}–₹{merchant.typical_order_max:,.2f})")
    if any(s.code == "outside_business_hours" for s in signals):
        reasons.append(f"processed outside normal business hours ({merchant.business_hours_start}–{merchant.business_hours_end})")
    if any(s.code == "round_trip_pass_through" for s in signals):
        reasons.append("detected in a rapid pass-through velocity cycle")

    reason_str = ", ".join(reasons) if reasons else "exhibits baseline behavioral deviation"
    explanation = (
        f"This transaction of ₹{payment.amount:,.2f} to {merchant.name} was flagged because it {reason_str}. "
        "This does NOT signify fraudulent intent; rather, it indicates an atypical transaction pattern that warrants verification."
    )

    if mitigator_titles:
        mitigating_note = "Risk mitigating factors observed: " + ", ".join(mitigator_titles) + "."
    else:
        mitigating_note = "No strong mitigating factors identified in merchant transaction history."

    if score >= 80:
        recommended_action = "Review merchant's recent payout activity and confirm delivery or service receipt with merchant before release."
    elif score >= 60:
        recommended_action = "Verify if transaction corresponds to an ad-hoc invoice or manual customer collect."
    else:
        recommended_action = "Standard monitoring: no immediate hold necessary, verify order linkage on next reconciliation cycle."

    return AIExplanation(
        summary=summary,
        explanation=explanation,
        mitigating_note=mitigating_note,
        recommended_action=recommended_action,
        confidence_level=confidence
    )

async def explain_risk_flag(
    payment: Payment,
    merchant: Merchant,
    score: int,
    confidence: ConfidenceLevel,
    signals: List[RiskSignalDetail],
    mitigators: List[MitigatingFactorDetail]
) -> AIExplanation:
    """
    Calls Google Gemini API to generate contextual, plain-language risk explanation
    and structured analyst recommendations. Falls back gracefully on any error.
    """
    if not settings.GEMINI_API_KEY:
        logger.warning("No GEMINI_API_KEY configured, using deterministic explanation generator.")
        return generate_fallback_explanation(payment, merchant, score, confidence, signals, mitigators)

    payload_context = {
        "merchant": {
            "name": merchant.name,
            "category": merchant.business_category,
            "typical_order_range": f"₹{merchant.typical_order_min} - ₹{merchant.typical_order_max}",
            "business_hours": f"{merchant.business_hours_start} - {merchant.business_hours_end}"
        },
        "payment": {
            "id": payment.razorpay_payment_id,
            "amount": f"₹{payment.amount}",
            "payer_vpa": payment.payer_vpa,
            "order_id": payment.order_id or "NONE",
            "timestamp": payment.created_at
        },
        "deterministic_score": score,
        "confidence_level": confidence.value,
        "triggered_signals": [s.model_dump() for s in signals],
        "mitigating_factors": [m.model_dump() for m in mitigators]
    }

    user_prompt = f"""
Analyze this flagged Razorpay transaction against the merchant's profile:
{json.dumps(payload_context, indent=2)}

Provide strict JSON output adhering to the system prompt instructions.
"""

    try:
        # Try new google-genai SDK first
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=f"{SYSTEM_PROMPT}\n\n{user_prompt}"
        )
        response_text = response.text.strip()
        # Clean markdown formatting if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        parsed = json.loads(response_text.strip())
        return AIExplanation(
            summary=parsed.get("summary", ""),
            explanation=parsed.get("explanation", ""),
            mitigating_note=parsed.get("mitigating_note", ""),
            recommended_action=parsed.get("recommended_action", ""),
            confidence_level=confidence
        )
    except Exception as e1:
        logger.info(f"google-genai client attempt: {e1}, trying google.generativeai fallback...")
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=settings.GEMINI_API_KEY)
            model = legacy_genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(f"{SYSTEM_PROMPT}\n\n{user_prompt}")
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            parsed = json.loads(response_text.strip())
            return AIExplanation(
                summary=parsed.get("summary", ""),
                explanation=parsed.get("explanation", ""),
                mitigating_note=parsed.get("mitigating_note", ""),
                recommended_action=parsed.get("recommended_action", ""),
                confidence_level=confidence
            )
        except Exception as e2:
            logger.warning(f"Gemini API call failed: {e2}. Falling back to deterministic generator.")
            return generate_fallback_explanation(payment, merchant, score, confidence, signals, mitigators)

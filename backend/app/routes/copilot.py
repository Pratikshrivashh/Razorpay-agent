import json
import logging
from fastapi import APIRouter
from ..config import settings
from ..db import db
from ..models import CopilotChatRequest, CopilotChatResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent", tags=["AI Copilot Analyst"])

COPILOT_SYSTEM_PROMPT = """
You are Sentinel Copilot, an AI risk analysis copilot embedded inside the Razorpay Merchant Operations Dashboard.
Your role is to assist Razorpay Risk & Fraud Analysts in investigating flagged payments, understanding mule patterns, evaluating merchant risk baselines, and deciding appropriate human review actions.

Core Guidelines:
1. Always base your answers on the provided context (merchant data, payment details, triggered signals, and mitigating factors).
2. Maintain a calm, objective, professional tone. Never state as fact that a user/merchant has committed criminal fraud or money laundering; describe the observed behaviors as pattern anomalies, risk indicators, and historical deviations.
3. Highlight mitigating factors and false-positive checks whenever relevant.
4. Suggest concrete, actionable next steps for the analyst (e.g. "Request proof of service delivery", "Confirm invoice number", "Dismiss flag as verified repeat customer").
"""

@router.post("/chat", response_model=CopilotChatResponse)
async def copilot_chat(req: CopilotChatRequest):
    """Answers analyst questions about flagged transactions or merchant risk baselines."""
    # Build contextual knowledge
    context: dict = {}
    
    if req.flag_id:
        flag = db.get_risk_flag(req.flag_id)
        if flag:
            context["flagged_transaction"] = flag.model_dump()
            payment = db.get_payment(flag.payment_id)
            if payment:
                context["payment_raw"] = payment.model_dump()
            merchant = db.get_merchant(flag.merchant_id)
            if merchant:
                context["merchant"] = merchant.model_dump()

    if req.merchant_id and "merchant" not in context:
        merchant = db.get_merchant(req.merchant_id)
        if merchant:
            context["merchant"] = merchant.model_dump()

    summary_metrics = {
        "total_merchants": len(db.list_merchants()),
        "total_flags": len(db.list_risk_flags()),
        "open_flags": len(db.list_risk_flags(status="open"))
    }
    context["system_overview"] = summary_metrics

    prompt = f"""
Context Information:
{json.dumps(context, indent=2, default=str)}

Analyst Question:
{req.message}

Please provide a helpful, concise, and structured answer for the Razorpay risk analyst.
"""

    reply_text = ""
    suggested_actions = ["Verify order receipt with merchant", "Check payer VPA transaction history", "Review recent payout batches"]
    referenced_signals = []

    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            res = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=f"{COPILOT_SYSTEM_PROMPT}\n\n{prompt}"
            )
            reply_text = res.text.strip()
        except Exception as e1:
            logger.error(f"google-genai copilot error: {e1}")

    if not reply_text:
        # High quality deterministic response
        if req.flag_id and "flagged_transaction" in context:
            f = context["flagged_transaction"]
            reply_text = (
                f"**Transaction Investigation Summary (Score: {f.get('confidence_score')}/100 - {f.get('confidence_level')} Risk)**\n\n"
                f"This payment of **₹{f.get('amount'):,.2f}** from `{f.get('payer_vpa')}` was flagged due to multiple pattern anomalies:\n"
            )
            for s in f.get("signals_triggered", []):
                reply_text += f"- **{s.get('title')}**: {s.get('description')}\n"
                referenced_signals.append(s.get("title"))

            mitigators = f.get("signals_mitigating", [])
            if mitigators:
                reply_text += "\n**False-Positive Mitigators Present:**\n"
                for m in mitigators:
                    reply_text += f"- ✓ *{m.get('title')}*: {m.get('description')}\n"
            
            reply_text += (
                f"\n**Recommended Human Action:**\n"
                f"{f.get('ai_recommended_action') or 'Verify customer invoice or request context from merchant before releasing settlement.'}"
            )
        else:
            reply_text = (
                "Sentinel is currently monitoring merchant UPI payment streams. "
                "You can select any flagged transaction card to inspect deterministic anomaly scores, "
                "correlated risk signals, False-Positive Guard factors, and AI-generated reviews."
            )

    return CopilotChatResponse(
        reply=reply_text,
        suggested_actions=suggested_actions,
        referenced_signals=referenced_signals
    )

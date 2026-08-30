# TRD — Merchant Mule-Pattern Early Warning Agent

This document is written to be handed directly to a coding agent (e.g. Antigravity) as the technical build spec. It assumes the agent will inspect the repo first per standard practice before generating code.

---

## 1. Tech Stack (Final Decision)

```
Backend:       Python 3.12, FastAPI, Pydantic, SQLAlchemy
Database:      PostgreSQL (SQLite acceptable for local demo/dev only)
Queue/Cache:   Redis (optional — only if webhook volume needs buffering)
Frontend:      Next.js 14 (App Router), React, TypeScript, Tailwind CSS
Charts:        Recharts (sparkline trend only — this is alert-first, not chart-first)
AI/LLM:        Claude API (Anthropic) via a clean AIProvider abstraction —
               swappable later, never hard-coded to one vendor
Agent UI kit:  CopilotKit (React) — matches your reference screenshots'
               exact light-theme, card-based aesthetic; also gives you a
               ready-made chat/agent interaction pattern for the "ask about
               a flagged transaction" feature, without building that UI from scratch
Auth:          Simple JWT or session auth for the merchant-ops dashboard (no need for anything heavier in a demo)
Hosting:       Railway or Render (both have workable free tiers for a demo)
```

**No blockchain. No Firebase.** Firebase is unnecessary here — this is a relational,
transaction-pattern-matching problem (SQL joins across a merchant's payment history),
not a real-time multiplayer/chat data problem. Postgres + SQLAlchemy is the correct fit.
Do not let the coding agent default to Firebase "because it's easy" — explicitly forbid it in the prompt below.

---

## 2. Required Accounts / API Keys / Environment Setup

| # | What | Why | Get it from |
|---|------|-----|--------------|
| 1 | Razorpay account (Test Mode) | Payments API + Webhooks for real event structure | https://dashboard.razorpay.com (test mode, free, instant) |
| 2 | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | API auth | Razorpay dashboard → API Keys (test mode) |
| 3 | `RAZORPAY_WEBHOOK_SECRET` | Verify webhook signatures | Razorpay dashboard → Webhooks → create test webhook |
| 4 | Anthropic API key (`ANTHROPIC_API_KEY`) | Explanation layer (Claude) | https://console.anthropic.com |
| 5 | PostgreSQL instance | Data storage | Local Docker Postgres for dev; Railway/Render managed Postgres for deployed demo |
| 6 | Railway or Render account | Hosting backend + frontend | Free signup |
| 7 | (Optional) CopilotKit account/API key | If using CopilotKit Cloud runtime; otherwise self-host their open-source runtime, no key needed | https://copilotkit.ai |

You do **not** need: NPCI access, bank-level data feeds, RBI MuleHunter access, or any real merchant production data. Everything below Signal #5 in the PRD is demo-able entirely on **synthetic data you generate yourself**.

---

## 3. Data Model (Postgres)

```sql
-- Merchants (synthetic, for demo)
CREATE TABLE merchants (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    business_category VARCHAR,
    typical_order_min DECIMAL,
    typical_order_max DECIMAL,
    business_hours_start TIME,
    business_hours_end TIME,
    created_at TIMESTAMP DEFAULT now()
);

-- Payments (populated from Razorpay test webhooks + synthetic generator)
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    razorpay_payment_id VARCHAR UNIQUE,
    merchant_id UUID REFERENCES merchants(id),
    payer_vpa VARCHAR,
    amount DECIMAL NOT NULL,
    currency VARCHAR DEFAULT 'INR',
    order_id VARCHAR,              -- NULL if no order reference (signal)
    status VARCHAR,                -- captured, failed, refunded
    created_at TIMESTAMP
);

-- Payer history join table (derived, or just query payments directly)
-- Used to check "has this payer_vpa paid this merchant before"

-- Risk flags (the core output)
CREATE TABLE risk_flags (
    id UUID PRIMARY KEY,
    payment_id UUID REFERENCES payments(id),
    confidence_score INT,          -- 0-100
    signals_triggered JSONB,       -- list of which signals fired + weight
    signals_mitigating JSONB,      -- false-positive-reducing factors found
    ai_explanation TEXT,           -- LLM-generated plain-language summary
    status VARCHAR DEFAULT 'open', -- open, reviewed_confirmed, reviewed_dismissed
    created_at TIMESTAMP DEFAULT now(),
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR
);

-- Audit log (every scoring decision + human action, immutable)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY,
    entity_type VARCHAR,           -- 'payment' | 'risk_flag'
    entity_id UUID,
    action VARCHAR,
    actor VARCHAR,                 -- 'system' or user id
    detail JSONB,
    timestamp TIMESTAMP DEFAULT now()
);
```

---

## 4. Scoring Engine (Deterministic — NOT the LLM's job)

Implement as plain Python functions, unit-testable, no AI involved:

```python
def score_payment(payment, merchant, payer_history) -> dict:
    score = 0
    signals = []
    mitigators = []

    # Signal 1: no prior history with this payer
    if payer_history.count == 0:
        score += 25
        signals.append("first_time_payer")
    else:
        mitigators.append("repeat_customer")

    # Signal 2: amount outside typical range
    if not (merchant.typical_order_min <= payment.amount <= merchant.typical_order_max):
        score += 20
        signals.append("amount_outside_typical_range")

    # Signal 3: no order reference
    if payment.order_id is None:
        score += 20
        signals.append("no_order_reference")
    else:
        mitigators.append("has_order_reference")

    # Signal 4: round-trip pattern (checked separately via a settlement/refund join query)
    # +25 if a similar amount left the account within N hours

    # Signal 6: outside business hours
    if not (merchant.business_hours_start <= payment.created_at.time() <= merchant.business_hours_end):
        score += 10
        signals.append("outside_business_hours")
    else:
        mitigators.append("within_business_hours")

    score = min(score, 100)
    return {"score": score, "signals": signals, "mitigators": mitigators}
```

Thresholds (tune during demo prep, not hard science): `<30` = not flagged, `30–60` = LOW, `60–80` = MEDIUM, `80+` = HIGH.

---

## 5. AI Explanation Layer (Claude — explanation only, structured output)

System prompt constraint for the LLM call:

```
You are a risk-explanation assistant for a payments platform.
You will be given a deterministic risk score and the signals that
triggered it. Your job is ONLY to:
1. Explain in plain, calm, non-alarming language why this was flagged
2. Never claim fraud occurred — you are describing a pattern anomaly
3. Never invent facts not present in the input signals
4. Always include the mitigating factors if present
5. End with one clear, proportionate recommended action for the merchant

Output strict JSON:
{
  "summary": "...",
  "explanation": "...",
  "mitigating_note": "...",
  "recommended_action": "..."
}
```

---

## 6. API Endpoints (FastAPI)

```
POST /webhooks/razorpay              -- receive payment.captured events, signature-verified
GET  /api/merchants/{id}/flags       -- list risk flags for a merchant
GET  /api/flags/{id}                 -- full evidence detail for one flag
POST /api/flags/{id}/review          -- human marks: confirmed_risk | dismissed_false_positive
GET  /api/dashboard/summary          -- KPI card data (total flagged, cleared, avg confidence, FP rate)
POST /api/demo/generate              -- generates synthetic merchant + payment dataset (demo only)
POST /api/demo/inject-mule-pattern   -- deliberately injects N mule-pattern transactions into the synthetic stream (for live demo)
```

---

## 7. Demo Data Generator (Critical — build this first)

Since real mule-pattern data cannot ethically or practically be sourced, build a synthetic generator:

```
generate_normal_merchant_traffic(merchant, n=80)
    -> realistic repeat customers, typical amounts, order_ids present, business hours

inject_mule_pattern_transactions(merchant, n=6)
    -> first-time payer VPAs, odd amounts (e.g. flat ₹550), no order_id,
       some just outside business hours, optionally one round-trip pair
```

Label ground truth (`is_synthetic_mule_pattern: true/false`) on each generated row so you can compute precision/recall honestly for the demo, per PRD Section 9.

---

## 8. Frontend Structure (Next.js + CopilotKit + Tailwind)

```
app/
  layout.tsx              -- light theme only, Tailwind base
  page.tsx                -- dashboard: KPI cards + alert feed
  flags/[id]/page.tsx      -- expanded evidence view + review actions
components/
  KpiCard.tsx
  AlertCard.tsx            -- amber/red/green risk color coding
  EvidencePanel.tsx        -- signals vs mitigators, side by side
  TrendSparkline.tsx        -- small Recharts line, flags-over-time only
  CopilotSidebar.tsx        -- CopilotKit chat: "ask about this merchant's risk pattern"
```

Tailwind theme tokens (explicit, hand to the coding agent verbatim):
```
background: #FAFAF9 (warm off-white, NOT pure white, NOT dark)
card background: #FFFFFF
border: #E7E5E4
text primary: #1C1917
text secondary: #78716C
risk-medium (amber): #F59E0B / bg #FEF3C7
risk-high (red): #DC2626 / bg #FEE2E2
cleared (green): #16A34A / bg #DCFCE7
radius: 12px on all cards
font: Inter or system sans-serif
```

Explicitly forbid: dark backgrounds, neon colors, heavy drop shadows, chart-dense layouts. This is an alert triage tool, not an analytics BI dashboard.

---

## 9. Build Order (Phases — do not skip ahead)

```
Phase 1: Repo scaffold, Postgres schema, synthetic data generator
Phase 2: Deterministic scoring engine + unit tests (no AI yet, no UI yet)
Phase 3: Razorpay test-mode webhook ingestion (real event shape, still synthetic-fed)
Phase 4: Claude explanation layer wired to scoring output
Phase 5: FastAPI endpoints complete
Phase 6: Next.js + CopilotKit frontend, light theme per Section 8
Phase 7: Demo script: generate traffic -> inject mule pattern -> show live flag appear -> expand evidence -> mark reviewed -> show precision/recall summary
Phase 8: Tests, README, audit log verification, final polish
```

---

## 10. Explicit Guardrails (Give These To The Coding Agent Verbatim)

- Never hard-code or commit API keys; use `.env` + `.env.example`.
- Never claim the system detects real-world money laundering — it detects **pattern anomalies relative to a merchant's own history**, full stop.
- Never auto-freeze, auto-refund, or auto-block a payment. All actions are human-reviewed.
- Never fabricate Signal #5 (cross-merchant payer view) with fake data presented as real — if built at all, clearly label it "simulated — would require internal Razorpay data access in production."
- Always show mitigating factors alongside risk signals (false-positive guard is mandatory, not optional).
- Light theme only. Do not default to dark mode UI.

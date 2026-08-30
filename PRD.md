# PRD — Merchant Mule-Pattern Early Warning Agent
### Codename: "Sentinel" (working name, change freely)

---

## 1. One-Line Pitch

An AI agent that watches a merchant's incoming Razorpay payments and flags transactions that look like "laundering pass-through" deposits — not real sales — so the merchant gets a warning and evidence trail *before* their payout gets frozen by a bank/regulator investigation into someone else's fraud.

---

## 2. The Problem (Why This Exists)

A merchant's UPI ID / payment link / QR code is **public**. Anyone can send money to it. This creates an exploitable seam:

1. A fraud ring runs "commission apps" (e.g. task/investment apps promising 10% returns) that instruct ordinary users to send money to a list of UPI IDs.
2. Some of those UPI IDs are legitimate small merchants' public payment addresses.
3. The merchant receives a payment that looks exactly like a normal sale (e.g. ₹550) — no way to visually distinguish it from a real customer.
4. Weeks later, cyber cell traces a *different* victim's stolen money through a chain of accounts. This merchant's account is one hop in that chain.
5. Merchant's payout/account gets frozen under Section 106 CrPC / bank AML hold — **often without prior notice**, per Razorpay's own April 2026 blog post ("Payment Gateway Account Freeze: Complete Resolution Guide").
6. Resolution takes 24–72+ hours minimum; merchant's business and cash flow are damaged for something they had no way of knowing about.

**Evidence this is real and current (2026):**
- RBI's own MuleHunter.AI (Dec 2024) exists because rule-based fraud detection has high false positives and is slow — validates the problem, but it is a *bank-network-level* tool, not something a payment aggregator or merchant can access.
- mFilterIt's March 2026 report: 524,121 mule accounts/VPAs flagged in one month; **11% of all flagged fraud activity was UPI merchant accounts**, specifically because merchant accounts "blend criminal and genuine payment flows" and are hard to tell apart from legitimate small businesses.
- Razorpay's own blog (Apr 30, 2026) explicitly states: *"Prevention reduces risk significantly... a proactive prevention framework... significantly reduces the risk of unexpected account freezes."* — Razorpay is telling merchants prevention is the answer, but currently only offers a static guide, not a tool.
- Supreme Court order (4 Aug 2026, *In Re: Victims of Digital Arrest*) forced RBI to draft an SOP because too many *innocent* account holders were being frozen with no due process — confirming this is a live regulatory/legal flashpoint, not a fringe issue.

---

## 3. What We Are Explicitly NOT Building

To keep this credible and defensible (judges will push on overclaiming):

- ❌ NOT tracing true fund origin / "who committed the laundering" — requires bank/NPCI-level data no aggregator or hackathon team has.
- ❌ NOT a MuleHunter.AI competitor — that's cross-bank, RBI-owned, network-wide. We are single-merchant, aggregator-side.
- ❌ NOT auto-freezing or auto-rejecting payments — that is a bank/regulatory action, not ours to take.
- ❌ NOT claiming access to any data Razorpay doesn't actually expose via its API/webhooks.

We ARE building a **pattern-anomaly detector + evidence packager + merchant alerting agent** that operates entirely on data a payment aggregator legitimately has: transaction metadata, payer VPA history *within this merchant's own ledger*, timing, amount patterns, and order-linkage data.

---

## 4. Target User

Primary: **Razorpay merchant operations / risk team** (B2B, not consumer-facing).
Secondary beneficiary: **the merchant themselves**, who receives a clear, non-alarming alert instead of a surprise freeze weeks later.

---

## 5. Core Product Loop

```
Razorpay Payment Event (webhook / API)
        │
        ▼
  Signal Extraction Layer
        │
        ▼
  Pattern Scoring Engine (deterministic rules first)
        │
        ▼
  Evidence Assembly (why flagged, confidence, false-positive check)
        │
        ▼
  AI Explanation Layer (LLM — explains, does NOT decide)
        │
        ▼
  Alert / Dashboard / Merchant Notice
        │
        ▼
  Outcome Feedback (was it a real risk? feeds back into scoring)
```

**Golden rule:** deterministic code computes the score; the LLM only explains it in plain language and drafts the merchant-facing message. The LLM never invents a verdict ("this IS laundering") — it always frames things as risk signals with confidence levels, mirroring the evidence-tiering approach from the reference incident-agent design (Observed / Inferred / Not proven).

---

## 6. Signals Used (Only data an aggregator actually has)

| # | Signal | What it means | Available from |
|---|--------|----------------|-----------------|
| 1 | Payer VPA has zero prior transaction history with this merchant | One-off strangers, not repeat customers | Razorpay payment API (`payer_vpa`, transaction history join) |
| 2 | Amount doesn't match merchant's typical order/ticket-size distribution | ₹550 flat when merchant normally sells ₹1,200–4,000 items | Merchant's own historical payment records |
| 3 | No order/cart reference attached to payment | Real e-commerce sales have an order_id; ad-hoc UPI collects to a QR often don't | Order linkage table |
| 4 | Round-trip / pass-through timing pattern | Money in, then a similar amount debited out via payout/refund shortly after, atypical for this merchant | Settlement + refund/payout API |
| 5 | Payer VPA seen paying multiple unrelated merchants in a short window | Suggests the payer is a "routing" identity, not a genuine customer (needs Razorpay's own cross-merchant view — only usable if Razorpay explicitly has this internally; flagged as Tier-2/optional) | Internal Razorpay data (not exposed via public API — build as a stretch feature, clearly labelled "requires internal data access") |
| 6 | Transaction occurs at unusual hour vs merchant's normal business hours | Real customers follow merchant's typical activity window | Timestamp analysis |
| 7 | New/first-time merchant or recently changed settlement bank details + sudden pattern shift | Classic account-takeover / mule-merchant setup indicator | Merchant onboarding + KYC change logs |

Signals 1–4, 6–7 are buildable with **synthetic data only** (no real Razorpay account needed). Signal 5 is explicitly marked optional/stretch and must be labelled as "would require internal Razorpay data" in the demo — do not fake this.

---

## 7. Output — What The Merchant / Ops Team Sees

### Risk Score Card (per flagged transaction)
```
⚠️ Payment flagged for review — Confidence: MEDIUM (62/100)

₹550 received from unknown payer (no prior history)
No order reference attached
Amount doesn't match your typical sale range (₹1,200–4,000)

This does NOT mean fraud occurred. It means this transaction
doesn't match your normal sales pattern and could expose you
to being pulled into someone else's fraud investigation.

Recommended: Verify this was a real sale. If you don't
recognise it, consider holding the payout pending review.
```

### False-Positive Guard (mandatory, non-negotiable in PRD)
Every flag must also show what would make it LESS risky, e.g.:
```
Lowers risk:
✓ Payer has bought from you before (repeat customer)
✓ Amount matches an active order/cart
✓ Time matches your normal business hours
```
This prevents the agent from becoming "cry wolf" and punishing genuine small businesses — directly addressing the false-positive problem RBI itself cited as the weakness of rule-based systems.

---

## 8. UI Requirements (from your reference screenshots)

- **Light theme only.** White/off-white background, no dark mode. (Explicitly instruct the coding agent: do not default to dark UI.)
- Card-based KPI row at top (Total Flagged, Total Cleared, Avg Confidence, False Positive Rate) — same visual language as the CopilotKit dashboard screenshots.
- Primary view is an **alert feed / list**, not chart-heavy. Charts are secondary (small sparkline trend of flags over time), because this is an action tool, not a BI dashboard.
- Each alert is a card, click to expand → full evidence breakdown + "Mark as reviewed / Confirm risk / Dismiss as false positive" buttons (human-in-the-loop, agent never auto-acts).
- Color language: soft amber/orange for medium risk, muted red for high risk, muted green for cleared/dismissed. No harsh dark red or black backgrounds.
- Font: clean sans-serif, generous whitespace, rounded corners (12px), matches the CopilotKit reference aesthetic exactly.

---

## 9. Success Metrics (For Demo)

- Precision/recall reported on a synthetic labeled dataset (you control ground truth since you generate the data) — e.g. "flagged 14/16 planted mule-pattern transactions, 2 false positives out of 84 normal transactions = 97.6% specificity."
- **Never claim real-world percentages** ("40% of failures are X") without a labeled dataset backing it — same overclaiming trap flagged earlier in this project.
- Time-to-flag: how fast after payment does the alert fire (should be near-instant, driven by webhook).

---

## 10. Buildathon Framing (Track Alignment)

This fits **Track 02 (AI Risk Manager)** most naturally, or Open Track if positioned as merchant-protection rather than pure risk-scoring. Judging bar to hit explicitly:
- Explainable — every flag shows its reasoning
- Bounded — never auto-freezes/auto-rejects, only alerts
- Gated — high-confidence flags could optionally require ops sign-off before any downstream action
- Audit trail — every score, decision, and human override is logged

# Sentinel — AI Merchant Mule-Pattern Early Warning & Autonomous Smart-Freeze Shield for Razorpay

> **Codename**: *Sentinel*  
> **Track**: AI Risk Manager (Track 02) / Merchant Protection  
> **Core Principle**: Proactive Anomaly Detection + Multi-Signal Correlation + False-Positive Guard + Autonomous Smart Auto-Freeze Shield + Human-in-the-Loop Operations.

---

## 🌐 Live Production Deployments

- 🚀 **Live Web Dashboard (Frontend)**: [https://razorpay-agent-frontend-6760.onrender.com/](https://razorpay-agent-frontend-6760.onrender.com/)
- ⚡ **Live Production API (Backend)**: [https://razorpay-agent-rw82.onrender.com/](https://razorpay-agent-rw82.onrender.com/)
- 📖 **API Swagger Documentation**: [https://razorpay-agent-rw82.onrender.com/docs](https://razorpay-agent-rw82.onrender.com/docs)
- 📦 **GitHub Repository**: [https://github.com/Pratikshrivashh/Razorpay-agent](https://github.com/Pratikshrivashh/Razorpay-agent)

---

## 1. Executive Summary & Problem Space

A merchant’s UPI ID, QR code, and payment links are **publicly accessible**. Fraud rings running deceptive "commission task / high-yield investment" apps (e.g. Chinese loan app and Ponzi investment scams) frequently direct victims to deposit funds directly into unsuspecting, legitimate merchants' public UPI IDs (e.g. ₹199.99, ₹550 micro-deposits). Weeks later, law enforcement / cyber cell tracing triggers an account freeze under **Section 106 CrPC** or bank AML hold — damaging the merchant's business with zero prior warning.

**Sentinel** bridges this vulnerability on the aggregator side:
1. Analyzes incoming Razorpay transactions against merchant historical ledgers to detect mule patterns and organized fraud ring signatures.
2. Computes a deterministic 0–100 Anomaly Score across **12 distinct risk signals**.
3. Applies a mandatory **False-Positive Guard** to protect legitimate surge traffic.
4. Executes the **Autonomous Smart Auto-Freeze Shield** policy rule engine — automatically placing a 24-hour payout hold on settlements when risk score ≥ 80, preventing cyber-cell bank account freezes before funds are drained.
5. Leverages Google Gemini AI for clear, explainable risk narratives for Razorpay Operations analysts.

---

## 2. Core Autonomous Defense & Review Pipeline

```
PAYMENT (Webhook / Synthetic Ingestion)
         ↓
ANOMALY SCORE (Deterministic Engine: 0–100 Score)
         ↓
12-SIGNAL RULESET & FRAUD RING LAYER (Amount Anomalies, Pass-Through Velocity, Crypto Off-Ramps, Payer Disconnect)
         ↓
CONTEXT CHECK (False-Positive Guard: Repeat Customer Damping, Business Hours, Valid Order Lineage)
         ↓
AUTONOMOUS SMART AUTO-FREEZE SHIELD (Score ≥ 80 → Auto-Freeze Settlement Payout & Lock 24h Hold)
         ↓
CONFIDENCE TIER (Google Gemini AI Explanation & Recommended Analyst Actions: LOW / MEDIUM / HIGH)
         ↓
HUMAN REVIEW (Razorpay Ops Dashboard: [Confirm Risk] [Dismiss False Positive] [Request Context] [Inspect Payout Hold])
```

---

## 3. Key Architecture & 12-Signal Ruleset

### A. Base Mule Detection Signals
- **Signal 1**: Stranger Payer VPA (+20 pts) vs Verified Repeat Customer (Damps score).
- **Signal 2**: Ticket Size Distribution Mismatch (+20 pts) vs In-Catalog Pricing.
- **Signal 3**: Missing E-Commerce Cart/Order Linkage (+20 pts) vs Verified Order ID.
- **Signal 4**: Micro-Deposit High-Velocity Burst (+15 pts).
- **Signal 5**: Structuring / Smurfing Pattern (+20 pts — intentionally under ₹10k / ₹50k reporting thresholds).
- **Signal 6**: Nocturnal / Off-Hours Processing (+15 pts) vs Active Business Hours.
- **Signal 7**: Fresh Mule Shell / Zero-Refund Anomaly (+15 pts).

### B. High-Risk Fraud Ring Pattern Layer (Signals 8–12)
- **Signal 8 — Rapid Pass-Through Velocity**: Funds credited and debited within minutes-to-hours, leaving minimal residual balance (Drainage ratio > 95%). Weight: **HIGH (+25 pts)**. *Action: Escalate to Compliance / ED Liaison*.
- **Signal 9 — Fragmented Multi-Instrument Identity**: Same payer or merchant operating through multiple UPI IDs / VPAs / wallets in a short window to split single flow. Weight: **HIGH (+25 pts)**. *Action: Escalate to Compliance / ED Liaison*.
- **Signal 10 — Crypto Off-Ramp Proximity**: Payout followed by transfer activity toward known crypto exchange accounts/VPAs. Weight: **MEDIUM (+15 pts)**. (*Requires external data source in production.*)
- **Signal 11 — Round-Number-Minus-One Pricing Heuristic**: Incoming amounts clustering around `X99.99` / `X99` patterns. Weight: **LOW (+10 pts)**.
- **Signal 12 — Smart Auto-Freeze Shield Policy Engine**: Autonomous rule evaluation triggering payout settlement hold when confidence score crosses policy threshold.

### C. False-Positive Guard (Mandatory PRD Requirement)
Evaluates mitigating factors (repeat customer history, verified checkout cart, peak hours) to damp raw scores and eliminate false positives.

### D. Smart Auto-Freeze Shield & Settlement Hold Engine
- **Autonomous Policy Rules**: Configure custom risk thresholds (e.g. `Score ≥ 80`) and hold durations (e.g. `24 Hours`).
- **Settlement Hold Enforcement**: Payouts meeting rule criteria are flagged with `auto_frozen: true` and locked in the **Auto-Frozen Payouts & Settlement Holds Queue**.
- **Live Visual Status Indicators**: Real-time "Auto-Freeze Shield Active" notch badge, dashboard total locked INR summary, and `🧊 AUTO-FROZEN BY SMART SHIELD` modal status banners.

### E. Gemini AI Explanation Layer
Generates structured, calm, objective risk summaries and actionable recommendations for operations analysts without asserting definitive fraud. If Signal 10 or 11 fires, Gemini explicitly states their confidence caveats.

---

## 4. Quickstart Guide & Local Setup

### Live Production (No Setup Required)
Access the live dashboard immediately at: [https://razorpay-agent-frontend-6760.onrender.com/](https://razorpay-agent-frontend-6760.onrender.com/)

---

### Local Development Setup

#### Prerequisites
- Python 3.12+
- Node.js 18+ & npm

#### A. Backend Setup (FastAPI)
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
python -m pip install -r requirements.txt

# 3. Start Uvicorn development server (Port 8000)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*Backend runs locally at `http://localhost:8000` (Swagger docs: `http://localhost:8000/docs`).*

#### B. Frontend Setup (Vite + React + Tailwind)
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite dev server (Port 3000)
npm run dev
```
*Frontend runs locally at `http://localhost:3000`.*

---

## 5. Live Demo Script (Step-by-Step)

1. **Open Dashboard**: Navigate to [https://razorpay-agent-frontend-6760.onrender.com/](https://razorpay-agent-frontend-6760.onrender.com/) or `http://localhost:3000`.
2. **Interactive Merchant Search**: Type `MER_AURA` or `Aura` into the autocomplete search bar to instantly select a merchant.
3. **Observe Hero Gauge Animation**: Watch the Lenovo Vantage-style tachometer meters sweep and calibrate (`Anomalous Exposure` & `Settlement Volume`).
4. **Inject Mule Pattern**: Click **"Simulate Mules"** in the top bar or trigger a **12-Signal Attack Scenario** (e.g. *Fractional .99 Task Scam* or *USDT Crypto Off-Ramp*).
5. **Inspect Smart Auto-Freeze Shield**:
   - Check the main dashboard's **"🧊 Auto-Frozen Payouts & Settlement Holds Queue"** card to view total locked settlement volume in INR.
   - Observe the live **"Auto-Freeze Shield Active (Score ≥ 80)"** indicator in the header notch.
6. **Inspect Alert & Evidence Modal**: Open the evidence modal to review:
   - **`🧊 AUTO-FROZEN BY SMART SHIELD (Settlement Payout Lock Active)`** status banner.
   - **Base Mule Risk Signals** (*Action: Soft Warning to Merchant*)
   - **Fraud Ring Pattern Match** (*Action: Escalate to Compliance / ED Liaison*)
   - Mandatory confidence caveats for Signal 10 & Signal 11
7. **Manage Auto-Freeze Rules**: Click **"Settings"** in the sidebar/navigation to adjust the Smart Auto-Freeze threshold score, settlement hold duration, or toggle active policies.
8. **Perform Human Review**: Click **[Confirm Risk]**, **[Dismiss False Positive]**, or **[Request Context]** to update the immutable audit log.
9. **Ask Analyst Copilot**: Click the floating **"Ask Copilot"** widget in the bottom-right corner to interact with Gemini AI.

---

## 6. Running Automated Test Suite

Run unit and integration tests verifying scoring rules, mitigators, auto-freeze policies, and API endpoints:
```bash
cd backend
python -m pytest tests -v
```
*All 9/9 tests passing.*

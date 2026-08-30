# Sentinel — AI Merchant Mule-Pattern Early Warning Agent for Razorpay

> **Codename**: *Sentinel*  
> **Track**: AI Risk Manager (Track 02) / Merchant Protection  
> **Core Principle**: Proactive Anomaly Detection + Multi-Signal Correlation + False-Positive Guard + Human-in-the-Loop Operations. **Never automatically blocks or freezes accounts.**

---

## 🌐 Live Production Deployments

- 🚀 **Live Web Dashboard (Frontend)**: [https://razorpay-agent-frontend-6760.onrender.com/](https://razorpay-agent-frontend-6760.onrender.com/)
- ⚡ **Live Production API (Backend)**: [https://razorpay-agent-rw82.onrender.com/](https://razorpay-agent-rw82.onrender.com/)
- 📖 **API Swagger Documentation**: [https://razorpay-agent-rw82.onrender.com/docs](https://razorpay-agent-rw82.onrender.com/docs)
- 📦 **GitHub Repository**: [https://github.com/Pratikshrivashh/Razorpay-agent](https://github.com/Pratikshrivashh/Razorpay-agent)

---

## 1. Executive Summary & Problem Space

A merchant’s UPI ID, QR code, and payment links are **publicly accessible**. Fraud rings running deceptive "commission task / high-yield investment" apps (e.g. Chinese loan app and Ponzi investment scams) frequently direct victims to deposit funds directly into unsuspecting, legitimate merchants' public UPI IDs (e.g. ₹199.99, ₹550 micro-deposits). Weeks later, law enforcement / cyber cell tracing triggers an account freeze under **Section 106 CrPC** or bank AML hold — damaging the merchant's business with zero prior warning.

**Sentinel** bridges this vulnerability on the aggregator side. It analyzes incoming Razorpay transactions against the merchant's historical ledger to detect mule patterns and organized fraud ring signatures, computes a deterministic 0–100 Anomaly Score, correlates multi-dimensional risk signals, balances against a mandatory **False-Positive Guard**, and uses Google Gemini to provide explainable risk narratives for Razorpay Operations analysts before payout freezes occur.

---

## 2. Core Detection & Review Pipeline

```
PAYMENT (Webhook / Synthetic Ingestion)
         ↓
ANOMALY SCORE (Deterministic Engine: 0–100 Score)
         ↓
12-SIGNAL RULESET & FRAUD RING LAYER (Amount Anomalies, Pass-Through Velocity, Crypto Off-Ramps, Payer Disconnect)
         ↓
CONTEXT CHECK (False-Positive Guard: Repeat Customer Damping, Business Hours, Valid Order Lineage)
         ↓
CONFIDENCE TIER (Google Gemini AI Explanation & Recommended Analyst Actions: LOW / MEDIUM / HIGH)
         ↓
HUMAN REVIEW (Razorpay Ops Dashboard: [Confirm Risk] [Dismiss False Positive] [Request Context])
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

### B. High-Risk Fraud Ring Pattern Layer (Signals 8–11)
- **Signal 8 — Rapid Pass-Through Velocity**: Funds credited and debited within minutes-to-hours, leaving minimal residual balance (Drainage ratio > 95%). Weight: **HIGH (+25 pts)**. *Action: Escalate to Compliance / ED Liaison*.
- **Signal 9 — Fragmented Multi-Instrument Identity**: Same payer or merchant operating through multiple UPI IDs / VPAs / wallets in a short window to split single flow. Weight: **HIGH (+25 pts)**. *Action: Escalate to Compliance / ED Liaison*.
- **Signal 10 — Crypto Off-Ramp Proximity**: Payout followed by transfer activity toward known crypto exchange accounts/VPAs. Weight: **MEDIUM (+15 pts)**.  
  *⚠️ Disclaimer: Requires external data source in production.*
- **Signal 11 — Round-Number-Minus-One Pricing Heuristic**: Incoming amounts clustering around `X99.99` / `X99` patterns. Weight: **LOW (+10 pts)**.  
  *⚠️ Disclaimer: Heuristic signal — pattern observed in synthetic test data, not yet validated against real fraud datasets.*

### C. False-Positive Guard (Mandatory PRD Requirement)
Evaluates mitigating factors (repeat customer history, verified checkout cart, peak hours) to damp raw scores and eliminate false positives.

### D. Gemini AI Explanation Layer
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
5. **Inspect Alert & Fraud Ring Layer**: Open the evidence modal to review:
   - **Base Mule Risk Signals** (*Action: Soft Warning to Merchant*)
   - **Fraud Ring Pattern Match** (*Action: Escalate to Compliance / ED Liaison*)
   - Mandatory confidence caveats for Signal 10 & Signal 11
6. **Perform Human Review**: Click **[Confirm Risk]**, **[Dismiss False Positive]**, or **[Request Context]** to update the immutable audit log.
7. **Ask Analyst Copilot**: Click the floating **"Ask Copilot"** widget in the bottom-right corner to interact with Gemini AI.

---

## 6. Running Automated Test Suite

Run unit and integration tests verifying scoring rules, mitigators, and API endpoints:
```bash
cd backend
python -m pytest tests -v
```
*All tests passing.*

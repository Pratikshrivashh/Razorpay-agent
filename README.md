# Sentinel — AI Merchant Mule-Pattern Early Warning Agent for Razorpay

> **Codename**: *Sentinel*  
> **Track**: AI Risk Manager (Track 02) / Merchant Protection  
> **Core Principle**: Proactive Anomaly Detection + Multi-Signal Correlation + False-Positive Guard + Human-in-the-Loop Operations. **Never automatically blocks or freezes accounts.**

---

## 1. Executive Summary & Problem Space

A merchant’s UPI ID, QR code, and payment links are **publicly accessible**. Fraud rings running deceptive "commission task / high-yield investment" apps frequently direct victims to deposit funds directly into unsuspecting, legitimate merchants' public UPI IDs (e.g. ₹550 round deposits). Weeks later, law enforcement / cyber cell tracing triggers an account freeze under **Section 106 CrPC** or bank AML hold — damaging the merchant's business with zero prior warning.

**Sentinel** bridges this vulnerability on the aggregator side. It analyzes incoming Razorpay transactions against the merchant's historical ledger to detect mule patterns, computes a deterministic 0–100 Anomaly Score, correlates multi-dimensional risk signals, balances against a mandatory **False-Positive Guard**, and uses Google Gemini to provide explainable risk narratives for Razorpay Operations analysts before payout freezes occur.

---

## 2. Core Detection & Review Pipeline

```
PAYMENT (Webhook / Synthetic Ingestion)
         ↓
ANOMALY SCORE (Deterministic Engine: 0–100 Score)
         ↓
RISK SIGNALS (VPA History, Ticket Size Mismatch, Missing Order Linkage, Off-Hours, Pass-Through Velocity)
         ↓
CONTEXT CHECK (False-Positive Guard: Repeat Customer Damping, Business Hours, Valid Order Lineage)
         ↓
CONFIDENCE TIER (Google Gemini AI Explanation & Recommended Analyst Actions: LOW / MEDIUM / HIGH)
         ↓
HUMAN REVIEW (Razorpay Ops Dashboard: [Confirm Risk] [Dismiss False Positive] [Request Context])
```

---

## 3. Key Architecture & Features

1. **Deterministic Rule Engine (No Hallucination)**:
   - **Signal 1**: Stranger Payer VPA (+25 pts) vs Verified Repeat Customer (Damps score).
   - **Signal 2**: Ticket Size Distribution Mismatch (+20 pts) vs In-Catalog Pricing.
   - **Signal 3**: Missing E-Commerce Cart/Order Linkage (+20 pts) vs Verified Order ID.
   - **Signal 4**: Rapid Pass-Through / Round-Trip Payout Cycle (+25 pts).
   - **Signal 5**: Cross-Merchant Burst Velocity (+15 pts — Aggregator-level simulated signal).
   - **Signal 6**: Nocturnal / Off-Hours Processing (+10 pts) vs Active Business Hours.

2. **False-Positive Guard (Mandatory PRD Requirement)**:
   - Evaluates mitigating factors (repeat customer history, verified checkout cart, peak hours) to damp raw scores and eliminate "cry wolf" alerts.

3. **Gemini AI Explanation Layer**:
   - Generates structured, calm, objective risk summaries and actionable recommendations for operations analysts without asserting definitive fraud.

4. **Human-in-the-Loop Review Queue**:
   - Razorpay risk officers review flagged alerts with one-click actions:
     - `Confirm Risk`: Flags transaction for proactive merchant contact.
     - `Dismiss False Positive`: Clears alert and updates baseline tolerance.
     - `Request Context`: Drafts an invoice clarification request.
   - Immutable audit trail recorded for legal and regulatory compliance.

5. **Aesthetic Light-Theme Dashboard**:
   - Built to exact design system specs (`#F8FAFC` background, `#FFFFFF` cards, `#E2E8F0` soft borders, 12px radii).

---

## 4. Quickstart Guide

### Prerequisites
- Python 3.12+
- Node.js 18+ & npm

### A. Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
python -m pip install -r requirements.txt

# 3. Start FastAPI server (Port 8000)
python run.py
```
*Backend runs on `http://localhost:8000` (API Docs: `http://localhost:8000/docs`).*

### B. Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server (Port 3000)
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 5. Live Demo Script (Step-by-Step)

1. **Open the Dashboard**: Navigate to `http://localhost:3000`.
2. **Observe Merchant Baselines**: View "Aura Handcrafted Jewels" (catalog: ₹1,200–₹6,500).
3. **Generate Traffic Baseline**: Click **"Generate 50+ Traffic"** to simulate normal transactions.
4. **Inject Live Mule Pattern**: Click **"Task-App Deposit (₹550 Unlinked)"** in the simulation bar.
5. **Inspect Live Alert**: A card appears in the queue with **Confidence: 65/100 (Medium Risk)**.
6. **Open Evidence Breakdown**: Click the card to view:
   - Numerical Anomaly Score & gauge
   - Risk Signals vs False-Positive Guard
   - Gemini AI Contextual Explanation
7. **Perform Human Review**:
   - Add review notes and click **[Confirm Risk]** or **[Dismiss as False Positive]**.
   - Notice instant status transition and immutable entry in the **Audit Trail**.
8. **Interactive AI Copilot**: Click **"Analyst Copilot"** in the top bar to ask questions like:
   - *"Why was the ₹550 transaction flagged?"*
   - *"Explain the false-positive guard."*

---

## 6. Running Automated Tests

Run the test suite verifying scoring rules, mitigators, and API endpoints:
```bash
cd backend
python -m pytest tests -v
```
*9/9 unit and integration tests passing.*

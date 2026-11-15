# Paytm Munim

**Concept dossier · 15 November 2026 · Product proposal, not a deployed Paytm feature**

Paytm Munim is an evidence-led cash planning partner for small merchants. It warns about a possible shortage **before a confirmed business payment is due**, explains the visible facts and forecast uncertainty, and helps the owner compare practical responses. It also follows up on payment and settlement exceptions that affect available money. The merchant makes decisions involving spending, supplier contact, or borrowing.

**Judge pitch:** “Paytm tells a merchant what money arrived. Munim helps them see whether enough money will be there when they need to pay a supplier, then helps them act early.”

This folder contains the concept documentation and a [backend prototype](backend/README.md). The backend has no live Paytm or bank integration. No merchant interview, forecast calibration score, or financial outcome is claimed as completed.

## Quick Start (Demo Mode)

### 1. Run Backend & Seed Demo Data
```bash
cd backend
uv sync --extra dev
uv run alembic upgrade head
uv run python seed_demo.py
uv run uvicorn munim.api:app --reload --port 8000
```

### 2. Run React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** to view the Paytm Munim dashboard.

## Read in order

1. [Product thesis and positioning](docs/01-product-thesis.md)
2. [Merchant experience and feature specifications](docs/02-merchant-experience.md)
3. [Data, evidence and consent](docs/03-data-and-evidence.md)
4. [Forecasting and decision logic](docs/04-forecast-and-decisions.md)
5. [Actions, safety and edge cases](docs/05-actions-and-edge-cases.md)
6. [Technical architecture and integrations](docs/06-architecture.md)
7. [Research, testing and measurement](docs/07-validation.md)
8. [Hackathon pitch and live demo](docs/08-pitch-and-demo.md)
9. [Sources, claims and open questions](docs/09-sources-and-questions.md)

## Core rule

A repeated past payment is a **possible obligation**, not a bill. A payment forecast is a **range**, not cash already in hand. A Paytm-only view is **not total business cash**. Munim shows these distinctions to the merchant and declines to make stronger claims than its evidence supports.

## Product status

The proposed launch sequence is: Paytm-only money visibility and exception follow-up; merchant-confirmed upcoming obligations; optional consented connected-account view; calibrated cash-gap warnings; controlled what-if planning. The current backend uses synthetic connectors and an illustrative, uncalibrated weekday range, so it must not be used for real financial decisions. Seasonal stock advice and loan distribution are outside the first release. Public sources do not establish access to Paytm internal APIs or a general Soundbox extension interface for a hackathon team.


# Paytm Munim backend

FastAPI prototype implementing the evidence-led core described in the project docs. It has **no live Paytm, bank, Account Aggregator, supplier, settlement action, or lending integration**. The ingestion endpoints accept only explicitly synthetic fixtures and are disabled in production mode.

## Run locally

```bash
cd backend
uv sync --extra dev
cp .env.example .env
# Replace both sample secrets with different random values of at least 32 characters.
uv run alembic upgrade head
uv run uvicorn munim.api:app --reload
```

API docs: `http://127.0.0.1:8000/docs`. Demo ingestion requires `X-Demo-Ingest-Key`. Create a demo merchant via `/demo/merchants`, then obtain a short-lived owner JWT via `/demo/token`. Both demo endpoints disappear in production mode. Create a confirmed obligation through `/v1/obligations`, then request its `/forecast` or post a `/scenarios` comparison.

The owner can set a reserve floor through `/v1/merchant-settings`. `/v1/obligation-candidates` returns only possible recurring payments to ask about. `/v1/settlement-unmatched` returns Paytm records without a matching settlement event **in the demo feed**; it does not declare a provider delay. `/v1/obligations/{id}/advice` gives bounded options and prerequisites, never executes them. A forecast uses India-local due dates and UTC event timestamps.

## What is enforced

- Merchant tenant scope on business endpoints and owner role on changes.
- Idempotent money-event ingestion using `(merchant, source, source_event_id)`.
- Integer paise throughout financial calculations.
- No cash-gap number with no fresh connected balance.
- No numerical gap with insufficient bank-credit history.
- Merchant-confirmed obligations only; the service does not infer a bill from a recurring transfer.
- Recurring debit candidates are questions for the owner, never automatic bills.
- Unmatched Paytm records are labelled as incomplete demo-feed evidence, never as proven delayed settlements.
- Scenarios are marked hypothetical and cannot mutate balances or obligations.
- Versioned obligation updates with conflict rejection and audit events.
- No payment, loan, supplier message, or settlement action endpoint.

## Current forecasting limit

The forecast is a **heuristic range**, built from weekday distributions of the previous eight weeks of successful credits to one synthetic connected account. It is not an empirically calibrated prediction interval. It excludes today's future credits, unconnected accounts, cash, and unconfirmed costs. It should not be used for real financial decisions. More advanced modelling needs real consented data, rolling backtests, calibration and user research.

## Tests

```bash
uv run pytest
uv run ruff check src tests
```

Production requires authorised connectors, an external identity provider, approved consent flow, secrets management, reliable jobs and observability. Run Alembic migrations before starting the app; the app deliberately does not create tables at startup in production mode.

## Sarvam AI payment drafts

Paste your key after `MUNIM_SARVAM_API_KEY=` in `backend/.env`, then restart FastAPI. The same field is blank in `backend/.env.example`. Keep the key out of commits and screenshots.

Set `MUNIM_SARVAM_API_KEY` in the backend environment to use text or voice payment drafts. The key stays on the server. The Pay tab records up to 29 seconds of audio, sends it to `POST /v1/ai/voice-payment-draft`, transcribes with Saaras v4, then asks Sarvam 105B to prepare an editable payment draft. `POST /v1/ai/payment-draft` accepts typed Hindi, Hinglish, or English. Neither endpoint writes an obligation; the merchant must confirm the draft. Without a key or service access, manual entry remains available. No real Paytm payment is initiated by the prototype.

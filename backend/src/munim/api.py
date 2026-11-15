import json
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from .ai import (
    DebitPatternInterpretation,
    DebitPatternRequest,
    DraftRequest,
    DraftResponse,
    MunimAnswer,
    MunimQuestion,
    answer_merchant,
    interpret_debit_pattern,
    parse_draft,
    transcribe_audio,
)
from .auth import Principal, create_demo_token, demo_ingest_auth, owner, principal
from .config import Settings, get_settings
from .db import get_session, init_db
from .decisions import Advice, make_advice
from .forecast import build_forecast, latest_balance
from .insights import recurring_candidates, settlement_unmatched
from .models import AuditEvent, ForecastRun, MoneyEvent, Obligation
from .schemas import (
    BalanceIn,
    BridgeCreditIn,
    BridgeCreditOut,
    ForecastOut,
    MerchantCreate,
    MerchantSettingsIn,
    MoneyEventIn,
    ObligationIn,
    ObligationPatch,
    ScenarioIn,
)
from .service import (
    audit,
    create_merchant,
    create_obligation,
    ingest_balance,
    ingest_money_event,
    merchant_or_404,
    obligation_or_404,
    patch_obligation,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if get_settings().environment != "production":
        init_db()  # local/demo only; production uses migrations
    yield


app = FastAPI(title="Paytm Munim API", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/demo/merchants", dependencies=[Depends(demo_ingest_auth)])
def demo_merchant(data: MerchantCreate, db: Session = Depends(get_session)) -> dict:
    item = create_merchant(db, data)
    return {"id": item.id, "name": item.name}


@app.post("/demo/token", dependencies=[Depends(demo_ingest_auth)])
def demo_token(
    merchant_id: str, db: Session = Depends(get_session), settings: Settings = Depends(get_settings)
) -> dict:
    merchant_or_404(db, merchant_id)
    return {"access_token": create_demo_token(merchant_id, settings), "token_type": "bearer"}


@app.post("/demo/money-events", dependencies=[Depends(demo_ingest_auth)])
def demo_event(data: MoneyEventIn, db: Session = Depends(get_session)) -> dict:
    item, created = ingest_money_event(db, data)
    return {"id": item.id, "created": created}


@app.post("/demo/balance-snapshots", dependencies=[Depends(demo_ingest_auth)])
def demo_balance(data: BalanceIn, db: Session = Depends(get_session)) -> dict:
    item = ingest_balance(db, data)
    return {"id": item.id, "account_id": item.account_id}


@app.get("/v1/merchant-settings")
def get_merchant_settings(
    p: Principal = Depends(principal), db: Session = Depends(get_session)
) -> dict:
    merchant = merchant_or_404(db, p.merchant_id)
    return {"reserve_floor_paise": merchant.reserve_floor_paise}


@app.patch("/v1/merchant-settings")
def update_merchant_settings(
    data: MerchantSettingsIn, p: Principal = Depends(owner), db: Session = Depends(get_session)
) -> dict:
    merchant = merchant_or_404(db, p.merchant_id)
    old = merchant.reserve_floor_paise
    merchant.reserve_floor_paise = data.reserve_floor_paise
    audit(
        db,
        p.merchant_id,
        "owner",
        "reserve_floor_updated",
        p.merchant_id,
        {"previous_paise": old, "new_paise": data.reserve_floor_paise},
    )
    db.commit()
    return {"reserve_floor_paise": merchant.reserve_floor_paise}


@app.post("/v1/obligations", status_code=201)
def post_obligation(
    data: ObligationIn, p: Principal = Depends(owner), db: Session = Depends(get_session)
) -> dict:
    item = create_obligation(db, p.merchant_id, data)
    return {
        "id": item.id,
        "payee": item.payee,
        "amount_paise": item.amount_paise,
        "due_date": item.due_date,
        "status": item.status,
        "version": item.version,
    }


@app.get("/v1/obligations")
def list_obligations(
    p: Principal = Depends(principal), db: Session = Depends(get_session)
) -> list[dict]:
    rows = db.scalars(
        select(Obligation)
        .where(Obligation.merchant_id == p.merchant_id)
        .order_by(Obligation.due_date)
    ).all()
    return [
        {
            "id": x.id,
            "payee": x.payee,
            "amount_paise": x.amount_paise,
            "due_date": x.due_date,
            "status": x.status,
            "version": x.version,
        }
        for x in rows
    ]


@app.patch("/v1/obligations/{obligation_id}")
def update_obligation(
    obligation_id: str,
    data: ObligationPatch,
    p: Principal = Depends(owner),
    db: Session = Depends(get_session),
) -> dict:
    item = patch_obligation(db, obligation_or_404(db, p.merchant_id, obligation_id), data)
    return {
        "id": item.id,
        "status": item.status,
        "version": item.version,
        "amount_paise": item.amount_paise,
        "due_date": item.due_date,
    }


@app.get("/v1/obligations/{obligation_id}/forecast", response_model=ForecastOut)
def get_forecast(
    obligation_id: str,
    p: Principal = Depends(principal),
    db: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> ForecastOut:
    merchant = merchant_or_404(db, p.merchant_id)
    obligation = obligation_or_404(db, p.merchant_id, obligation_id)
    try:
        result = build_forecast(db, merchant, obligation, settings)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    db.add(
        ForecastRun(
            merchant_id=p.merchant_id,
            obligation_id=obligation.id,
            obligation_version=obligation.version,
            balance_snapshot_id=(
                snapshot.id if (snapshot := latest_balance(db, p.merchant_id)) else None
            ),
            result_json=result.model_dump_json(),
        )
    )
    db.commit()
    return result


@app.post("/v1/obligations/{obligation_id}/scenarios", response_model=ForecastOut)
def scenario(
    obligation_id: str,
    data: ScenarioIn,
    p: Principal = Depends(owner),
    db: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> ForecastOut:
    merchant = merchant_or_404(db, p.merchant_id)
    obligation = obligation_or_404(db, p.merchant_id, obligation_id)
    try:
        return build_forecast(db, merchant, obligation, settings, scenario=data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/v1/obligations/{obligation_id}/bridge-credit", response_model=BridgeCreditOut)
def bridge_credit(
    obligation_id: str,
    data: BridgeCreditIn,
    p: Principal = Depends(owner),
    db: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> BridgeCreditOut:
    merchant = merchant_or_404(db, p.merchant_id)
    obligation = obligation_or_404(db, p.merchant_id, obligation_id)
    
    scenario_data = ScenarioIn(extra_funds_paise=data.amount_paise)
    forecast_result = build_forecast(db, merchant, obligation, settings, scenario=scenario_data)
    
    loan_ref = f"PAYTM-OD-{uuid4().hex[:6].upper()}"
    audit(
        db,
        p.merchant_id,
        "owner",
        "micro_overdraft_activated",
        obligation.id,
        {
            "loan_reference": loan_ref,
            "disbursed_paise": data.amount_paise,
            "flat_fee_rupees": data.flat_fee_rupees,
            "tenure_days": data.tenure_days,
        },
    )
    db.commit()
    
    return BridgeCreditOut(
        status="disbursed",
        loan_reference=loan_ref,
        disbursed_amount_paise=data.amount_paise,
        tenure_days=data.tenure_days,
        flat_fee_paise=data.flat_fee_rupees * 100,
        account_credited=forecast_result.account_id or "Connected Bank A/c",
        forecast=forecast_result,
    )


@app.get("/v1/obligations/{obligation_id}/advice", response_model=Advice)
def get_advice(
    obligation_id: str,
    p: Principal = Depends(principal),
    db: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> Advice:
    merchant = merchant_or_404(db, p.merchant_id)
    obligation = obligation_or_404(db, p.merchant_id, obligation_id)
    try:
        result = build_forecast(db, merchant, obligation, settings)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return make_advice(result)


@app.get("/v1/money-events")
def list_events(
    p: Principal = Depends(principal), db: Session = Depends(get_session)
) -> list[dict]:
    rows = db.scalars(
        select(MoneyEvent)
        .where(MoneyEvent.merchant_id == p.merchant_id)
        .order_by(MoneyEvent.occurred_at.desc())
        .limit(100)
    ).all()
    return [
        {
            "id": x.id,
            "source": x.source,
            "kind": x.kind,
            "status": x.status,
            "amount_paise": x.amount_paise,
            "occurred_at": x.occurred_at,
            "reference": x.reference,
        }
        for x in rows
    ]


@app.get("/v1/obligation-candidates")
def list_candidates(
    p: Principal = Depends(principal), db: Session = Depends(get_session)
) -> list[dict]:
    return recurring_candidates(db, p.merchant_id)


@app.get("/v1/settlement-unmatched")
def list_unmatched(
    p: Principal = Depends(principal), db: Session = Depends(get_session)
) -> list[dict]:
    return settlement_unmatched(db, p.merchant_id)


@app.get("/v1/audit")
def list_audit(p: Principal = Depends(owner), db: Session = Depends(get_session)) -> list[dict]:
    rows = db.scalars(
        select(AuditEvent)
        .where(AuditEvent.merchant_id == p.merchant_id)
        .order_by(AuditEvent.created_at.desc())
        .limit(100)
    ).all()
    return [
        {
            "action": x.action,
            "subject_id": x.subject_id,
            "detail": json.loads(x.detail_json),
            "created_at": x.created_at,
        }
        for x in rows
    ]


@app.post("/v1/ai/payment-draft", response_model=DraftResponse)
async def payment_draft(data: DraftRequest, p: Principal = Depends(owner)) -> DraftResponse:
    return await parse_draft(data.text)


@app.post("/v1/ai/interpret-debit", response_model=DebitPatternInterpretation)
async def interpret_debit(data: DebitPatternRequest, _p: Principal = Depends(owner)) -> DebitPatternInterpretation:
    if data.amount_min_paise > data.amount_max_paise:
        raise HTTPException(status_code=422, detail="Minimum amount must not exceed maximum amount.")
    return await interpret_debit_pattern(data)


@app.post("/v1/ai/ask", response_model=MunimAnswer)
async def ask_munim(
    data: MunimQuestion,
    obligation_id: str,
    p: Principal = Depends(principal),
    db: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> MunimAnswer:
    merchant = merchant_or_404(db, p.merchant_id)
    obligation = obligation_or_404(db, p.merchant_id, obligation_id)
    try:
        forecast = build_forecast(db, merchant, obligation, settings)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    context = {
        "forecast": forecast.model_dump(mode="json"),
        "recent_recurring_debit_candidates": recurring_candidates(db, p.merchant_id)[:8],
        "note": "Forecast fields are deterministic backend outputs; candidate purposes are unconfirmed suggestions.",
    }
    forecast_context = context["forecast"]
    for field in list(forecast_context):
        if field.endswith("_paise") and forecast_context[field] is not None:
            forecast_context[field.removesuffix("_paise") + "_rupees"] = round(
                forecast_context.pop(field) / 100, 2
            )
    for candidate in context["recent_recurring_debit_candidates"]:
        for field in ("historical_amount_min_paise", "historical_amount_max_paise"):
            if field in candidate:
                candidate[field.removesuffix("_paise") + "_rupees"] = round(candidate.pop(field) / 100, 2)
    context["money_units"] = "Every monetary amount in this context is expressed in Indian rupees, not paise."
    return await answer_merchant(data, json.dumps(context, ensure_ascii=False, default=str))


@app.post("/v1/ai/voice-payment-draft", response_model=DraftResponse)
async def voice_payment_draft(file: UploadFile = File(...), p: Principal = Depends(owner)) -> DraftResponse:
    return await transcribe_audio(file)



from collections import defaultdict
from datetime import UTC, datetime, timedelta
from math import ceil, floor

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings
from .models import BalanceSnapshot, Merchant, MoneyEvent, Obligation
from .schemas import ForecastOut, ScenarioIn
from .time_utils import business_date, local_date


def aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def percentile(values: list[int], q: float) -> int:
    ordered = sorted(values)
    pos = (len(ordered) - 1) * q
    low, high = floor(pos), ceil(pos)
    return round(ordered[low] + (ordered[high] - ordered[low]) * (pos - low))


def latest_balance(db: Session, merchant_id: str) -> BalanceSnapshot | None:
    return db.scalar(
        select(BalanceSnapshot)
        .where(BalanceSnapshot.merchant_id == merchant_id)
        .order_by(BalanceSnapshot.observed_at.desc())
        .limit(1)
    )


def build_forecast(
    db: Session,
    merchant: Merchant,
    obligation: Obligation,
    settings: Settings,
    scenario: ScenarioIn | None = None,
) -> ForecastOut:
    now = datetime.now(UTC)
    due = scenario.due_date if scenario and scenario.due_date else obligation.due_date
    amount = (
        scenario.payment_amount_paise
        if scenario and scenario.payment_amount_paise
        else obligation.amount_paise
    )
    if obligation.status != "confirmed":
        raise ValueError("Only confirmed obligations can be forecast")
    today = business_date()
    if due < today or due > today + timedelta(days=14):
        raise ValueError("Due date must be today or within the next 14 days")

    balance = latest_balance(db, merchant.id)
    base = {
        "as_of": now,
        "due_date": due,
        "obligation_id": obligation.id,
        "obligation_version": obligation.version,
        "payee": obligation.payee,
        "amount_paise": amount,
        "other_confirmed_obligations_paise": 0,
        "reserve_floor_paise": merchant.reserve_floor_paise,
        "scenario_only": scenario is not None,
    }
    common_limitations = [
        "Cash on hand, unconnected accounts, and unconfirmed obligations are not included.",
        "Future inflows are illustrative ranges, not calibrated probabilities or guaranteed receipts.",
    ]
    if balance is None or not balance.consent_active:
        return ForecastOut(
            status="paytm_only",
            balance_paise=None,
            balance_observed_at=None,
            account_id=None,
            predicted_inflow_low_paise=None,
            predicted_inflow_high_paise=None,
            possible_gap_low_paise=None,
            possible_gap_high_paise=None,
            coverage=[
                "No connected account balance. Paytm-only activity cannot establish total cash."
            ],
            limitations=common_limitations,
            evidence=["Obligation confirmed by merchant."],
            **base,
        )

    age = now - aware(balance.observed_at)
    if age < timedelta(0) or age > timedelta(minutes=settings.balance_max_age_minutes):
        return ForecastOut(
            status="stale_balance",
            balance_paise=balance.amount_paise,
            balance_observed_at=aware(balance.observed_at),
            account_id=balance.account_id,
            predicted_inflow_low_paise=None,
            predicted_inflow_high_paise=None,
            possible_gap_low_paise=None,
            possible_gap_high_paise=None,
            coverage=[
                f"Connected account {balance.account_id}; balance too old for a cash-gap estimate."
            ],
            limitations=common_limitations,
            evidence=["Obligation confirmed by merchant.", "Balance snapshot is stale."],
            **base,
        )

    other = db.scalars(
        select(Obligation).where(
            Obligation.merchant_id == merchant.id,
            Obligation.id != obligation.id,
            Obligation.status == "confirmed",
            Obligation.due_date >= today,
            Obligation.due_date <= due,
        )
    ).all()
    other_total = sum(item.amount_paise for item in other)
    base["other_confirmed_obligations_paise"] = other_total

    start = now - timedelta(days=56)
    credits = db.scalars(
        select(MoneyEvent).where(
            MoneyEvent.merchant_id == merchant.id,
            MoneyEvent.account_id == balance.account_id,
            MoneyEvent.source == "synthetic_bank",
            MoneyEvent.kind == "bank_credit",
            MoneyEvent.status == "success",
            MoneyEvent.occurred_at >= start,
            MoneyEvent.occurred_at < now,
        )
    ).all()
    daily = defaultdict(int)
    for item in credits:
        daily[local_date(aware(item.occurred_at))] += item.amount_paise

    historical_days = [(today - timedelta(days=i)) for i in range(1, 57)]
    totals_by_weekday = defaultdict(list)
    for day in historical_days:
        totals_by_weekday[day.weekday()].append(daily[day])
    if sum(1 for value in daily.values() if value > 0) < 8:
        return ForecastOut(
            status="insufficient_history",
            balance_paise=balance.amount_paise,
            balance_observed_at=aware(balance.observed_at),
            account_id=balance.account_id,
            predicted_inflow_low_paise=None,
            predicted_inflow_high_paise=None,
            possible_gap_low_paise=None,
            possible_gap_high_paise=None,
            coverage=[
                f"Connected account {balance.account_id}; insufficient successful credit history."
            ],
            limitations=common_limitations,
            evidence=["Obligation confirmed by merchant.", "Fresh connected balance."],
            **base,
        )

    low = high = 0
    day = today + timedelta(days=1)  # never assume today's full-day receipts remain ahead
    while day <= due:
        samples = totals_by_weekday[day.weekday()]
        low += percentile(samples, 0.10)
        high += percentile(samples, 0.90)
        day += timedelta(days=1)
    funds_low = balance.amount_paise + low - other_total - merchant.reserve_floor_paise
    funds_high = balance.amount_paise + high - other_total - merchant.reserve_floor_paise
    if scenario:
        funds_low += scenario.extra_funds_paise
        funds_high += scenario.extra_funds_paise
        if scenario.extra_funds_paise:
            common_limitations.append(
                "Additional funds are a merchant scenario, not a verified balance."
            )
    gap_low = max(0, amount - funds_high)
    gap_high = max(0, amount - funds_low)
    return ForecastOut(
        status="ready",
        balance_paise=balance.amount_paise,
        balance_observed_at=aware(balance.observed_at),
        account_id=balance.account_id,
        predicted_inflow_low_paise=low,
        predicted_inflow_high_paise=high,
        possible_gap_low_paise=gap_low,
        possible_gap_high_paise=gap_high,
        coverage=[f"Connected account {balance.account_id} and confirmed obligations only."],
        limitations=common_limitations,
        evidence=[
            "Obligation confirmed by merchant.",
            "Fresh connected balance.",
            "Future credits estimated from the previous eight weeks of this account.",
        ],
        **base,
    )

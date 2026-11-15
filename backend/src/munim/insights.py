from collections import defaultdict
from datetime import UTC, datetime, timedelta
from itertools import pairwise
from statistics import median

from sqlalchemy import select
from sqlalchemy.orm import Session

from .forecast import aware, latest_balance
from .models import MoneyEvent, Obligation
from .time_utils import business_date, local_date


def recurring_candidates(db: Session, merchant_id: str) -> list[dict]:
    """Questions to ask, never confirmed bills or supplier classifications."""
    balance = latest_balance(db, merchant_id)
    if balance is None or not balance.consent_active:
        return []
    start = datetime.now(UTC) - timedelta(days=180)
    rows = db.scalars(
        select(MoneyEvent)
        .where(
            MoneyEvent.merchant_id == merchant_id,
            MoneyEvent.account_id == balance.account_id,
            MoneyEvent.source == "synthetic_bank",
            MoneyEvent.kind == "bank_debit",
            MoneyEvent.status == "success",
            MoneyEvent.occurred_at >= start,
        )
        .order_by(MoneyEvent.occurred_at)
    ).all()
    groups: dict[str, list[MoneyEvent]] = defaultdict(list)
    for row in rows:
        if row.counterparty:
            groups[row.counterparty.strip().casefold()].append(row)
    confirmed = {
        row.payee.strip().casefold()
        for row in db.scalars(
            select(Obligation).where(
                Obligation.merchant_id == merchant_id,
                Obligation.status == "confirmed",
                Obligation.due_date >= business_date(),
            )
        ).all()
    }
    result = []
    for key, events in groups.items():
        if len(events) < 3 or key in confirmed:
            continue
        dates = [local_date(aware(event.occurred_at)) for event in events]
        intervals = [(right - left).days for left, right in pairwise(dates)]
        if not intervals or not all(24 <= gap <= 38 for gap in intervals):
            continue
        interval = round(median(intervals))
        candidate_date = dates[-1] + timedelta(days=interval)
        today = business_date()
        while candidate_date < today:
            candidate_date += timedelta(days=interval)
        if candidate_date > today + timedelta(days=14):
            continue
        label = (events[-1].counterparty or "").casefold()
        category = (
            "possible_personal" if any(word in label for word in ("family", "personal", "self transfer"))
            else "possible_emi" if any(word in label for word in ("emi", "loan", "finance"))
            else "possible_rent" if any(word in label for word in ("rent", "landlord", "lease"))
            else "possible_salary" if any(word in label for word in ("salary", "payroll", "wages"))
            else "unclear"
        )
        result.append(
            {
                "category_hint": category,
                "evidence_dates": [day.isoformat() for day in dates[-5:]],
                "counterparty": events[-1].counterparty,
                "suggested_date": candidate_date,
                "historical_amount_min_paise": min(row.amount_paise for row in events),
                "historical_amount_max_paise": max(row.amount_paise for row in events),
                "observations": len(events),
                "state": "unconfirmed_candidate",
                "question": f"Is a payment to {events[-1].counterparty} due around {candidate_date.isoformat()}?",
            }
        )
    return sorted(result, key=lambda row: row["suggested_date"])


def settlement_unmatched(db: Session, merchant_id: str) -> list[dict]:
    """Unmatched records in the demo feed; absence is not proof of a delayed settlement."""
    rows = db.scalars(
        select(MoneyEvent)
        .where(
            MoneyEvent.merchant_id == merchant_id,
            MoneyEvent.source == "synthetic_paytm",
        )
        .order_by(MoneyEvent.occurred_at.desc())
        .limit(1000)
    ).all()
    settled = {
        row.reference for row in rows if row.kind == "settlement" and row.status == "success"
    }
    return [
        {
            "payment_event_id": row.id,
            "reference": row.reference,
            "amount_paise": row.amount_paise,
            "occurred_at": aware(row.occurred_at),
            "state": "no_matching_settlement_record_in_demo_feed",
        }
        for row in rows
        if row.kind == "paytm_payment"
        and row.status == "success"
        and row.reference
        and row.reference not in settled
    ]

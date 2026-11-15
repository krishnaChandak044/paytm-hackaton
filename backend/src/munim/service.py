import json
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import AuditEvent, BalanceSnapshot, Merchant, MoneyEvent, Obligation
from .schemas import BalanceIn, MerchantCreate, MoneyEventIn, ObligationIn, ObligationPatch
from .time_utils import business_date


def audit(
    db: Session, merchant_id: str, actor: str, action: str, subject: str, detail: dict
) -> None:
    db.add(
        AuditEvent(
            merchant_id=merchant_id,
            actor=actor,
            action=action,
            subject_id=subject,
            detail_json=json.dumps(detail, sort_keys=True),
        )
    )


def merchant_or_404(db: Session, merchant_id: str) -> Merchant:
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return merchant


def obligation_or_404(db: Session, merchant_id: str, obligation_id: str) -> Obligation:
    item = db.scalar(
        select(Obligation).where(
            Obligation.id == obligation_id,
            Obligation.merchant_id == merchant_id,
        )
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return item


def create_merchant(db: Session, data: MerchantCreate) -> Merchant:
    existing = db.get(Merchant, data.id)
    if existing:
        if existing.name != data.name:
            raise HTTPException(
                status_code=409, detail="Merchant ID already exists with a different name"
            )
        return existing
    item = Merchant(id=data.id, name=data.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def ingest_money_event(db: Session, data: MoneyEventIn) -> tuple[MoneyEvent, bool]:
    merchant_or_404(db, data.merchant_id)
    if data.source == "synthetic_bank" and data.kind not in {"bank_credit", "bank_debit"}:
        raise HTTPException(status_code=422, detail="Bank source requires bank kind")
    if data.source == "synthetic_paytm" and data.kind in {"bank_credit", "bank_debit"}:
        raise HTTPException(status_code=422, detail="Paytm source cannot create bank activity")
    if data.kind in {"bank_credit", "bank_debit"} and not data.account_id:
        raise HTTPException(status_code=422, detail="Bank activity needs account_id")
    if data.occurred_at.tzinfo is None or data.occurred_at > datetime.now(UTC):
        raise HTTPException(status_code=422, detail="occurred_at must be past and timezone-aware")
    existing = db.scalar(
        select(MoneyEvent).where(
            MoneyEvent.merchant_id == data.merchant_id,
            MoneyEvent.source == data.source,
            MoneyEvent.source_event_id == data.source_event_id,
        )
    )
    if existing:
        same = (
            existing.kind == data.kind
            and existing.status == data.status
            and existing.amount_paise == data.amount_paise
            and existing.account_id == data.account_id
            and existing.reference == data.reference
        )
        if not same:
            raise HTTPException(
                status_code=409, detail="Event ID already used with different facts"
            )
        return existing, False
    item = MoneyEvent(**data.model_dump())
    db.add(item)
    db.flush()
    audit(
        db,
        data.merchant_id,
        "demo_connector",
        "money_event_ingested",
        item.id,
        {"source": data.source, "source_event_id": data.source_event_id},
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Duplicate event") from exc
    db.refresh(item)
    return item, True


def ingest_balance(db: Session, data: BalanceIn) -> BalanceSnapshot:
    merchant_or_404(db, data.merchant_id)
    if data.observed_at.tzinfo is None or data.observed_at > datetime.now(UTC):
        raise HTTPException(status_code=422, detail="observed_at must be past and timezone-aware")
    item = BalanceSnapshot(
        merchant_id=data.merchant_id,
        account_id=data.account_id,
        source="synthetic_connected_bank",
        amount_paise=data.amount_paise,
        observed_at=data.observed_at,
        consent_active=data.consent_active,
    )
    db.add(item)
    db.flush()
    audit(
        db,
        data.merchant_id,
        "demo_connector",
        "balance_snapshot_ingested",
        item.id,
        {"account_id": data.account_id, "consent_active": data.consent_active},
    )
    db.commit()
    db.refresh(item)
    return item


def create_obligation(db: Session, merchant_id: str, data: ObligationIn) -> Obligation:
    merchant_or_404(db, merchant_id)
    if data.due_date < business_date():
        raise HTTPException(status_code=422, detail="due_date must be today or later")
    item = Obligation(merchant_id=merchant_id, **data.model_dump())
    db.add(item)
    db.flush()
    audit(
        db,
        merchant_id,
        "owner",
        "obligation_confirmed",
        item.id,
        {"amount_paise": item.amount_paise, "due_date": item.due_date.isoformat()},
    )
    db.commit()
    db.refresh(item)
    return item


def patch_obligation(db: Session, item: Obligation, data: ObligationPatch) -> Obligation:
    if item.version != data.expected_version:
        raise HTTPException(status_code=409, detail="Obligation changed; refresh before editing")
    updates = data.model_dump(exclude_unset=True, exclude={"expected_version"})
    if "due_date" in updates and updates["due_date"] < business_date():
        raise HTTPException(status_code=422, detail="due_date must be today or later")
    for key, value in updates.items():
        if value is None:
            raise HTTPException(status_code=422, detail=f"{key} cannot be null")
        setattr(item, key, value)
    item.version += 1
    item.confirmed_at = datetime.now(UTC)
    audit(
        db,
        item.merchant_id,
        "owner",
        "obligation_updated",
        item.id,
        {"version": item.version, "fields": list(updates)},
    )
    db.commit()
    db.refresh(item)
    return item

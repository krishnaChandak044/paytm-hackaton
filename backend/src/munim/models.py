from datetime import UTC, date, datetime
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def uid() -> str:
    return str(uuid4())


def utcnow() -> datetime:
    return datetime.now(UTC)


class Merchant(Base):
    __tablename__ = "merchants"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    reserve_floor_paise: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    __table_args__ = (CheckConstraint("reserve_floor_paise >= 0"),)


class MoneyEvent(Base):
    __tablename__ = "money_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), index=True)
    source: Mapped[str] = mapped_column(String(32))  # synthetic_paytm / synthetic_bank
    source_event_id: Mapped[str] = mapped_column(String(160))
    account_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    kind: Mapped[str] = mapped_column(
        String(32)
    )  # paytm_payment / bank_credit / bank_debit / settlement
    status: Mapped[str] = mapped_column(String(32))
    amount_paise: Mapped[int] = mapped_column(Integer)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    counterparty: Mapped[str | None] = mapped_column(String(160), nullable=True)
    reference: Mapped[str | None] = mapped_column(String(160), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    __table_args__ = (
        UniqueConstraint("merchant_id", "source", "source_event_id", name="uq_money_source"),
        CheckConstraint("amount_paise > 0"),
        Index("ix_money_merchant_occurred", "merchant_id", "occurred_at"),
    )


class BalanceSnapshot(Base):
    __tablename__ = "balance_snapshots"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), index=True)
    account_id: Mapped[str] = mapped_column(String(80))
    source: Mapped[str] = mapped_column(String(32))  # synthetic_connected_bank
    amount_paise: Mapped[int] = mapped_column(Integer)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    consent_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    __table_args__ = (
        CheckConstraint("amount_paise >= 0"),
        Index("ix_balance_merchant_account_observed", "merchant_id", "account_id", "observed_at"),
    )


class Obligation(Base):
    __tablename__ = "obligations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), index=True)
    payee: Mapped[str] = mapped_column(String(160))
    amount_paise: Mapped[int] = mapped_column(Integer)
    due_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(24), default="confirmed")
    version: Mapped[int] = mapped_column(Integer, default=1)
    confirmed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    __table_args__ = (CheckConstraint("amount_paise > 0"),)


class ForecastRun(Base):
    __tablename__ = "forecast_runs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), index=True)
    obligation_id: Mapped[str] = mapped_column(ForeignKey("obligations.id"))
    obligation_version: Mapped[int] = mapped_column(Integer)
    balance_snapshot_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    result_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    merchant_id: Mapped[str] = mapped_column(ForeignKey("merchants.id"), index=True)
    actor: Mapped[str] = mapped_column(String(100))
    action: Mapped[str] = mapped_column(String(80))
    subject_id: Mapped[str] = mapped_column(String(100))
    detail_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

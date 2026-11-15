from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class MerchantCreate(StrictModel):
    id: str = Field(pattern=r"^[a-zA-Z0-9_-]{3,64}$")
    name: str = Field(min_length=2, max_length=160)


class MerchantSettingsIn(StrictModel):
    reserve_floor_paise: int = Field(ge=0)


class MoneyEventIn(StrictModel):
    merchant_id: str
    source_event_id: str = Field(min_length=1, max_length=160)
    source: Literal["synthetic_paytm", "synthetic_bank"]
    account_id: str | None = None
    kind: Literal["paytm_payment", "bank_credit", "bank_debit", "settlement", "refund"]
    status: Literal["success", "pending", "failed", "reversed"]
    amount_paise: int = Field(gt=0)
    occurred_at: datetime
    counterparty: str | None = Field(default=None, max_length=160)
    reference: str | None = Field(default=None, max_length=160)


class BalanceIn(StrictModel):
    merchant_id: str
    account_id: str = Field(min_length=1, max_length=80)
    amount_paise: int = Field(ge=0)
    observed_at: datetime
    consent_active: bool = True


class ObligationIn(StrictModel):
    payee: str = Field(min_length=2, max_length=160)
    amount_paise: int = Field(gt=0)
    due_date: date


class ObligationPatch(StrictModel):
    payee: str | None = Field(default=None, min_length=2, max_length=160)
    amount_paise: int | None = Field(default=None, gt=0)
    due_date: date | None = None
    status: Literal["confirmed", "cancelled", "paid"] | None = None
    expected_version: int = Field(ge=1)


class ScenarioIn(StrictModel):
    payment_amount_paise: int | None = Field(default=None, gt=0)
    extra_funds_paise: int = Field(default=0, ge=0)
    due_date: date | None = None


class ForecastOut(StrictModel):
    status: Literal["ready", "paytm_only", "stale_balance", "insufficient_history"]
    as_of: datetime
    due_date: date
    obligation_id: str
    obligation_version: int
    payee: str
    amount_paise: int
    balance_paise: int | None
    balance_observed_at: datetime | None
    account_id: str | None
    predicted_inflow_low_paise: int | None
    predicted_inflow_high_paise: int | None
    other_confirmed_obligations_paise: int
    reserve_floor_paise: int
    possible_gap_low_paise: int | None
    possible_gap_high_paise: int | None
    coverage: list[str]
    limitations: list[str]
    evidence: list[str]
    scenario_only: bool = False


class BridgeCreditIn(StrictModel):
    amount_paise: int = Field(gt=0)
    tenure_days: int = Field(default=3, ge=1, le=7)
    flat_fee_rupees: int = Field(default=49)


class BridgeCreditOut(StrictModel):
    status: Literal["approved", "disbursed"] = "disbursed"
    loan_reference: str
    disbursed_amount_paise: int
    tenure_days: int
    flat_fee_paise: int
    account_credited: str
    forecast: ForecastOut

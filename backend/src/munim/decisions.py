from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from .schemas import ForecastOut


class ActionOption(BaseModel):
    code: str
    title: str
    prerequisite: str
    requires_owner_approval: bool = True


class Advice(BaseModel):
    obligation_id: str
    as_of: datetime
    level: Literal["attention", "insufficient_evidence", "clear_in_visible_scope"]
    message: str
    options: list[ActionOption]
    evidence: list[str]


def make_advice(forecast: ForecastOut) -> Advice:
    common = {
        "obligation_id": forecast.obligation_id,
        "as_of": forecast.as_of,
        "evidence": forecast.evidence + forecast.coverage + forecast.limitations,
    }
    if forecast.status != "ready":
        return Advice(
            level="insufficient_evidence",
            message="A cash-gap warning needs a fresh connected balance and sufficient account history.",
            options=[
                ActionOption(
                    code="CHECK_DATA",
                    title="Review data coverage",
                    prerequisite="Owner authorises or refreshes the relevant account connection.",
                )
            ],
            **common,
        )
    if forecast.possible_gap_high_paise == 0:
        return Advice(
            level="clear_in_visible_scope",
            message="No gap appears in the observed account and confirmed obligations; unseen cash flows remain outside this view.",
            options=[],
            **common,
        )
    return Advice(
        level="attention",
        message=(
            "A shortfall is possible in the observed account before this confirmed obligation is due. "
            "Review missing cash flows and any change to the payment terms before acting."
        ),
        options=[
            ActionOption(
                code="VERIFY_COVERAGE",
                title="Check funds and obligations not yet connected",
                prerequisite="Owner confirms any cash, other accounts, or earlier bills.",
            ),
            ActionOption(
                code="SUPPLIER_SPLIT",
                title="Explore splitting or moving the payment",
                prerequisite="Supplier must agree; no message or payment is sent automatically.",
            ),
            ActionOption(
                code="SETTLEMENT_REVIEW",
                title="Review eligible settlement timing",
                prerequisite="Eligibility, actual arrival time, and cost must be verified first.",
            ),
        ],
        **common,
    )

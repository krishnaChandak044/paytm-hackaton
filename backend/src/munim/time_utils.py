from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo

BUSINESS_ZONE = ZoneInfo("Asia/Kolkata")


def business_date() -> date:
    return datetime.now(UTC).astimezone(BUSINESS_ZONE).date()


def local_date(value: datetime) -> date:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(BUSINESS_ZONE).date()

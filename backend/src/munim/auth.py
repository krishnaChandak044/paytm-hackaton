from datetime import UTC, datetime, timedelta
from typing import Literal

import jwt
from fastapi import Depends, Header, HTTPException, status
from pydantic import BaseModel

from .config import Settings, get_settings


class Principal(BaseModel):
    merchant_id: str
    role: Literal["owner", "viewer"]


def create_demo_token(merchant_id: str, settings: Settings, role: str = "owner") -> str:
    now = datetime.now(UTC)
    return jwt.encode(
        {
            "sub": merchant_id,
            "role": role,
            "iss": "munim",
            "aud": "munim-api",
            "iat": now,
            "exp": now + timedelta(hours=2),
        },
        settings.jwt_secret,
        algorithm="HS256",
    )


def principal(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> Principal:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required"
        )
    try:
        claims = jwt.decode(
            authorization[7:],
            settings.jwt_secret,
            algorithms=["HS256"],
            audience="munim-api",
            issuer="munim",
            options={"require": ["exp", "iat", "sub", "role"]},
        )
        return Principal(merchant_id=claims["sub"], role=claims["role"])
    except (jwt.PyJWTError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc


def owner(p: Principal = Depends(principal)) -> Principal:
    if p.role != "owner":
        raise HTTPException(status_code=403, detail="Owner role required")
    return p


def demo_ingest_auth(
    x_demo_ingest_key: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> None:
    import hmac

    if not settings.allow_demo_ingest or settings.environment == "production":
        raise HTTPException(status_code=404, detail="Not found")
    if not x_demo_ingest_key or not hmac.compare_digest(
        x_demo_ingest_key, settings.demo_ingest_key
    ):
        raise HTTPException(status_code=401, detail="Invalid demo ingestion key")

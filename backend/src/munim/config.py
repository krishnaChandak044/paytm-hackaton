from functools import lru_cache

from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_JWT_SECRET = "paytm-munim-default-jwt-secret-key-min-32-chars-long"
DEFAULT_DEMO_INGEST_KEY = "demo-ingest-secret-32-chars-key-paytm-munim"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="MUNIM_", env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str = "sqlite:///./munim.db"
    jwt_secret: str = DEFAULT_JWT_SECRET
    demo_ingest_key: str = DEFAULT_DEMO_INGEST_KEY
    sarvam_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("SARVAM_API_KEY", "MUNIM_SARVAM_API_KEY"),
    )
    allow_demo_ingest: bool = True
    balance_max_age_minutes: int = Field(default=120, ge=1, le=1440)

    @model_validator(mode="after")
    def validate_secrets(self) -> "Settings":
        if not self.jwt_secret or len(self.jwt_secret) < 32:
            self.jwt_secret = DEFAULT_JWT_SECRET
        if not self.demo_ingest_key or len(self.demo_ingest_key) < 32:
            self.demo_ingest_key = DEFAULT_DEMO_INGEST_KEY
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()

from functools import lru_cache

from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="MUNIM_", env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str = "sqlite:///./munim.db"
    jwt_secret: str = ""
    demo_ingest_key: str = ""
    sarvam_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("SARVAM_API_KEY", "MUNIM_SARVAM_API_KEY"),
    )
    allow_demo_ingest: bool = False
    balance_max_age_minutes: int = Field(default=120, ge=1, le=1440)

    @model_validator(mode="after")
    def validate_secrets(self) -> "Settings":
        if len(self.jwt_secret) < 32:
            raise ValueError("MUNIM_JWT_SECRET must contain at least 32 characters")
        if self.allow_demo_ingest and len(self.demo_ingest_key) < 32:
            raise ValueError("MUNIM_DEMO_INGEST_KEY must contain at least 32 characters")
        if self.environment == "production" and self.allow_demo_ingest:
            raise ValueError("Synthetic ingestion is forbidden in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()

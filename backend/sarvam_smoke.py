"""One Sarvam chat call. Run with: uv run python sarvam_smoke.py"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from sarvamai import SarvamAI


class SarvamSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=Path(__file__).with_name(".env"), extra="ignore")
    sarvam_api_key: str = ""


key = SarvamSettings().sarvam_api_key
if not key:
    raise SystemExit("Set SARVAM_API_KEY in backend/.env, then run this script again.")

client = SarvamAI(api_subscription_key=key)
reply = client.chat.completions(
    model="sarvam-105b",
    messages=[{"role": "user", "content": "Say hello to a small shop owner in one short sentence."}],
    max_tokens=4096,
)
content = reply.choices[0].message.content
if content:
    print(content)
else:
    print("Sarvam call succeeded but returned no text. Finish reason:", reply.choices[0].finish_reason)

"""Merchant-authorized Sarvam text interpretation. Never writes financial records."""
import json
from datetime import date

import httpx
from fastapi import HTTPException, UploadFile
from pydantic import BaseModel, Field

from .config import get_settings


class DraftRequest(BaseModel):
    text: str = Field(min_length=3, max_length=1000)


class DraftResponse(BaseModel):
    transcript: str
    payee: str | None = None
    amount_paise: int | None = None
    due_date: date | None = None
    category: str | None = None
    needs_clarification: bool = True
    clarification_question: str | None = None
    source: str = "sarvam_ai_draft"


class DebitPatternRequest(BaseModel):
    counterparty: str = Field(min_length=1, max_length=160)
    amount_min_paise: int = Field(gt=0)
    amount_max_paise: int = Field(gt=0)
    payment_dates: list[date] = Field(min_length=3, max_length=12)


class DebitPatternInterpretation(BaseModel):
    category_hint: str
    explanation: str
    confidence: str
    needs_merchant_confirmation: bool = True


class MunimQuestion(BaseModel):
    message: str = Field(min_length=2, max_length=500)


class MunimAnswer(BaseModel):
    answer: str
    grounded: bool = True


async def parse_draft(text: str, key: str | None = None) -> DraftResponse:
    key = key or get_settings().sarvam_api_key
    if not key:
        raise HTTPException(status_code=503, detail="Sarvam AI is not configured. Use manual entry.")
    prompt = (
        "Extract a merchant's upcoming payment from Hindi, Hinglish, or English. "
        "Return ONLY a JSON object with payee (string or null), amount_paise (integer or null), "
        "due_date (YYYY-MM-DD or null), category (supplier/rent/salary/emi/personal/unclear), "
        "needs_clarification (boolean), clarification_question (string or null). "
        "Do not guess missing dates, amounts, payees, or business purpose. Today is "
        f"{date.today().isoformat()}. Merchant said: {text}"
    )
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                "https://api.sarvam.ai/v1/chat/completions",
                headers={"api-subscription-key": key},
                json={"model": "sarvam-105b", "messages": [{"role": "user", "content": prompt}], "max_tokens": 300},
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
        raw = json.loads(content.strip().removeprefix("```json").removesuffix("```").strip())
        result = DraftResponse(transcript=text, **raw)
        result.needs_clarification = result.needs_clarification or not all(
            [result.payee, result.amount_paise, result.due_date]
        )
        return result
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=502, detail="AI could not prepare a reliable draft. Use manual entry.") from exc


async def interpret_debit_pattern(data: DebitPatternRequest) -> DebitPatternInterpretation:
    key = get_settings().sarvam_api_key
    if not key:
        raise HTTPException(status_code=503, detail="Sarvam AI is not configured.")
    prompt = (
        "Return JSON only: category_hint (possible_supplier, possible_rent, possible_salary, "
        "possible_emi, possible_personal, or unclear), explanation (one short sentence), "
        "confidence (low or medium). Purpose is unconfirmed; the label is weak evidence. "
        "Use unclear if uncertain. Do not infer identity. "
        f"Payee label: {data.counterparty!r}. Amount: {data.amount_min_paise}-{data.amount_max_paise} paise. "
        f"Dates: {', '.join(d.isoformat() for d in data.payment_dates)}."
    )
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                "https://api.sarvam.ai/v1/chat/completions",
                headers={"api-subscription-key": key},
                json={
                    "model": "sarvam-105b",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 1800,
                },
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"].get("content")
        if not isinstance(content, str) or not content.strip():
            raise ValueError("AI returned no interpretation")
        raw = json.loads(content.strip().removeprefix("```json").removesuffix("```").strip())
        result = DebitPatternInterpretation(**raw)
        if result.category_hint not in {
            "possible_supplier", "possible_rent", "possible_salary", "possible_emi", "possible_personal", "unclear"
        }:
            raise ValueError("Invalid category")
        return result
    except (ValueError, KeyError, TypeError, AttributeError):
        # The model can exhaust its output budget and return content=None with HTTP 200.
        # Preserve the observed pattern without inventing a business purpose.
        return DebitPatternInterpretation(
            category_hint="unclear",
            explanation="These payments repeat, but their business purpose cannot be determined from the pattern alone. Please confirm it.",
            confidence="low",
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not interpret this pattern. Merchant can review it manually.") from exc


async def answer_merchant(question: MunimQuestion, context_json: str) -> MunimAnswer:
    key = get_settings().sarvam_api_key
    if not key:
        raise HTTPException(status_code=503, detail="Munim AI is unavailable; please use the figures shown on the dashboard.")
    prompt = (
        "You are Munim, a concise business copilot for a small Indian merchant. Answer in plain, simple language, "
        "prefer the language used by the merchant, and keep to 2-4 short sentences. Use ONLY the supplied context. "
        "Explain estimates as estimates, identify missing or stale inputs, and never invent facts, guarantees, loan advice, "
        "supplier agreement, settlement timing, or claim a payment happened. Never initiate actions. If context is insufficient, "
        "say what is missing. Context JSON: " + context_json + "\nMerchant asks: " + question.message
    )
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(
                "https://api.sarvam.ai/v1/chat/completions",
                headers={"api-subscription-key": key},
                json={
                    "model": "sarvam-105b-conversations",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 2000,
                },
            )
            response.raise_for_status()
            answer = response.json()["choices"][0]["message"]["content"]
        if not answer or not answer.strip():
            raise ValueError("Empty response")
        return MunimAnswer(answer=answer.strip())
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=502, detail="Munim could not answer right now. Try again or use the dashboard figures.") from exc


async def transcribe_audio(file: UploadFile, key: str | None = None) -> DraftResponse:
    key = key or get_settings().sarvam_api_key
    if not key:
        raise HTTPException(status_code=503, detail="Sarvam AI is not configured. Use manual entry.")
    audio = await file.read(6_000_001)
    if not audio or len(audio) > 6_000_000:
        raise HTTPException(status_code=422, detail="Record a short voice note under 6 MB.")
    try:
        async with httpx.AsyncClient(timeout=35) as client:
            response = await client.post(
                "https://api.sarvam.ai/speech-to-text",
                headers={"api-subscription-key": key},
                files={"file": (file.filename or "merchant.webm", audio, file.content_type or "audio/webm")},
                data={"model": "saaras:v4", "mode": "transcribe"},
            )
            response.raise_for_status()
            transcript = response.json()["transcript"]
        if not transcript.strip():
            raise ValueError("Empty transcript")
        return await parse_draft(transcript, key)
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        raise HTTPException(status_code=502, detail="Voice transcription failed. Type the payment instead.") from exc

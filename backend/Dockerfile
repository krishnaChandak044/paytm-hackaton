FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/src \
    MUNIM_ENVIRONMENT="development" \
    MUNIM_ALLOW_DEMO_INGEST="true" \
    MUNIM_DATABASE_URL="sqlite:///./munim.db" \
    MUNIM_JWT_SECRET="paytm-munim-default-jwt-secret-key-min-32-chars-long" \
    MUNIM_DEMO_INGEST_KEY="demo-ingest-secret-32-chars-key-paytm-munim" \
    MUNIM_BALANCE_MAX_AGE_MINUTES="120"

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "python seed_demo.py && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

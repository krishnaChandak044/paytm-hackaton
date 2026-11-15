import os
import tempfile
from pathlib import Path

os.environ["MUNIM_ENVIRONMENT"] = "development"
os.environ["MUNIM_DATABASE_URL"] = f"sqlite:///{Path(tempfile.mkdtemp()) / 'test.db'}"
os.environ["MUNIM_JWT_SECRET"] = "test-secret-must-be-at-least-32-characters-long"
os.environ["MUNIM_DEMO_INGEST_KEY"] = "test-ingest-key-must-be-at-least-32-characters"
os.environ["MUNIM_ALLOW_DEMO_INGEST"] = "true"

import pytest
from fastapi.testclient import TestClient

from munim.api import app
from munim.db import Base, engine


@pytest.fixture
def client():
    Base.metadata.drop_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def demo_client(client):
    client.headers.update({"X-Demo-Ingest-Key": os.environ["MUNIM_DEMO_INGEST_KEY"]})
    response = client.post("/demo/merchants", json={"id": "shop1", "name": "Test Shop"})
    assert response.status_code == 200, response.text
    token = client.post("/demo/token?merchant_id=shop1").json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client

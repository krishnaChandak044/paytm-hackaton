from datetime import UTC, datetime, timedelta


def obligation(client, due_days=4, amount=3800000):
    date = (datetime.now(UTC) + timedelta(days=due_days)).date().isoformat()
    response = client.post(
        "/v1/obligations",
        json={
            "payee": "Gupta Traders",
            "amount_paise": amount,
            "due_date": date,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_unauthenticated_and_paytm_only(client, demo_client):
    item = obligation(demo_client)
    demo_client.headers.pop("Authorization")
    assert demo_client.get("/v1/obligations").status_code == 401
    token = demo_client.post("/demo/token?merchant_id=shop1").json()["access_token"]
    demo_client.headers["Authorization"] = f"Bearer {token}"
    result = demo_client.get(f"/v1/obligations/{item['id']}/forecast")
    assert result.status_code == 200
    body = result.json()
    assert body["status"] == "paytm_only"
    assert body["possible_gap_low_paise"] is None
    advice = demo_client.get(f"/v1/obligations/{item['id']}/advice").json()
    assert advice["level"] == "insufficient_evidence"


def test_idempotent_ingest_and_conflict(demo_client):
    event = {
        "merchant_id": "shop1",
        "source_event_id": "bank-1",
        "source": "synthetic_bank",
        "account_id": "acct1",
        "kind": "bank_credit",
        "status": "success",
        "amount_paise": 10000,
        "occurred_at": (datetime.now(UTC) - timedelta(days=1)).isoformat(),
    }
    first = demo_client.post("/demo/money-events", json=event)
    second = demo_client.post("/demo/money-events", json=event)
    assert first.status_code == second.status_code == 200
    assert first.json()["created"] is True
    assert second.json()["created"] is False
    event["amount_paise"] = 20000
    assert demo_client.post("/demo/money-events", json=event).status_code == 409


def test_forecast_scenarios_and_stale_version(demo_client):
    item = obligation(demo_client)
    now = datetime.now(UTC)
    for i in range(1, 57):
        event = {
            "merchant_id": "shop1",
            "source_event_id": f"credit-{i}",
            "source": "synthetic_bank",
            "account_id": "acct1",
            "kind": "bank_credit",
            "status": "success",
            "amount_paise": 300000,
            "occurred_at": (now - timedelta(days=i)).isoformat(),
        }
        assert demo_client.post("/demo/money-events", json=event).status_code == 200
    snapshot = {
        "merchant_id": "shop1",
        "account_id": "acct1",
        "amount_paise": 1000000,
        "observed_at": now.isoformat(),
    }
    assert demo_client.post("/demo/balance-snapshots", json=snapshot).status_code == 200
    result = demo_client.get(f"/v1/obligations/{item['id']}/forecast")
    assert result.status_code == 200, result.text
    body = result.json()
    assert body["status"] == "ready"
    assert body["possible_gap_high_paise"] >= body["possible_gap_low_paise"]
    alternative = demo_client.post(
        f"/v1/obligations/{item['id']}/scenarios",
        json={
            "extra_funds_paise": 2000000,
        },
    ).json()
    assert alternative["scenario_only"] is True
    assert alternative["possible_gap_high_paise"] < body["possible_gap_high_paise"]

    bridge_resp = demo_client.post(
        f"/v1/obligations/{item['id']}/bridge-credit",
        json={"amount_paise": 2000000, "tenure_days": 3, "flat_fee_rupees": 49},
    )
    assert bridge_resp.status_code == 200
    bridge_body = bridge_resp.json()
    assert bridge_body["status"] == "disbursed"
    assert bridge_body["disbursed_amount_paise"] == 2000000
    assert bridge_body["loan_reference"].startswith("PAYTM-OD-")
    assert bridge_body["forecast"]["possible_gap_high_paise"] < body["possible_gap_high_paise"]

    patch = {"expected_version": 1, "amount_paise": 2000000}
    assert demo_client.patch(f"/v1/obligations/{item['id']}", json=patch).status_code == 200
    assert demo_client.patch(f"/v1/obligations/{item['id']}", json=patch).status_code == 409


def test_stale_balance_never_produces_cash_gap(demo_client):
    item = obligation(demo_client)
    snapshot = {
        "merchant_id": "shop1",
        "account_id": "acct1",
        "amount_paise": 1000000,
        "observed_at": (datetime.now(UTC) - timedelta(days=2)).isoformat(),
    }
    assert demo_client.post("/demo/balance-snapshots", json=snapshot).status_code == 200
    body = demo_client.get(f"/v1/obligations/{item['id']}/forecast").json()
    assert body["status"] == "stale_balance"
    assert body["possible_gap_low_paise"] is None


def test_reserve_floor_is_owner_controlled(demo_client):
    response = demo_client.patch("/v1/merchant-settings", json={"reserve_floor_paise": 500000})
    assert response.status_code == 200
    assert demo_client.get("/v1/merchant-settings").json()["reserve_floor_paise"] == 500000
    assert (
        demo_client.patch("/v1/merchant-settings", json={"reserve_floor_paise": -1}).status_code
        == 422
    )


def test_tenant_scope(demo_client):
    item = obligation(demo_client)
    assert (
        demo_client.post("/demo/merchants", json={"id": "shop2", "name": "Other Shop"}).status_code
        == 200
    )
    token = demo_client.post("/demo/token?merchant_id=shop2").json()["access_token"]
    demo_client.headers["Authorization"] = f"Bearer {token}"
    assert demo_client.get(f"/v1/obligations/{item['id']}/forecast").status_code == 404
    assert demo_client.get("/v1/obligations").json() == []


def test_revoked_consent_withdraws_gap(demo_client):
    item = obligation(demo_client)
    now = datetime.now(UTC)
    base = {"merchant_id": "shop1", "account_id": "acct1", "amount_paise": 1000000}
    assert (
        demo_client.post(
            "/demo/balance-snapshots",
            json={
                **base,
                "observed_at": (now - timedelta(minutes=1)).isoformat(),
            },
        ).status_code
        == 200
    )
    assert (
        demo_client.post(
            "/demo/balance-snapshots",
            json={
                **base,
                "observed_at": now.isoformat(),
                "consent_active": False,
            },
        ).status_code
        == 200
    )
    result = demo_client.get(f"/v1/obligations/{item['id']}/forecast").json()
    assert result["status"] == "paytm_only"
    assert result["balance_paise"] is None


def test_unmatched_payment_is_not_called_delayed(demo_client):
    now = datetime.now(UTC) - timedelta(hours=1)
    payment = {
        "merchant_id": "shop1",
        "source": "synthetic_paytm",
        "source_event_id": "pay1",
        "kind": "paytm_payment",
        "status": "success",
        "amount_paise": 50000,
        "occurred_at": now.isoformat(),
        "reference": "order-123",
    }
    assert demo_client.post("/demo/money-events", json=payment).status_code == 200
    unmatched = demo_client.get("/v1/settlement-unmatched").json()
    assert len(unmatched) == 1
    assert unmatched[0]["state"] == "no_matching_settlement_record_in_demo_feed"
    settlement = {**payment, "source_event_id": "settle1", "kind": "settlement"}
    assert demo_client.post("/demo/money-events", json=settlement).status_code == 200
    assert demo_client.get("/v1/settlement-unmatched").json() == []

"""Tests for Campaigns and Authentication management."""

import base64
import json
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.core.database import InMemoryTransactionSession, get_db
from backend.app.main import app
from backend.app.models.store import global_store


@pytest.fixture(autouse=True)
def clean_store():
    global_store.clear()
    yield
    global_store.clear()


@pytest.fixture
def client():
    def override_get_db():
        session = InMemoryTransactionSession()
        try:
            yield session
            session.commit()
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def make_mock_jwt(sub: str) -> str:
    """Creates an unencrypted mock JWT structure containing the given sub claim."""
    header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({"sub": sub, "role": "authenticated"}).encode()).decode().rstrip("=")
    signature = base64.urlsafe_b64encode(b"sig").decode().rstrip("=")
    return f"{header}.{payload}.{signature}"


def test_auth_me_dev_fallback(client):
    """Verify that calling /auth/me without headers returns default dev user."""
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_authenticated"] is True
    assert data["is_development_fallback"] is True
    assert data["user_id"] == "00000000-0000-0000-0000-000000000001"


def test_auth_me_with_bearer_token(client):
    """Verify that calling /auth/me with a Bearer JWT parses the subject UUID."""
    user_uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    token = make_mock_jwt(user_uuid)

    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_authenticated"] is True
    assert data["is_development_fallback"] is False
    assert data["user_id"] == user_uuid


def test_create_and_list_campaigns(client):
    """Verify creating a campaign and listing it."""
    # 1. Create campaign
    create_resp = client.post(
        "/api/v1/campaigns",
        json={"name": "Winter 2026 Recruitment Hackathon"},
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["id"] > 0
    assert created["name"] == "Winter 2026 Recruitment Hackathon"
    assert created["total_datasets"] == 0

    campaign_id = created["id"]

    # 2. List campaigns
    list_resp = client.get("/api/v1/campaigns")
    assert list_resp.status_code == 200
    campaigns = list_resp.json()
    assert len(campaigns) >= 1
    assert any(c["id"] == campaign_id for c in campaigns)

    # 3. Get campaign detail
    detail_resp = client.get(f"/api/v1/campaigns/{campaign_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == campaign_id
    assert detail["name"] == "Winter 2026 Recruitment Hackathon"
    assert detail["datasets"] == []

    # 4. Delete campaign
    del_resp = client.delete(f"/api/v1/campaigns/{campaign_id}")
    assert del_resp.status_code == 200

    # 5. Verify 404 after deletion
    get_again = client.get(f"/api/v1/campaigns/{campaign_id}")
    assert get_again.status_code == 404


def test_upload_dataset_linked_to_campaign(client):
    """Verify uploading a dataset explicitly linked to a campaign via campaign_id."""
    # 1. Create campaign
    camp_resp = client.post("/api/v1/campaigns", json={"name": "Campus Hiring 2026"})
    camp_id = camp_resp.json()["id"]

    # 2. Upload CSV with campaign_id query param
    sample_csv = "team_id,team_name,name,email,experience_years\nT1,Alpha,Alice,alice@example.com,2.0\n"
    upload_resp = client.post(
        f"/api/v1/imports?filename=campus_teams.csv&campaign_id={camp_id}",
        content=sample_csv,
        headers={"content-type": "text/csv"},
    )
    assert upload_resp.status_code == 201
    upload_data = upload_resp.json()
    assert upload_data["status"] == "success"

    # 3. Retrieve campaign and verify dataset is attached
    detail_resp = client.get(f"/api/v1/campaigns/{camp_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["total_datasets"] == 1
    assert detail["datasets"][0]["name"] == "campus_teams.csv"

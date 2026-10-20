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


from backend.app.core.security import create_test_jwt


def make_mock_jwt(sub: str) -> str:
    """Creates a Supabase-compatible mock JWT signed with the active JWT secret."""
    return create_test_jwt(sub=sub)


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


def test_tenant_isolation_campaign_access(client):
    """User B cannot access or delete User A's campaign."""
    user_a = "11111111-1111-1111-1111-111111111111"
    user_b = "22222222-2222-2222-2222-222222222222"
    token_a = make_mock_jwt(user_a)
    token_b = make_mock_jwt(user_b)

    # 1. User A creates campaign
    resp_a = client.post(
        "/api/v1/campaigns",
        json={"name": "ACM Private Hackathon"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert resp_a.status_code == 201
    camp_id = resp_a.json()["id"]

    # 2. User B tries to view User A's campaign -> 403 Forbidden
    resp_b_get = client.get(
        f"/api/v1/campaigns/{camp_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp_b_get.status_code == 403

    # 3. User B tries to delete User A's campaign -> 403 Forbidden
    resp_b_del = client.delete(
        f"/api/v1/campaigns/{camp_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp_b_del.status_code == 403


def test_tenant_isolation_dataset_upload_forbidden(client):
    """User B cannot upload a dataset linked to User A's campaign."""
    user_a = "11111111-1111-1111-1111-111111111111"
    user_b = "22222222-2222-2222-2222-222222222222"
    token_a = make_mock_jwt(user_a)
    token_b = make_mock_jwt(user_b)

    # 1. User A creates campaign
    resp_a = client.post(
        "/api/v1/campaigns",
        json={"name": "ACM Hackathon"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    camp_id = resp_a.json()["id"]

    # 2. User B tries to upload dataset into User A's campaign -> 403 Forbidden
    sample_csv = "team_id,team_name,name,email,experience_years\nT1,Alpha,Alice,alice@example.com,2.0\n"
    upload_resp = client.post(
        f"/api/v1/imports?filename=forged.csv&campaign_id={camp_id}",
        content=sample_csv,
        headers={"content-type": "text/csv", "Authorization": f"Bearer {token_b}"},
    )
    assert upload_resp.status_code == 403




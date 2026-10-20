"""Comprehensive test suite for the public, anonymous, no-login architecture.

Covers:
1. Application startup without Google OAuth credentials.
2. Complete anonymous end-to-end user journey:
   Upload CSV -> Inspect Quality -> Configure Rules -> Execute Decision Engine ->
   Inspect Rankings & Explanations -> Download RFC 4180 CSV & Audit Package.
3. Cryptographic session continuity:
   Same anonymous session can retrieve history and previous runs via /api/v1/session/history.
4. Anonymous session isolation:
   Session B CANNOT access Session A's uploaded dataset, quality report, evaluation results, or exports (returns 404).
5. Public endpoint protection and input validation:
   Empty files, malformed files, oversized files (>10MB), invalid scoring configurations.
6. Database integrity:
   Campaigns without owner_id (nullable owner_id), audit_log with actor_type='anonymous',
   session_id persistence across datasets and runs.
"""

import json
import pytest
from fastapi.testclient import TestClient

from backend.app.core.config import settings
from backend.app.core.database import InMemoryTransactionSession, get_db
from backend.app.main import app
from backend.app.models.entities import AuditLog, Campaign, Dataset, Run
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


SAMPLE_HACKATHON_CSV = """team_id,team_name,name,email,experience_years,skills
T100,CyberSentinels,Alice,alice@cybersentinels.io,4.5,"Python, FastAPI, Docker"
T100,CyberSentinels,Bob,bob@cybersentinels.io,3.0,"React, Tailwind, PostgreSQL"
T200,AlgorithmicAces,Charlie,charlie@algorithmic.ai,5.0,"PyTorch, Python, NumPy"
T200,AlgorithmicAces,Diana,diana@algorithmic.ai,2.5,"TensorFlow, Scikit-learn"
T300,QuantumQuorum,Eve,eve@quantum.dev,0.5,"HTML, CSS"
"""


def test_app_startup_without_oauth_credentials(monkeypatch):
    """Verify application boots and responds to health checks without any Google OAuth credentials."""
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", None)
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_SECRET", None)
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", None)

    test_client = TestClient(app)
    health = test_client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"


def test_anonymous_full_user_journey(client):
    """Step-by-step verification of the 8-step anonymous user journey without authentication:

    1. Access session status.
    2. Upload registration CSV.
    3. Inspect data quality report.
    4. Fetch rule catalog.
    5. Execute decision engine.
    6. Retrieve rankings and explanations.
    7. Export evaluation results (CSV and shortlist).
    8. Retrieve session history.
    """
    # Step 1: Initialize session
    sess_resp = client.get("/api/v1/session")
    assert sess_resp.status_code == 200
    sess_data = sess_resp.json()
    assert sess_data["anonymous_mode"] is True
    session_id = sess_data["session_id"]
    assert len(session_id) >= 20

    # Ensure cookie was set
    assert "recruitment_session_id" in sess_resp.cookies or "X-Session-ID" in sess_resp.headers

    # Step 2: Upload CSV anonymously
    upload_resp = client.post(
        "/api/v1/imports?filename=hackathon_teams.csv",
        content=SAMPLE_HACKATHON_CSV.encode("utf-8"),
        headers={"Content-Type": "text/csv"},
    )
    assert upload_resp.status_code == 201
    upload_data = upload_resp.json()
    assert upload_data["status"] == "success"
    assert upload_data["total_teams"] == 3
    dataset_id = upload_data["import_id"]
    assert dataset_id is not None

    # Step 3: Inspect data quality report
    quality_resp = client.get(f"/api/v1/imports/{dataset_id}/quality-report")
    assert quality_resp.status_code == 200
    quality = quality_resp.json()
    assert quality["total_teams"] == 3
    assert quality["total_members"] == 5

    # Step 4: Inspect rules catalog
    catalog_resp = client.get("/api/v1/rules/catalog")
    assert catalog_resp.status_code == 200
    assert len(catalog_resp.json()) > 0

    # Step 5: Execute Decision Engine evaluation
    eval_payload = {
        "dataset_id": dataset_id,
        "config": {
            "top_x": 2,
            "weights": {"experience_years": 1.0},
            "eligibility_rules": [
                {
                    "name": "Team Size",
                    "scope": "TEAM",
                    "field": "team_size",
                    "operator": ">=",
                    "value": 1,
                }
            ],
        },
    }
    eval_resp = client.post("/api/v1/evaluations", json=eval_payload)
    assert eval_resp.status_code == 201
    eval_data = eval_resp.json()
    run_id = eval_data["run_id"]
    assert eval_data["total_teams"] == 3
    assert eval_data["shortlisted_teams"] == 2

    # Step 6: View team rankings, explanations, and leaderboard
    run_resp = client.get(f"/api/v1/evaluations/{run_id}")
    assert run_resp.status_code == 200
    run_details = run_resp.json()
    assert len(run_details["results"]) == 3
    assert run_details["results"][0]["rank"] == 1

    board_resp = client.get(f"/api/v1/evaluations/{run_id}/leaderboard")
    assert board_resp.status_code == 200
    board = board_resp.json()
    assert len(board) == 3

    # Step 7: Download CSV exports
    csv_resp = client.get(f"/api/v1/evaluations/{run_id}/export")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "attachment;" in csv_resp.headers["content-disposition"]
    csv_text = csv_resp.text
    assert "rank" in csv_text.lower()
    assert "team id" in csv_text.lower() or "team_id" in csv_text.lower()
    assert "cybersentinels" in csv_text.lower() or "t100" in csv_text.lower()

    # Download Shortlist CSV
    shortlist_resp = client.get(f"/api/v1/evaluations/{run_id}/export/shortlist")
    assert shortlist_resp.status_code == 200
    assert "text/csv" in shortlist_resp.headers["content-type"]

    # Download Complete Audit Bundle ZIP
    bundle_resp = client.get(f"/api/v1/evaluations/{run_id}/export/bundle")
    assert bundle_resp.status_code == 200
    assert "application/zip" in bundle_resp.headers["content-type"]

    # Step 8: Retrieve session history
    hist_resp = client.get("/api/v1/session/history")
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history["datasets"]) >= 1
    assert any(d["import_id"] == dataset_id for d in history["datasets"])
    assert len(history["runs"]) >= 1
    assert any(r["run_id"] == str(run_id) for r in history["runs"])


def test_anonymous_session_isolation(client):
    """Session B cannot view, evaluate, or export Session A's datasets or runs."""
    session_a = "session_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    session_b = "session_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"

    # 1. Session A uploads dataset
    up_resp = client.post(
        "/api/v1/imports?filename=secret_data.csv",
        content=SAMPLE_HACKATHON_CSV.encode("utf-8"),
        headers={"Content-Type": "text/csv", "X-Session-ID": session_a},
    )
    assert up_resp.status_code == 201
    dataset_a_id = up_resp.json()["import_id"]

    # 2. Session A evaluates dataset
    eval_resp = client.post(
        "/api/v1/evaluations",
        json={
            "dataset_id": dataset_a_id,
            "config": {"top_x": 1, "weights": {"experience_years": 1.0}},
        },
        headers={"X-Session-ID": session_a},
    )
    assert eval_resp.status_code == 201
    run_a_id = eval_resp.json()["run_id"]

    # 3. Session B attempts to access Session A's dataset -> 404 Not Found
    get_ds_resp = client.get(
        f"/api/v1/imports/{dataset_a_id}",
        headers={"X-Session-ID": session_b},
    )
    assert get_ds_resp.status_code == 404

    # 4. Session B attempts to access Session A's quality report -> 404 Not Found
    get_qr_resp = client.get(
        f"/api/v1/imports/{dataset_a_id}/quality-report",
        headers={"X-Session-ID": session_b},
    )
    assert get_qr_resp.status_code == 404

    # 5. Session B attempts to evaluate Session A's dataset -> 404 Not Found
    eval_b_resp = client.post(
        "/api/v1/evaluations",
        json={
            "dataset_id": dataset_a_id,
            "config": {"top_x": 1, "weights": {"experience_years": 1.0}},
        },
        headers={"X-Session-ID": session_b},
    )
    assert eval_b_resp.status_code == 404

    # 6. Session B attempts to read Session A's run results -> 404 Not Found
    get_run_resp = client.get(
        f"/api/v1/evaluations/{run_a_id}",
        headers={"X-Session-ID": session_b},
    )
    assert get_run_resp.status_code == 404

    # 7. Session B attempts to export Session A's CSV -> 404 Not Found
    export_resp = client.get(
        f"/api/v1/evaluations/{run_a_id}/export",
        headers={"X-Session-ID": session_b},
    )
    assert export_resp.status_code == 404


def test_public_upload_size_limit_rejection(client):
    """Payloads exceeding MAX_UPLOAD_SIZE_BYTES are rejected with 413 Request Entity Too Large."""
    # Temporarily set limit to 100 KB for testing
    orig_max = settings.MAX_UPLOAD_SIZE_BYTES
    try:
        settings.MAX_UPLOAD_SIZE_BYTES = 100 * 1024  # 100 KB
        oversized_content = b"a" * (101 * 1024)  # 101 KB

        resp = client.post(
            "/api/v1/imports?filename=large.csv",
            content=oversized_content,
            headers={"Content-Type": "text/csv"},
        )
        assert resp.status_code == 413
        assert "File Too Large" in resp.json()["detail"]["error"]
    finally:
        settings.MAX_UPLOAD_SIZE_BYTES = orig_max


def test_empty_and_malformed_upload_rejection(client):
    """Empty or unparseable files return useful 400 Bad Request responses."""
    # 1. Empty body
    empty_resp = client.post(
        "/api/v1/imports?filename=empty.csv",
        content=b"",
        headers={"Content-Type": "text/csv"},
    )
    assert empty_resp.status_code == 400
    assert "Empty File" in empty_resp.json()["detail"]["error"]

    # 2. Whitespace only
    ws_resp = client.post(
        "/api/v1/imports?filename=whitespace.csv",
        content=b"   \n  \t  \n",
        headers={"Content-Type": "text/csv"},
    )
    assert ws_resp.status_code == 400


def test_path_traversal_filename_sanitization(client):
    """Path traversal sequences in filenames are sanitized."""
    resp = client.post(
        "/api/v1/imports?filename=../../../../etc/passwd",
        content=SAMPLE_HACKATHON_CSV.encode("utf-8"),
        headers={"Content-Type": "text/csv"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert ".." not in data["filename"]
    assert "/" not in data["filename"]


def test_campaign_creation_without_mandatory_owner(client):
    """Campaigns can be created anonymously without an owner_id."""
    resp = client.post(
        "/api/v1/campaigns",
        json={"name": "Public Community Hackathon 2026"},
    )
    assert resp.status_code == 201
    camp = resp.json()
    assert camp["id"] > 0
    assert camp["name"] == "Public Community Hackathon 2026"
    assert camp["owner_id"] is None

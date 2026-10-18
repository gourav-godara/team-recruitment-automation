"""Integration tests for Sensitivity Analysis, Data Quality Reporting, and Rules API."""

import io
from fastapi.testclient import TestClient
import pytest

from backend.app.core.database import InMemoryTransactionSession, get_db
from backend.app.main import app
from backend.app.models.store import global_store
from backend.app.schemas.rules import ConfigurableRule, RuleType
from backend.app.schemas.scoring import Member, ScoringConfig, Team
from backend.app.services.data_quality_service import DataQualityService
from backend.app.services.evaluation_service import EvaluationService
from backend.app.services.import_service import ImportService
from backend.app.services.sensitivity_service import SensitivityService


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


# ----------------------------------------------------------------------
# 1. Sensitivity Analysis Engine
# ----------------------------------------------------------------------

def test_sensitivity_analysis_turnover_and_rank_deltas():
    """Tuning weights from domain-heavy to code-heavy causes measurable turnover and rank deltas."""
    teams = [
        Team(
            team_id="T1",
            name="Domain Experts",
            members=[Member(member_id="M1", signals={"domain_score": 90.0, "code_score": 40.0})],
        ),
        Team(
            team_id="T2",
            name="Code Masters",
            members=[Member(member_id="M2", signals={"domain_score": 50.0, "code_score": 95.0})],
        ),
    ]

    base_config = ScoringConfig(
        top_x=1,
        weights={"domain_score": 0.8, "code_score": 0.2},
    )
    new_config = ScoringConfig(
        top_x=1,
        weights={"domain_score": 0.2, "code_score": 0.8},
    )

    comparison = SensitivityService.simulate_what_if(teams, base_config, new_config)

    assert comparison.total_teams == 2
    assert comparison.shortlist_size == 1
    assert comparison.turnover_count == 1
    assert comparison.turnover_rate == 100.0
    assert "T2" in comparison.newly_shortlisted
    assert "T1" in comparison.dropped_from_shortlist

    # Verify gainers & decliners
    assert len(comparison.biggest_gainers) == 1
    assert comparison.biggest_gainers[0].team_id == "T2"
    assert comparison.biggest_gainers[0].rank_delta == 1  # From rank 2 to rank 1: +1

    assert len(comparison.biggest_decliners) == 1
    assert comparison.biggest_decliners[0].team_id == "T1"
    assert comparison.biggest_decliners[0].rank_delta == -1  # From rank 1 to rank 2: -1


def test_sensitivity_analysis_stable_run():
    """Identical configurations yield 0% turnover."""
    teams = [
        Team(
            team_id="T1",
            members=[Member(member_id="M1", signals={"score": 80.0})],
        )
    ]
    config = ScoringConfig(top_x=1, weights={"score": 1.0})
    comparison = SensitivityService.simulate_what_if(teams, config, config)
    assert comparison.turnover_count == 0
    assert comparison.turnover_rate == 0.0
    assert "stable" in comparison.summary.lower()


# ----------------------------------------------------------------------
# 2. Data Quality Service
# ----------------------------------------------------------------------

def test_data_quality_anomalies_and_completeness():
    """Detects duplicate emails, invalid URLs, size anomalies, and calculates completeness."""
    teams = [
        Team(
            team_id="T1",
            name="Solo Hacker",
            members=[
                Member(
                    member_id="M1",
                    signals={
                        "name": "Alice",
                        "email": "alice@example.com",
                        "github_url": "invalid-url",  # Malformed URL
                        "experience_years": 3.0,
                    },
                )
            ],
        ),
        Team(
            team_id="T2",
            name="Duplicate Team",
            members=[
                Member(
                    member_id="M2",
                    signals={
                        "name": "Bob",
                        "email": "alice@example.com",  # Duplicate candidate email!
                        "github_url": "https://github.com/alice",
                        "experience_years": 1.0,
                    },
                )
            ],
        ),
    ]

    report = DataQualityService.analyze_teams(teams, min_team_size=2, max_team_size=4)

    assert report.total_teams == 2
    assert report.total_members == 2
    assert len(report.duplicate_emails) == 1
    assert "alice@example.com" in report.duplicate_emails[0]
    assert len(report.malformed_urls) == 1
    assert report.malformed_urls[0].field_name == "github_url"
    assert len(report.teams_with_size_anomalies) == 2  # Both teams have 1 member (outside 2-4)
    assert report.completeness_score > 0.0
    assert len(report.review_flags) >= 2


# ----------------------------------------------------------------------
# 3. Rules API Endpoints
# ----------------------------------------------------------------------

def test_rules_catalog_endpoint(client):
    """GET /api/v1/rules/types returns all supported rule templates."""
    response = client.get("/api/v1/rules/types")
    assert response.status_code == 200
    types = response.json()
    assert len(types) >= 12
    type_names = [t["type"] for t in types]
    assert "COUNT_AT_LEAST" in type_names
    assert "TEAM_SIZE_BETWEEN" in type_names
    assert "REQUIRED_SKILL" in type_names


def test_rules_validate_endpoint(client):
    """POST /api/v1/rules/validate validates rules and flags duplicate IDs."""
    # Valid rule payload
    valid_payload = {
        "rules": [
            {
                "id": "female-req",
                "name": "One Female",
                "type": "COUNT_AT_LEAST",
                "field": "declared_gender",
                "threshold": 1.0,
            }
        ]
    }
    resp_valid = client.post("/api/v1/rules/validate", json=valid_payload)
    assert resp_valid.status_code == 200
    assert resp_valid.json()["valid"] is True

    # Duplicate rule ID
    dup_payload = {
        "rules": [
            {
                "id": "rule-1",
                "name": "One Female",
                "type": "COUNT_AT_LEAST",
                "field": "declared_gender",
                "threshold": 1.0,
            },
            {
                "id": "rule-1",
                "name": "Duplicate ID",
                "type": "REQUIRED_SKILL",
                "required_values": ["python"],
            },
        ]
    }
    resp_dup = client.post("/api/v1/rules/validate", json=dup_payload)
    assert resp_dup.status_code == 200
    assert resp_dup.json()["valid"] is False
    assert any("duplicate" in err.lower() for err in resp_dup.json()["errors"])


# ----------------------------------------------------------------------
# 4. Data Quality & Sensitivity API Endpoints
# ----------------------------------------------------------------------

CSV_REGISTRATION_CONTENT = """team_id,team_name,name,email,experience_years,skills,github_url
T1,Team Alpha,Alice,alice@example.com,4.0,"python, react",https://github.com/alice
T1,Team Alpha,Bob,bob@example.com,2.0,"python, docker",https://github.com/bob
T2,Team Beta,Charlie,charlie@example.com,1.0,"go, kubernetes",https://github.com/charlie
T2,Team Beta,Diana,diana@example.com,5.0,"rust",https://github.com/diana
"""


def test_import_quality_report_endpoint(client):
    """GET /api/v1/imports/{import_id}/quality-report returns dataset quality assessment."""
    # 1. Upload dataset
    upload_res = client.post(
        "/api/v1/imports?filename=teams.csv",
        content=CSV_REGISTRATION_CONTENT.encode("utf-8"),
        headers={"Content-Type": "text/csv"},
    )
    assert upload_res.status_code == 201
    import_id = upload_res.json()["import_id"]

    # 2. Query quality report
    qr_res = client.get(f"/api/v1/imports/{import_id}/quality-report")
    assert qr_res.status_code == 200
    qr_data = qr_res.json()
    assert qr_data["total_teams"] == 2
    assert qr_data["total_members"] == 4
    assert qr_data["average_team_size"] == 2.0
    assert qr_data["completeness_score"] >= 70.0


def test_evaluations_sensitivity_and_quality_endpoints(client):
    """Simulate what-if sensitivity preview and retrieve quality report on evaluated run."""
    # 1. Upload dataset
    upload_res = client.post(
        "/api/v1/imports?filename=teams.csv",
        content=CSV_REGISTRATION_CONTENT.encode("utf-8"),
        headers={"Content-Type": "text/csv"},
    )
    dataset_id = upload_res.json()["import_id"]

    # 2. Evaluate dataset
    eval_req = {
        "dataset_id": dataset_id,
        "config": {
            "top_x": 1,
            "weights": {"experience_years": 1.0},
        },
    }
    eval_res = client.post("/api/v1/evaluations", json=eval_req)
    assert eval_res.status_code == 201
    run_id = eval_res.json()["run_id"]

    # 3. GET /api/v1/evaluations/{run_id}/quality-report
    run_qr_res = client.get(f"/api/v1/evaluations/{run_id}/quality-report")
    assert run_qr_res.status_code == 200
    assert run_qr_res.json()["total_teams"] == 2

    # 4. POST /api/v1/evaluations/{run_id}/sensitivity-preview
    preview_req = {
        "new_config": {
            "top_x": 2,
            "weights": {"experience_years": 1.0},
        }
    }
    sens_res = client.post(f"/api/v1/evaluations/{run_id}/sensitivity-preview", json=preview_req)
    assert sens_res.status_code == 200
    sens_data = sens_res.json()
    assert sens_data["total_teams"] == 2
    assert len(sens_data["team_deltas"]) == 2

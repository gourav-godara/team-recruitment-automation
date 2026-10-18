"""Tests verifying Reviewer Overrides and Audit Trail workflows.

Tests:
- Manual reviewer override actions ('pin', 'exclude', 'waitlist')
- Automatic update of 'run_results' outcomes and reasons
- Recalculation of 'teams_shortlisted' on 'runs'
- Audit trail event logging in 'audit_log'
- REST API endpoints for overrides and audit trail
- Robust error handling for invalid actions and non-existent records
"""

import uuid
from fastapi.testclient import TestClient
import pytest

from backend.app.core.database import InMemoryTransactionSession, get_db
from backend.app.main import app
from backend.app.models.entities import (
    AuditLog,
    Dataset,
    Override,
    Run,
    RunResult,
    Team,
)
from backend.app.models.store import global_store
from backend.app.schemas.scoring import ScoringConfig
from backend.app.services.evaluation_service import EvaluationService
from backend.app.services.import_repository import ImportRepository
from backend.app.services.import_service import ImportService
from backend.app.services.override_service import OverrideService


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
    yield TestClient(app)
    app.dependency_overrides.clear()


SAMPLE_CSV = """team_id,team_name,name,email,experience_years
T10,Alpha Coders,Alice,alice@example.com,5.0
T20,Beta Builders,Bob,bob@example.com,1.0
T30,Gamma Geeks,Charlie,charlie@example.com,2.0
"""


def setup_sample_evaluation(session):
    service = ImportService()
    res = service.process_file_content(SAMPLE_CSV, filename="overrides_test.csv")
    ds = ImportRepository.save_import_result(session, res, filename="overrides_test.csv")
    session.commit()

    teams = ImportRepository.get_dataset_teams(session, ds.id)
    config = ScoringConfig(top_x=1, weights={"experience_years": 1.0})

    eval_resp = EvaluationService.evaluate_and_persist(session, teams, config, dataset_id=ds.id)
    session.commit()
    return ds, eval_resp.run_id


def test_override_service_pin_action():
    session = InMemoryTransactionSession()
    ds, run_id = setup_sample_evaluation(session)

    # T20 was not shortlisted initially because top_x=1 and T10 had highest score
    initial_t20 = session.query(RunResult).filter_by(run_id=int(run_id), team_id=2).first()
    assert initial_t20.outcome != "shortlisted"

    # Recruiter pins T20
    reviewer_id = uuid.uuid4()
    res = OverrideService.apply_override(
        db=session,
        run_id=run_id,
        team_id_or_code="T20",
        action="pin",
        reason="Demonstrated outstanding leadership during panel Q&A",
        user_id=reviewer_id,
    )
    session.commit()

    assert res["action"] == "pin"
    assert res["outcome"] == "shortlisted"
    assert res["created_by"] == str(reviewer_id)

    # Verify run_results is updated
    updated_t20 = session.query(RunResult).filter_by(run_id=int(run_id), team_id=2).first()
    assert updated_t20.outcome == "shortlisted"
    assert "Manual override (PIN)" in updated_t20.reason

    # Verify audit_log entry
    logs = session.query(AuditLog).filter_by(table_name="overrides").all()
    assert len(logs) == 1
    assert logs[0].action == "insert"
    assert logs[0].new_values["action"] == "pin"


def test_override_service_exclude_and_waitlist_actions():
    session = InMemoryTransactionSession()
    ds, run_id = setup_sample_evaluation(session)

    # Exclude T10 (which was top ranked)
    res_exclude = OverrideService.apply_override(
        db=session,
        run_id=run_id,
        team_id_or_code="T10",
        action="exclude",
        reason="Disqualified due to plagiarism in submission",
    )
    session.commit()
    assert res_exclude["outcome"] == "excluded"

    t10_result = session.query(RunResult).filter_by(run_id=int(run_id), team_id=1).first()
    assert t10_result.outcome == "excluded"
    assert t10_result.is_eligible is False

    # Waitlist T30
    res_waitlist = OverrideService.apply_override(
        db=session,
        run_id=run_id,
        team_id_or_code="T30",
        action="waitlist",
        reason="Hold for second round confirmation",
    )
    session.commit()
    assert res_waitlist["outcome"] == "waitlisted"

    t30_result = session.query(RunResult).filter_by(run_id=int(run_id), team_id=3).first()
    assert t30_result.outcome == "waitlisted"


def test_override_service_update_existing_override():
    session = InMemoryTransactionSession()
    ds, run_id = setup_sample_evaluation(session)

    # First apply waitlist
    OverrideService.apply_override(
        db=session,
        run_id=run_id,
        team_id_or_code="T30",
        action="waitlist",
        reason="First impression waitlist",
    )
    session.commit()

    # Then change mind to pin
    res_update = OverrideService.apply_override(
        db=session,
        run_id=run_id,
        team_id_or_code="T30",
        action="pin",
        reason="Re-evaluated by lead judge and approved for shortlist",
    )
    session.commit()

    assert res_update["action"] == "pin"
    assert res_update["outcome"] == "shortlisted"

    # Only 1 override record exists for (run_id, team_id)
    overrides = session.query(Override).filter_by(run_id=int(run_id), team_id=3).all()
    assert len(overrides) == 1
    assert overrides[0].action == "pin"

    # Audit trail shows both insert and update for overrides
    trail = OverrideService.get_run_audit_trail(session, run_id)
    override_trail = [t for t in trail if t["table_name"] == "overrides"]
    assert len(override_trail) == 2
    assert override_trail[0]["action"] == "insert"
    assert override_trail[1]["action"] == "update"
    assert override_trail[1]["old_values"]["action"] == "waitlist"
    assert override_trail[1]["new_values"]["action"] == "pin"


def test_overrides_api_endpoints(client):
    # 1. Upload CSV
    up_resp = client.post(
        "/api/v1/imports?filename=recruitment_data.csv",
        content=SAMPLE_CSV,
        headers={"content-type": "text/csv"},
    )
    assert up_resp.status_code == 201
    dataset_id = up_resp.json()["import_id"]

    # 2. Evaluate dataset
    eval_resp = client.post(
        "/api/v1/evaluations",
        json={
            "dataset_id": dataset_id,
            "config": {"top_x": 1, "weights": {"experience_years": 1.0}},
        },
    )
    assert eval_resp.status_code == 201
    run_id = eval_resp.json()["run_id"]

    # 3. Apply override via POST /api/v1/evaluations/{run_id}/overrides
    ov_resp = client.post(
        f"/api/v1/evaluations/{run_id}/overrides",
        json={
            "team_id": "T20",
            "action": "pin",
            "reason": "Exceptional live demonstration",
        },
    )
    assert ov_resp.status_code == 200
    ov_data = ov_resp.json()
    assert ov_data["action"] == "pin"
    assert ov_data["outcome"] == "shortlisted"
    assert ov_data["team_code"] == "T20"

    # 4. List overrides via GET /api/v1/evaluations/{run_id}/overrides
    list_resp = client.get(f"/api/v1/evaluations/{run_id}/overrides")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["team_code"] == "T20"

    # 5. Check audit trail via GET /api/v1/evaluations/{run_id}/audit-trail
    audit_resp = client.get(f"/api/v1/evaluations/{run_id}/audit-trail")
    assert audit_resp.status_code == 200
    assert len(audit_resp.json()) >= 2
    table_names = [e["table_name"] for e in audit_resp.json()]
    assert "runs" in table_names
    assert "overrides" in table_names

    # 6. Verify leaderboard reflects updated outcome
    leaderboard_resp = client.get(f"/api/v1/evaluations/{run_id}/leaderboard")
    assert leaderboard_resp.status_code == 200
    t20_entry = next(e for e in leaderboard_resp.json() if e["team_code"] == "T20")
    assert t20_entry["outcome"] == "shortlisted"
    assert "Manual override (PIN)" in t20_entry["explanation"]


def test_override_api_validation_and_errors(client):
    # Invalid action
    resp = client.post(
        "/api/v1/evaluations/1/overrides",
        json={
            "team_id": "T1",
            "action": "invalid_action",
            "reason": "Test",
        },
    )
    assert resp.status_code == 422

    # Reason too short (<3 chars)
    resp = client.post(
        "/api/v1/evaluations/1/overrides",
        json={
            "team_id": "T1",
            "action": "pin",
            "reason": "ab",
        },
    )
    assert resp.status_code == 422

    # Non-existent run
    resp = client.post(
        "/api/v1/evaluations/999999/overrides",
        json={
            "team_id": "T1",
            "action": "pin",
            "reason": "Valid reason",
        },
    )
    assert resp.status_code == 400

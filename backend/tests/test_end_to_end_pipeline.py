"""Comprehensive integration tests covering the complete end-to-end recruitment pipeline:

CSV/JSON Upload -> Parse & Normalize -> Validate -> Persist Dataset, Teams, Members, Signals ->
Scoring Config -> Decision Engine -> Persist Run, Results, Details, Rules -> Retrieve Run -> Export CSV
"""

import io
from fastapi.testclient import TestClient
import pytest

from backend.app.core.database import InMemoryTransactionSession, get_db
from backend.app.main import app
from backend.app.models.entities import (
    AuditLog,
    Criterion,
    DataFlag,
    Dataset,
    Member,
    MemberSignal,
    Run,
    RunResult,
    RunRuleResult,
    RunScoreDetail,
    Team,
)
from backend.app.models.store import global_store
from backend.app.schemas.scoring import (
    AggregationType,
    MissingDataPolicy,
    RuleConfig,
    RuleOperator,
    RuleScope,
    ScoringConfig,
)
from backend.app.services.config_service import ConfigService
from backend.app.services.evaluation_service import EvaluationService
from backend.app.services.export_service import ExportService
from backend.app.services.import_repository import ImportRepository
from backend.app.services.import_service import ImportService
from schemas.config import ImportConfig


@pytest.fixture(autouse=True)
def clean_store():
    """Ensure global store is clean before and after each test."""
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


SAMPLE_CSV = """team_id,team_name,name,email,experience_years,skills,github_url
T1,Binary Bosses,Alice,alice@example.com,4.5,"python, react",https://github.com/alice
T1,Binary Bosses,Bob,bob@example.com,0.0,"python, docker",https://github.com/bob
T2,Solo Hackers,Charlie,charlie@example.com,2.0,javascript,https://github.com/charlie
T3,Code Ninjas,Diana,diana@example.com,1.0,go,https://github.com/diana
T3,Code Ninjas,Evan,evan@example.com,3.0,"python, kubernetes",https://github.com/evan
"""

SAMPLE_JSON = """[
  {
    "team_id": "J1",
    "team_name": "JSON Giants",
    "members": [
      {
        "name": "Fiona",
        "email": "fiona@example.com",
        "experience_years": 5.0,
        "skills": ["rust", "systems"]
      }
    ]
  }
]"""


def test_import_service_csv_parsing_and_zero_preservation():
    service = ImportService()
    result = service.process_file_content(SAMPLE_CSV, filename="teams.csv")

    assert result.total_teams == 3
    assert result.valid_teams_count == 3
    assert result.invalid_teams_count == 0

    # Verify zero-valued numeric experience is preserved distinct from None
    t1 = next(t for t in result.teams if t.id == "T1")
    assert t1.team_size == 2
    bob = next(m for m in t1.members if m.name == "Bob")
    assert bob.experience_years == 0.0

    # Verify solo team
    t2 = next(t for t in result.teams if t.id == "T2")
    assert t2.team_size == 1


def test_import_service_empty_and_malformed():
    service = ImportService()

    # Empty
    empty_res = service.process_file_content("", filename="empty.csv")
    assert empty_res.total_teams == 0
    assert len(empty_res.global_warnings) > 0

    # Malformed JSON
    bad_json_res = service.process_file_content("{ unquoted_key: 123", filename="bad.json")
    assert bad_json_res.total_teams == 0
    assert len(bad_json_res.global_errors) > 0


def test_import_persistence_and_retrieval():
    session = InMemoryTransactionSession()
    service = ImportService()
    import_result = service.process_file_content(SAMPLE_CSV, filename="teams.csv")

    dataset = ImportRepository.save_import_result(
        db=session,
        import_result=import_result,
        filename="teams.csv",
        file_format="csv",
        campaign_id=1,
    )
    session.commit()

    # Verify integer primary key
    assert isinstance(dataset.id, int) and dataset.id > 0
    assert dataset.file_hash is not None
    assert dataset.total_teams == 3
    assert dataset.campaign_id == 1

    # Retrieve dataset by integer ID
    retrieved = ImportRepository.get_dataset_by_id(session, dataset.id)
    assert retrieved is not None
    assert retrieved.id == dataset.id
    assert retrieved.total_teams == 3

    # Retrieve teams and members
    teams = ImportRepository.get_dataset_teams(session, dataset.id)
    assert len(teams) == 3
    t1 = next(t for t in teams if t.id == "T1")
    assert t1.team_size == 2
    bob = next(m for m in t1.members if m.name == "Bob")
    assert bob.experience_years == 0.0

    # Check member signals were persisted
    signals = session.query(MemberSignal).all()
    assert len(signals) > 0
    exp_signals = [s for s in signals if s.criterion_key == "experience_years"]
    assert any(s.value_num == 4.5 and s.status == "ok" for s in exp_signals)
    assert any(s.value_num == 0.0 and s.status == "ok" for s in exp_signals)

    # Check audit log entry
    audits = session.query(AuditLog).filter_by(table_name="datasets").all()
    assert len(audits) >= 1
    assert audits[0].record_id == dataset.id


def test_scoring_config_service():
    session = InMemoryTransactionSession()
    config = ScoringConfig(
        top_x=2,
        weights={"experience_years": 1.0},
        missing_policy=MissingDataPolicy.IGNORE,
    )

    saved_model = ConfigService.save_config(session, config, name="Test Config")
    session.commit()

    # Verify integer primary key and config_hash
    assert isinstance(saved_model.id, int) and saved_model.id > 0
    assert saved_model.config_hash is not None

    # Retrieve config by integer ID
    retrieved_cfg = ConfigService.get_config_by_id(session, saved_model.id)
    assert retrieved_cfg is not None
    assert retrieved_cfg.top_x == 2
    assert retrieved_cfg.weights == {"experience_years": 1.0}


def test_evaluation_service_persistence_and_retrieval():
    session = InMemoryTransactionSession()
    service = ImportService()
    import_result = service.process_file_content(SAMPLE_CSV, filename="teams.csv")

    dataset = ImportRepository.save_import_result(
        db=session,
        import_result=import_result,
        filename="teams.csv",
    )
    session.commit()

    teams = ImportRepository.get_dataset_teams(session, dataset.id)

    config = ScoringConfig(
        top_x=1,
        weights={"experience_years": 1.0},
        missing_policy=MissingDataPolicy.IGNORE,
    )

    eval_response = EvaluationService.evaluate_and_persist(
        db=session,
        teams=teams,
        config=config,
        dataset_id=dataset.id,
    )
    session.commit()

    # Verify integer run_id as string
    assert str(eval_response.run_id).isdigit() and int(eval_response.run_id) > 0
    assert eval_response.total_teams == 3
    assert eval_response.shortlisted_teams == 1

    # Verify run record in 'runs'
    run_records = session.query(Run).all()
    assert len(run_records) == 1
    assert run_records[0].dataset_id == dataset.id
    assert run_records[0].top_x == 1

    # Verify run_results
    run_results = session.query(RunResult).filter_by(run_id=int(eval_response.run_id)).all()
    assert len(run_results) == 3
    shortlisted = [rr for rr in run_results if rr.outcome == "shortlisted"]
    assert len(shortlisted) == 1

    # Verify run_score_details
    score_details = session.query(RunScoreDetail).filter_by(run_id=int(eval_response.run_id)).all()
    assert len(score_details) >= 3

    # Retrieve saved evaluation without re-evaluating
    saved_eval = EvaluationService.get_saved_evaluation(session, eval_response.run_id)
    assert saved_eval is not None
    assert saved_eval.run_id == eval_response.run_id
    assert saved_eval.config_hash == eval_response.config_hash
    assert saved_eval.dataset_hash == eval_response.dataset_hash
    assert saved_eval.total_teams == 3
    assert saved_eval.shortlisted_teams == 1

    # Verify team rank and status are preserved exactly
    top_team = saved_eval.results[0]
    assert top_team.rank == 1
    assert top_team.status == "SHORTLISTED"
    assert top_team.score is not None


def test_csv_export_service():
    session = InMemoryTransactionSession()
    service = ImportService()
    import_result = service.process_file_content(SAMPLE_CSV, filename="teams.csv")

    dataset = ImportRepository.save_import_result(db=session, import_result=import_result)
    session.commit()

    teams = ImportRepository.get_dataset_teams(session, dataset.id)
    config = ScoringConfig(
        top_x=2,
        weights={"experience_years": 1.0},
    )

    eval_response = EvaluationService.evaluate_and_persist(
        db=session,
        teams=teams,
        config=config,
        dataset_id=dataset.id,
    )
    session.commit()

    # Generate CSV
    csv_text = ExportService.export_evaluation_run_to_csv(session, eval_response.run_id)
    assert csv_text is not None

    lines = csv_text.strip().splitlines()
    assert len(lines) >= 4  # Header + 3 teams
    header = lines[0]
    assert "Rank" in header
    assert "Team ID" in header
    assert "Final Score" in header
    assert "Shortlisted" in header

    # Non-existent run export
    bad_export = ExportService.export_evaluation_run_to_csv(session, "999999")
    assert bad_export is None


def test_api_full_workflow(client):
    # 1. Health check
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "ok"

    # 2. Upload CSV via POST /api/v1/imports
    upload_resp = client.post(
        "/api/v1/imports?filename=hackathon_teams.csv",
        content=SAMPLE_CSV,
        headers={"content-type": "text/csv"},
    )
    assert upload_resp.status_code == 201
    upload_data = upload_resp.json()
    assert upload_data["status"] == "success"
    assert upload_data["total_teams"] == 3
    import_id = upload_data["import_id"]
    assert import_id is not None
    assert isinstance(import_id, int)

    # 3. Retrieve imported dataset via GET /api/v1/imports/{import_id}
    get_import_resp = client.get(f"/api/v1/imports/{import_id}")
    assert get_import_resp.status_code == 200
    get_import_data = get_import_resp.json()
    assert get_import_data["import_id"] == import_id
    assert len(get_import_data["teams"]) == 3

    # 4. Evaluate dataset via POST /api/v1/evaluations
    eval_payload = {
        "dataset_id": import_id,
        "config": {
            "top_x": 2,
            "weights": {"experience_years": 1.0},
            "missing_policy": "IGNORE",
        },
    }
    eval_resp = client.post("/api/v1/evaluations", json=eval_payload)
    assert eval_resp.status_code == 201
    eval_data = eval_resp.json()
    run_id = eval_data["run_id"]
    assert run_id is not None
    assert eval_data["total_teams"] == 3
    assert eval_data["shortlisted_teams"] == 2
    assert len(eval_data["results"]) == 3

    # 5. Retrieve saved evaluation via GET /api/v1/evaluations/{run_id}
    get_eval_resp = client.get(f"/api/v1/evaluations/{run_id}")
    assert get_eval_resp.status_code == 200
    saved_eval_data = get_eval_resp.json()
    assert saved_eval_data["run_id"] == run_id
    assert saved_eval_data["config_hash"] == eval_data["config_hash"]
    assert saved_eval_data["dataset_hash"] == eval_data["dataset_hash"]

    # 6. Export evaluation CSV via GET /api/v1/evaluations/{run_id}/export
    export_resp = client.get(f"/api/v1/evaluations/{run_id}/export")
    assert export_resp.status_code == 200
    assert export_resp.headers["content-type"].startswith("text/csv")
    assert "Rank" in export_resp.text
    assert "Binary Bosses" in export_resp.text

    # 7. Also verify alternate export route GET /api/v1/exports/evaluations/{run_id}
    alt_export_resp = client.get(f"/api/v1/exports/evaluations/{run_id}")
    assert alt_export_resp.status_code == 200
    assert alt_export_resp.text == export_resp.text

    # 8. Retrieve real-time leaderboard via GET /api/v1/evaluations/{run_id}/leaderboard
    leaderboard_resp = client.get(f"/api/v1/evaluations/{run_id}/leaderboard")
    assert leaderboard_resp.status_code == 200
    leaderboard_data = leaderboard_resp.json()
    assert len(leaderboard_data) == 3
    assert leaderboard_data[0]["rank"] == 1
    assert leaderboard_data[0]["team_name"] == "Binary Bosses"
    assert leaderboard_data[0]["dataset_name"] == "hackathon_teams.csv"


def test_api_structured_error_handling(client):
    # 1. Empty upload
    resp = client.post("/api/v1/imports", content="")
    assert resp.status_code == 400
    assert "Empty File" in resp.json()["detail"]["error"]

    # 2. Malformed JSON
    resp = client.post(
        "/api/v1/imports?filename=broken.json",
        content="{ bad_json: true",
        headers={"content-type": "application/json"},
    )
    assert resp.status_code == 400
    assert "Import Parsing Failed" in resp.json()["detail"]["error"]

    # 3. Not found import ID
    resp = client.get("/api/v1/imports/999999")
    assert resp.status_code == 404
    assert "Dataset Not Found" in resp.json()["detail"]["error"]

    # 4. Evaluate non-existent dataset
    resp = client.post(
        "/api/v1/evaluations",
        json={
            "dataset_id": 999999,
            "config": {"weights": {"field": 1.0}},
        },
    )
    assert resp.status_code == 404

    # 5. Invalid weights in evaluation config
    resp = client.post(
        "/api/v1/evaluations",
        json={
            "dataset_id": 1,
            "config": {"weights": {"field": 0.5}},  # Does not sum to 1.0
        },
    )
    assert resp.status_code == 422 or resp.status_code == 400

    # 6. Non-existent evaluation retrieval
    resp = client.get("/api/v1/evaluations/999999")
    assert resp.status_code == 404

    # 7. Non-existent evaluation export
    resp = client.get("/api/v1/evaluations/999999/export")
    assert resp.status_code == 404

    # 8. Non-existent evaluation leaderboard
    resp = client.get("/api/v1/evaluations/999999/leaderboard")
    assert resp.status_code == 404


def test_transaction_rollback_on_failure():
    """Verify that if an error occurs during persistence, rollback leaves no orphaned records."""
    session = InMemoryTransactionSession()

    class FailingEntity:
        def __init__(self):
            self.id = 999

    session.add(FailingEntity())
    # Rollback before commit
    session.rollback()

    # Verify nothing was committed to global_store
    assert global_store.query(FailingEntity).count() == 0

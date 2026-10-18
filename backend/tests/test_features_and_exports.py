"""Tests for new export endpoints, pairwise comparison, blind review, and strategy presets."""

import json
import zipfile
import io
import pytest
from fastapi.testclient import TestClient

from backend.app.core.database import InMemoryTransactionSession, get_db
from backend.app.main import app
from backend.app.models.store import global_store
from backend.app.schemas.scoring import MissingDataPolicy, ScoringConfig
from backend.app.services.comparison_service import ComparisonService
from backend.app.services.evaluation_service import EvaluationService
from backend.app.services.export_service import ExportService
from backend.app.services.import_repository import ImportRepository
from backend.app.services.import_service import ImportService


SAMPLE_CSV = """team_id,team_name,name,email,experience_years,skills,github_url
T1,Alpha Coders,Alice,alice@example.com,4.0,"python, react",https://github.com/alice
T1,Alpha Coders,Bob,bob@example.com,2.0,"python, docker",https://github.com/bob
T2,Solo Dev,Charlie,charlie@example.com,1.0,javascript,https://github.com/charlie
T3,Byte Warriors,Diana,diana@example.com,3.0,go,https://github.com/diana
T3,Byte Warriors,Evan,evan@example.com,5.0,"python, kubernetes",https://github.com/evan
"""


@pytest.fixture(autouse=True)
def clean_store():
    global_store.clear()
    yield
    global_store.clear()


@pytest.fixture
def client_and_session():
    session = InMemoryTransactionSession()

    def override_get_db():
        try:
            yield session
            session.commit()
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app), session
    finally:
        app.dependency_overrides.clear()


def test_strategy_presets_endpoint(client_and_session):
    client, _ = client_and_session
    resp = client.get("/api/v1/rules/presets")
    assert resp.status_code == 200
    presets = resp.json()
    assert len(presets) >= 4
    preset_ids = [p["id"] for p in presets]
    assert "balanced_hackathon" in preset_ids
    assert "dev_heavy" in preset_ids
    assert "diversity_inclusive" in preset_ids


def test_individual_and_bundle_exports(client_and_session):
    client, session = client_and_session

    # 1. Ingest CSV
    import_result = ImportService().process_file_content(SAMPLE_CSV, filename="teams.csv")
    dataset = ImportRepository.save_import_result(session, import_result, filename="teams.csv")
    session.commit()

    teams = ImportRepository.get_dataset_teams(session, dataset.id)

    # 2. Evaluate with Top X = 2
    config = ScoringConfig(
        top_x=2,
        weights={"experience_years": 1.0},
        missing_policy=MissingDataPolicy.IGNORE,
    )
    eval_resp = EvaluationService.evaluate_and_persist(session, teams, config, dataset.id)
    session.commit()
    run_id = eval_resp.run_id

    # 3. Test Shortlist CSV download
    resp_shortlist = client.get(f"/api/v1/evaluations/{run_id}/export/shortlist")
    assert resp_shortlist.status_code == 200
    assert "text/csv" in resp_shortlist.headers["content-type"]
    assert "shortlist_top_x" in resp_shortlist.headers["content-disposition"]
    csv_lines = resp_shortlist.text.strip().splitlines()
    assert len(csv_lines) == 3  # Header + 2 shortlisted teams

    # 4. Test Full Audit CSV download
    resp_audit = client.get(f"/api/v1/evaluations/{run_id}/export/audit")
    assert resp_audit.status_code == 200
    assert "text/csv" in resp_audit.headers["content-type"]
    assert "full_evaluation_audit" in resp_audit.headers["content-disposition"]
    audit_lines = resp_audit.text.strip().splitlines()
    assert len(audit_lines) == 4  # Header + 3 total teams

    # 5. Test Config Snapshot JSON download
    resp_config = client.get(f"/api/v1/evaluations/{run_id}/export/config")
    assert resp_config.status_code == 200
    assert "application/json" in resp_config.headers["content-type"]
    config_json = resp_config.json()
    assert config_json["run_id"] == run_id
    assert "dataset_hash" in config_json
    assert "config_hash" in config_json

    # 6. Test 1-Click ZIP Bundle download
    resp_bundle = client.get(f"/api/v1/evaluations/{run_id}/export/bundle")
    assert resp_bundle.status_code == 200
    assert "application/zip" in resp_bundle.headers["content-type"]

    # Verify ZIP contents
    zf = zipfile.ZipFile(io.BytesIO(resp_bundle.content))
    namelist = zf.namelist()
    assert any("shortlist_top_x" in name for name in namelist)
    assert any("full_evaluation_audit" in name for name in namelist)
    assert any("run_configuration_snapshot" in name for name in namelist)


def test_pairwise_comparison_endpoint(client_and_session):
    client, session = client_and_session

    import_result = ImportService().process_file_content(SAMPLE_CSV, filename="teams.csv")
    dataset = ImportRepository.save_import_result(session, import_result, filename="teams.csv")
    session.commit()

    teams = ImportRepository.get_dataset_teams(session, dataset.id)
    config = ScoringConfig(
        top_x=2,
        weights={"experience_years": 1.0},
        missing_policy=MissingDataPolicy.IGNORE,
    )
    eval_resp = EvaluationService.evaluate_and_persist(session, teams, config, dataset.id)
    session.commit()
    run_id = eval_resp.run_id

    # Compare Team T1 and Team T3
    resp_comp = client.get(f"/api/v1/evaluations/{run_id}/compare?team_a=T1&team_b=T3")
    assert resp_comp.status_code == 200
    comp = resp_comp.json()
    assert comp["team_a_id"] == "T1"
    assert comp["team_b_id"] == "T3"
    assert "overall_winner" in comp
    assert "criteria_comparison" in comp
    assert len(comp["criteria_comparison"]) >= 1
    assert "summary" in comp


def test_blind_anonymized_review_mode(client_and_session):
    client, session = client_and_session

    import_result = ImportService().process_file_content(SAMPLE_CSV, filename="teams.csv")
    dataset = ImportRepository.save_import_result(session, import_result, filename="teams.csv")
    session.commit()

    teams = ImportRepository.get_dataset_teams(session, dataset.id)
    config = ScoringConfig(top_x=2, weights={"experience_years": 1.0})
    eval_resp = EvaluationService.evaluate_and_persist(session, teams, config, dataset.id)
    session.commit()
    run_id = eval_resp.run_id

    # 1. Standard evaluation -> real team name present
    resp_standard = client.get(f"/api/v1/evaluations/{run_id}")
    assert resp_standard.status_code == 200
    data_std = resp_standard.json()
    assert any(r["name"] == "Alpha Coders" for r in data_std["results"])

    # 2. Anonymized evaluation -> names masked
    resp_anon = client.get(f"/api/v1/evaluations/{run_id}?anonymize=true")
    assert resp_anon.status_code == 200
    data_anon = resp_anon.json()
    for r in data_anon["results"]:
        assert r["name"].startswith("Team_")
        assert r["name"] != "Alpha Coders"

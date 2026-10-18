"""Tests verifying that models and services strictly adhere to Sushmita's Supabase PostgreSQL schema.

Covers:
- Table naming & column mappings
- Integer identity primary keys & UUID user references
- Signal status conversions (ok, missing, fetch_failed, low_confidence)
- Outcome & data_status CHECK constraints
- Explicit PostgreSQL failure handling without silent fallbacks
"""

import uuid
import pytest

from backend.app.core.database import (
    DatabaseConnectionError,
    InMemoryTransactionSession,
    get_db,
)
from backend.app.models.entities import (
    AuditLog,
    Campaign,
    Config,
    Criterion,
    DataFlag,
    Dataset,
    LeaderboardView,
    Member,
    MemberSignal,
    Override,
    PairwiseComparison,
    Run,
    RunResult,
    RunRuleResult,
    RunScoreDetail,
    Team,
)
from backend.app.models.store import global_store
from backend.app.schemas.scoring import RuleStatus, ScoringConfig, SignalState
from backend.app.services.config_service import ConfigService
from backend.app.services.evaluation_service import EvaluationService
from backend.app.services.import_repository import ImportRepository
from backend.app.services.import_service import ImportService


@pytest.fixture(autouse=True)
def clean_store():
    global_store.clear()
    yield
    global_store.clear()


def test_schema_table_names_and_classes():
    """Verify that entity models match Sushmita's exact PostgreSQL table names."""
    assert Campaign.__tablename__ == "campaigns"
    assert Dataset.__tablename__ == "datasets"
    assert Team.__tablename__ == "teams"
    assert Member.__tablename__ == "members"
    assert Criterion.__tablename__ == "criteria"
    assert MemberSignal.__tablename__ == "member_signals"
    assert Config.__tablename__ == "configs"
    assert Run.__tablename__ == "runs"
    assert RunResult.__tablename__ == "run_results"
    assert RunScoreDetail.__tablename__ == "run_score_details"
    assert RunRuleResult.__tablename__ == "run_rule_results"
    assert DataFlag.__tablename__ == "data_flags"
    assert Override.__tablename__ == "overrides"
    assert PairwiseComparison.__tablename__ == "pairwise_comparisons"
    assert AuditLog.__tablename__ == "audit_log"


def test_integer_identity_primary_keys():
    """Verify that auto-assigned primary keys are integers and not string UUIDs."""
    session = InMemoryTransactionSession()

    dataset = Dataset(name="Batch 1", source_format="csv")
    session.add(dataset)
    session.commit()

    assert isinstance(dataset.id, int)
    assert dataset.id > 0

    team = Team(dataset_id=dataset.id, external_id="T100", team_name="Code Ninjas")
    session.add(team)
    session.commit()

    assert isinstance(team.id, int)
    assert team.id > 0
    assert team.dataset_id == dataset.id
    assert team.external_id == "T100"


def test_uuid_user_references():
    """Verify that user ownership and audit references accept Supabase Auth UUIDs."""
    session = InMemoryTransactionSession()
    user_uuid = uuid.uuid4()

    camp = Campaign(owner_id=user_uuid, name="ACM Hackathon 2026")
    session.add(camp)
    session.commit()

    assert isinstance(camp.id, int)
    assert camp.owner_id == user_uuid

    audit = AuditLog(
        table_name="campaigns",
        record_id=camp.id,
        action="insert",
        changed_by=user_uuid,
    )
    session.add(audit)
    session.commit()

    assert isinstance(audit.id, int)
    assert audit.changed_by == user_uuid


def test_signal_status_conversion_semantics():
    """Verify that signal states convert faithfully into member_signals status values:

    'ok', 'missing', 'fetch_failed', 'low_confidence'
    """
    session = InMemoryTransactionSession()
    service = ImportService()

    csv_data = """team_id,team_name,name,email,experience_years,skills
T1,Signal Test,Eve,eve@example.com,0.0,"python, c++"
T1,Signal Test,Frank,frank@example.com,,
"""
    result = service.process_file_content(csv_data, filename="signals.csv")
    dataset = ImportRepository.save_import_result(session, result)
    session.commit()

    signals = session.query(MemberSignal).all()

    # Eve: 0.0 experience -> status must be 'ok', value_num must be 0.0 (NOT missing, NOT None)
    eve_signals = [s for s in signals if s.criterion_key == "experience_years" and s.value_num == 0.0]
    assert len(eve_signals) == 1
    assert eve_signals[0].status == "ok"
    assert eve_signals[0].value_num == 0.0

    # Frank: missing experience -> status must be 'missing'
    frank_signals = [s for s in signals if s.criterion_key == "experience_years" and s.value_num is None]
    assert len(frank_signals) == 1
    assert frank_signals[0].status == "missing"


def test_run_results_outcome_check_constraint():
    """Verify that run_results outcome conforms to PostgreSQL CHECK constraint."""
    allowed_outcomes = {"shortlisted", "waitlisted", "rejected", "ineligible", "excluded"}

    session = InMemoryTransactionSession()
    service = ImportService()
    csv_data = "team_id,team_name,name,email\nT1,Alpha,Alice,alice@example.com\n"
    res = service.process_file_content(csv_data)
    ds = ImportRepository.save_import_result(session, res)
    session.commit()

    teams = ImportRepository.get_dataset_teams(session, ds.id)
    config = ScoringConfig(weights={"fallback": 1.0})

    eval_resp = EvaluationService.evaluate_and_persist(session, teams, config, dataset_id=ds.id)
    session.commit()

    run_results = session.query(RunResult).filter_by(run_id=int(eval_resp.run_id)).all()
    assert len(run_results) == 1
    assert run_results[0].outcome in allowed_outcomes


def test_run_score_details_data_status_check_constraint():
    """Verify that run_score_details data_status conforms to PostgreSQL CHECK constraint."""
    allowed_data_statuses = {"ok", "partial", "missing"}

    session = InMemoryTransactionSession()
    service = ImportService()
    csv_data = "team_id,team_name,name,email,experience_years\nT1,Alpha,Alice,alice@example.com,3.0\n"
    res = service.process_file_content(csv_data)
    ds = ImportRepository.save_import_result(session, res)
    session.commit()

    teams = ImportRepository.get_dataset_teams(session, ds.id)
    config = ScoringConfig(weights={"experience_years": 1.0})

    eval_resp = EvaluationService.evaluate_and_persist(session, teams, config, dataset_id=ds.id)
    session.commit()

    score_details = session.query(RunScoreDetail).filter_by(run_id=int(eval_resp.run_id)).all()
    assert len(score_details) >= 1
    for sd in score_details:
        assert sd.data_status in allowed_data_statuses


def test_no_silent_fallback_when_postgres_fails(monkeypatch):
    """Verify that if PostgreSQL is configured via DATABASE_URL but unavailable,

    it raises DatabaseConnectionError instead of silently falling back to in-memory.
    """
    import backend.app.core.database as db_module

    # Temporarily simulate postgres configuration without available engine
    monkeypatch.setattr(db_module, "is_postgres_configured", True)
    monkeypatch.setattr(db_module, "HAS_SQLALCHEMY", False)

    with pytest.raises(DatabaseConnectionError) as exc_info:
        gen = db_module.get_db()
        next(gen)

    assert "PostgreSQL is configured" in str(exc_info.value)


def test_migration_002_cascading_foreign_keys_and_unique_constraints():
    """Verify that models contain cascading foreign keys and unique constraints specified in Migration 002."""
    from backend.app.core.database import HAS_SQLALCHEMY

    if HAS_SQLALCHEMY:
        # Check Run.dataset_id foreign key ondelete
        run_fks = Run.__table__.foreign_keys
        dataset_fk = next(fk for fk in run_fks if fk.column.table.name == "datasets")
        assert dataset_fk.ondelete == "CASCADE"

        # Check RunResult.team_id ondelete
        rr_fks = RunResult.__table__.foreign_keys
        team_fk = next(fk for fk in rr_fks if fk.column.table.name == "teams")
        assert team_fk.ondelete == "CASCADE"

        # Check Override.team_id ondelete
        ov_fks = Override.__table__.foreign_keys
        ov_team_fk = next(fk for fk in ov_fks if fk.column.table.name == "teams")
        assert ov_team_fk.ondelete == "CASCADE"

        # Check MemberSignal unique constraint
        ms_uq_names = {c.name for c in MemberSignal.__table__.constraints if hasattr(c, "columns")}
        assert "uq_member_criterion" in ms_uq_names

        # Check Override unique constraint
        ov_uq_names = {c.name for c in Override.__table__.constraints if hasattr(c, "columns")}
        assert "uq_run_team_override" in ov_uq_names

        # Check PairwiseComparison unique constraint
        pc_uq_names = {c.name for c in PairwiseComparison.__table__.constraints if hasattr(c, "columns")}
        assert "uq_run_pair_comparison" in pc_uq_names


def test_leaderboard_view_and_service():
    """Verify LeaderboardView mapping and EvaluationService.get_leaderboard()."""
    assert LeaderboardView.__tablename__ == "v_leaderboard"

    session = InMemoryTransactionSession()
    service = ImportService()
    csv_data = (
        "team_id,team_name,name,email,experience_years\n"
        "T1,Alpha Team,Alice,alice@example.com,5.0\n"
        "T2,Beta Team,Bob,bob@example.com,2.0\n"
    )
    res = service.process_file_content(csv_data, filename="leaderboard_test.csv")
    ds = ImportRepository.save_import_result(session, res, filename="leaderboard_test.csv")
    session.commit()

    teams = ImportRepository.get_dataset_teams(session, ds.id)
    config = ScoringConfig(weights={"experience_years": 1.0})

    eval_resp = EvaluationService.evaluate_and_persist(session, teams, config, dataset_id=ds.id)
    session.commit()

    leaderboard = EvaluationService.get_leaderboard(session, eval_resp.run_id)
    assert len(leaderboard) == 2
    assert leaderboard[0].rank == 1
    assert leaderboard[0].team_code == "T1"
    assert leaderboard[0].total_score > leaderboard[1].total_score
    assert leaderboard[0].dataset_name == "leaderboard_test.csv"


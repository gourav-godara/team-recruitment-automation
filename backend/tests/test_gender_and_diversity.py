"""Tests for gender detection, normalization, and diversity requirement evaluation."""

import pytest
from backend.data_processing.normalization.gender_detector import (
    detect_gender_from_name,
    normalize_gender,
)
from backend.app.schemas.scoring import (
    MissingDataPolicy,
    RuleConfig,
    RuleOperator,
    RuleScope,
    RuleStatus,
    ScoringConfig,
)
from backend.app.services.decision_engine import evaluate_teams_pipeline
from backend.app.services.import_adapter import adapt_team_data_list
from backend.app.services.import_service import ImportService
from backend.app.services.team_aggregation import evaluate_operator


def test_normalize_gender_values():
    assert normalize_gender("Female") == "female"
    assert normalize_gender("female") == "female"
    assert normalize_gender("FEMALE") == "female"
    assert normalize_gender("F") == "female"
    assert normalize_gender("f") == "female"
    assert normalize_gender("Woman") == "female"
    assert normalize_gender("girl") == "female"

    assert normalize_gender("Male") == "male"
    assert normalize_gender("male") == "male"
    assert normalize_gender("M") == "male"
    assert normalize_gender("Man") == "male"
    assert normalize_gender("boy") == "male"

    assert normalize_gender("Non-binary") == "non-binary"
    assert normalize_gender("Other") == "other"
    assert normalize_gender(None) is None
    assert normalize_gender("") is None


def test_detect_gender_from_name():
    # User's exact names from screenshot
    assert detect_gender_from_name("Riya Shah") == "female"
    assert detect_gender_from_name("Sana Patel") == "female"

    # Common South Asian female names
    assert detect_gender_from_name("Priya Patel") == "female"
    assert detect_gender_from_name("Neha Gupta") == "female"
    assert detect_gender_from_name("Kavya Reddy") == "female"
    assert detect_gender_from_name("Tanvi Shah") == "female"
    assert detect_gender_from_name("Ananya Joshi") == "female"
    assert detect_gender_from_name("Pooja Roy") == "female"

    # Western female names
    assert detect_gender_from_name("Alice Sharma") == "female"
    assert detect_gender_from_name("Carol Lee") == "female"
    assert detect_gender_from_name("Emma Watson") == "female"
    assert detect_gender_from_name("Sarah Chen") == "female"
    assert detect_gender_from_name("Elena Rostova") == "female"

    # Male names
    assert detect_gender_from_name("Bob Patel") == "male"
    assert detect_gender_from_name("David Kumar") == "male"
    assert detect_gender_from_name("Girish Verma") == "male"
    assert detect_gender_from_name("Aarav Sharma") == "male"
    assert detect_gender_from_name("Rohan Iyer") == "male"

    # Honorifics
    assert detect_gender_from_name("Ms. Alex") == "female"
    assert detect_gender_from_name("Mrs. Jordan") == "female"
    assert detect_gender_from_name("Mr. Taylor") == "male"
    assert detect_gender_from_name("Dr. Priya Patel") == "female"


def test_evaluate_operator_gender_synonyms():
    # Strict casing should not fail
    assert evaluate_operator("Female", RuleOperator.EQ, "female") is True
    assert evaluate_operator("female", RuleOperator.EQ, "Female") is True
    assert evaluate_operator("F", RuleOperator.EQ, "female") is True
    assert evaluate_operator("girl", RuleOperator.EQ, "female") is True
    assert evaluate_operator("woman", RuleOperator.EQ, "female") is True

    assert evaluate_operator("Male", RuleOperator.EQ, "male") is True
    assert evaluate_operator("M", RuleOperator.EQ, "male") is True

    # Cross gender mismatch
    assert evaluate_operator("male", RuleOperator.EQ, "female") is False
    assert evaluate_operator("female", RuleOperator.EQ, "male") is False


def test_diversity_rule_with_capital_gender_column():
    csv_text = """team_id,team_name,name,email,Gender,role,skills,experience_years
T1,Binary Bosses,Alice Sharma,alice@example.com,Female,Lead,Python,3.5
T1,Binary Bosses,Bob Patel,bob@example.com,Male,Dev,React,2.0
T2,All Boys,John Doe,john@example.com,Male,Lead,Go,3.0
T2,All Boys,Bob Smith,bob@example.com,Male,Dev,Java,2.0
"""
    import_svc = ImportService()
    res = import_svc.process_file_content(csv_text, filename="test.csv")
    engine_teams = adapt_team_data_list(res.teams)

    config = ScoringConfig(
        top_x=5,
        weights={"experience": 0.3, "github": 0.3, "skills": 0.25, "presentation": 0.15},
        eligibility_rules=[
            RuleConfig(
                name="Diversity Requirement (Min 1 Female)",
                scope=RuleScope.MEMBER,
                field="declared_gender",
                operator=RuleOperator.EQ,
                value="female",
                aggregation="ANY",
                missing_policy=MissingDataPolicy.REQUIRE,
            )
        ],
    )
    eval_res = evaluate_teams_pipeline(engine_teams, config)
    results_by_id = {r.team_id: r for r in eval_res.results}

    assert results_by_id["T1"].eligibility.status == RuleStatus.PASS
    assert results_by_id["T2"].eligibility.status == RuleStatus.FAIL


def test_diversity_rule_with_no_gender_column_names_only():
    csv_text = """team_id,team_name,name,email,role,skills,experience_years
T10,Data Builders,Riya Shah,riya@example.org,Lead,Python,3.0
T10,Data Builders,Sana Patel,sana@example.org,Dev,React,2.5
T20,All Boys Squad,David Kumar,david@example.org,Lead,Go,4.0
T20,All Boys Squad,Girish Verma,girish@example.org,Dev,Java,3.0
"""
    import_svc = ImportService()
    res = import_svc.process_file_content(csv_text, filename="test.csv")
    engine_teams = adapt_team_data_list(res.teams)

    config = ScoringConfig(
        top_x=5,
        weights={"experience": 0.3, "github": 0.3, "skills": 0.25, "presentation": 0.15},
        eligibility_rules=[
            RuleConfig(
                name="Diversity Requirement (Min 1 Female)",
                scope=RuleScope.MEMBER,
                field="declared_gender",
                operator=RuleOperator.EQ,
                value="female",
                aggregation="ANY",
                missing_policy=MissingDataPolicy.REQUIRE,
            )
        ],
    )
    eval_res = evaluate_teams_pipeline(engine_teams, config)
    results_by_id = {r.team_id: r for r in eval_res.results}

    # Data Builders (Riya + Sana) must pass!
    assert results_by_id["T10"].eligibility.status == RuleStatus.PASS
    # All Boys Squad must fail
    assert results_by_id["T20"].eligibility.status == RuleStatus.FAIL

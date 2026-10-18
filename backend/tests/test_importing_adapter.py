from pathlib import Path
import sys
import pytest

# Ensure data_processing is importable
dp_path = str((Path(__file__).resolve().parent.parent / "data_processing").resolve())
if dp_path not in sys.path:
    sys.path.insert(0, dp_path)

from mapping.schema_mapper import SchemaMapper
from normalization.normalization_service import NormalizationService
from parsers.csv_parser import CSVParser
from parsers.json_parser import JSONParser
from schemas.config import ImportConfig
from schemas.import_result import ImportResult
from schemas.member import MemberData
from schemas.team import TeamData

from backend.app.schemas.scoring import (
    MissingDataPolicy,
    RuleConfig,
    RuleOperator,
    RuleScope,
    RuleStatus,
    ScoringConfig,
    SignalState,
)
from backend.app.services.decision_engine import evaluate_teams_pipeline
from backend.app.services.import_adapter import (
    adapt_import_result_to_evaluation_request,
    adapt_member_data_to_engine_member,
    adapt_team_data_list,
    adapt_team_data_to_engine_team,
)


def test_adapt_member_data():
    """MemberData maps correctly into engine Member with preserved SignalValues."""
    m_data = MemberData(
        id="M101",
        name="Elena Rostova",
        email="elena@code.io",
        is_lead=True,
        github_url="https://github.com/elena",
        github_username="elena",
        skills=["python", "fastapi", "docker"],
        experience_years=3.5,
        education="MIT",
        missing_fields=["portfolio_url"],
        extra_data={"hackathons_won": 2, "normalized_code_score": 88.0},
    )

    engine_member = adapt_member_data_to_engine_member(m_data)

    assert engine_member.member_id == "M101"
    assert engine_member.name == "Elena Rostova"

    # Verify signals
    signals = engine_member.signals
    assert signals["experience_years"].value == 3.5
    assert signals["experience_years"].status == SignalState.PRESENT
    assert signals["skills"].value == ["python", "fastapi", "docker"]
    assert signals["github_username"].value == "elena"
    assert signals["is_lead"].value is True
    assert signals["portfolio_url"].status == SignalState.MISSING
    assert signals["hackathons_won"].value == 2
    assert signals["normalized_code_score"].value == 88.0


def test_adapt_team_data():
    """TeamData converts correctly to engine Team entity with team-level signals."""
    m1 = MemberData(id="M1", name="Dev One", experience_years=2.0)
    m2 = MemberData(id="M2", name="Dev Two", experience_years=4.0)

    t_data = TeamData(
        id="T_CYBER",
        team_name="CyberPulse",
        members=[m1, m2],
        team_size=2,
        lead_email="lead@cyber.io",
        is_valid=True,
        requires_review=True,
        validation_warnings=["Unusual team composition"],
        metadata={"track": "AI/ML"},
    )

    engine_team = adapt_team_data_to_engine_team(t_data)

    assert engine_team.team_id == "T_CYBER"
    assert engine_team.name == "CyberPulse"
    assert len(engine_team.members) == 2

    # Verify team signals
    ts = engine_team.team_signals
    assert ts["team_size"].value == 2
    assert ts["lead_email"].value == "lead@cyber.io"
    assert ts["track"].value == "AI/ML"
    assert ts["requires_review"].status == SignalState.FLAGGED


def test_csv_import_pipeline_to_decision_engine():
    """Full end-to-end flow: CSV parsing -> mapping -> normalization -> adapter -> decision engine evaluation."""
    csv_content = """team_id,team_name,name,email,github,experience,skills,technical_score
TEAM_A,AlphaCoders,Alice,alice@alpha.io,https://github.com/alice,3,Python; React,85
TEAM_A,AlphaCoders,Bob,bob@alpha.io,https://github.com/bob,2,Docker; Go,90
TEAM_B,SoloHacker,Charlie,charlie@solo.io,,1,HTML; CSS,60
TEAM_C,BetaBuilders,Dave,dave@beta.io,https://github.com/dave,4,Python; Rust,95
"""
    # 1. Parse CSV
    parser = CSVParser()
    raw_teams = parser.parse_string(csv_content)

    # 2. Map schema aliases
    mapper = SchemaMapper()
    mapped_teams = mapper.map_teams(raw_teams)

    # 3. Normalize values
    normalizer = NormalizationService()
    normalized_teams = normalizer.normalize_teams(mapped_teams)

    # 4. Construct TeamData models
    team_models = [TeamData(**t) for t in normalized_teams]
    assert len(team_models) == 3

    # 5. Adapt to Decision Engine
    engine_teams = adapt_team_data_list(team_models)
    assert len(engine_teams) == 3

    # 6. Configure Decision Engine with hard filter on github_url and scoring on technical_score
    config = ScoringConfig(
        top_x=2,
        weights={"technical_score": 1.0},
        eligibility_rules=[
            RuleConfig(
                name="Must have GitHub",
                scope=RuleScope.MEMBER,
                field="github_url",
                operator=RuleOperator.EXISTS,
                aggregation="ANY",
                missing_policy=MissingDataPolicy.REQUIRE,
            )
        ],
        tie_breakers=["primary_score", "team_id"],
    )

    # 7. Evaluate
    response = evaluate_teams_pipeline(engine_teams, config)

    # TEAM_B has no github for any member -> fails eligibility
    # TEAM_C (score 95) and TEAM_A (score (85+90)/2 = 87.5) should be shortlisted
    assert response.total_teams == 3
    assert response.eligible_teams == 2
    assert response.shortlisted_teams == 2
    assert response.rejected_teams == 1

    ranked_ids = [r.team_id for r in response.results if r.status == "SHORTLISTED"]
    assert ranked_ids == ["TEAM_C", "TEAM_A"]

    team_b_res = next(r for r in response.results if r.team_id == "TEAM_B")
    assert team_b_res.status == "REJECTED"


def test_json_import_to_evaluation_request():
    """End-to-end flow from JSON array of teams to ScoringEvaluationRequest."""
    json_content = """[
        {
            "team_id": "J1",
            "team_name": "DevSquad",
            "members": [
                {"name": "Mina", "skills": ["python"], "code_score": 92.0},
                {"name": "Noor", "skills": ["react"], "code_score": 88.0}
            ]
        }
    ]"""

    parser = JSONParser()
    raw_teams = parser.parse_string(json_content)
    mapped_teams = SchemaMapper().map_teams(raw_teams)
    norm_teams = NormalizationService().normalize_teams(mapped_teams)
    team_data_list = [TeamData(**t) for t in norm_teams]

    import_result = ImportResult(
        total_records=2,
        total_teams=1,
        valid_teams_count=1,
        invalid_teams_count=0,
        teams=team_data_list,
    )

    config = ScoringConfig(weights={"code_score": 1.0}, top_x=1)
    eval_req = adapt_import_result_to_evaluation_request(import_result, config)

    assert len(eval_req.teams) == 1
    assert eval_req.teams[0].team_id == "J1"

    eval_resp = evaluate_teams_pipeline(eval_req.teams, eval_req.config)
    assert eval_resp.total_teams == 1
    assert eval_resp.shortlisted_teams == 1
    assert eval_resp.results[0].score == 90.0  # (92 + 88) / 2

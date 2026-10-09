import pytest
from backend.app.schemas.scoring import (
    Member,
    RuleConfig,
    RuleOperator,
    RuleScope,
    ScoringConfig,
    Team,
)
from backend.app.services.decision_engine import evaluate_teams_pipeline


def build_comprehensive_test_dataset():
    """Builds the 7 test cases specified in Section 24:

    Case 1: Complete team data
    Case 2: Missing GitHub
    Case 3: Missing projects
    Case 4: Different team sizes (e.g. 4 members vs 2 members)
    Case 5: Solo participant (1 member)
    Case 6: Eligibility failure (fails min github)
    Case 7: Equal scores / tie (TEAM_TIE_1 and TEAM_TIE_2)
    """
    teams = [
        # Case 1: Complete team data (3 members)
        Team(
            team_id="TEAM_CASE_1",
            name="Alpha Coders",
            members=[
                Member(
                    member_id="M1_1",
                    signals={"projects": 5, "github_contributions": 120, "achievements": 3},
                ),
                Member(
                    member_id="M1_2",
                    signals={"projects": 3, "github_contributions": 80, "achievements": 1},
                ),
            ],
        ),
        # Case 2: Missing GitHub
        Team(
            team_id="TEAM_CASE_2",
            name="Beta Builders",
            members=[
                Member(
                    member_id="M2_1",
                    signals={"projects": 6, "github_contributions": None, "achievements": 2},
                ),
                Member(
                    member_id="M2_2",
                    signals={"projects": 4, "github_contributions": None, "achievements": 2},
                ),
            ],
        ),
        # Case 3: Missing projects
        Team(
            team_id="TEAM_CASE_3",
            name="Gamma Devs",
            members=[
                Member(
                    member_id="M3_1",
                    signals={"projects": None, "github_contributions": 90, "achievements": 2},
                ),
                Member(
                    member_id="M3_2",
                    signals={"projects": None, "github_contributions": 70, "achievements": 1},
                ),
            ],
        ),
        # Case 4: Large team (4 members)
        Team(
            team_id="TEAM_CASE_4",
            name="Delta Squad",
            members=[
                Member(
                    member_id="M4_1",
                    signals={"projects": 3, "github_contributions": 60, "achievements": 1},
                ),
                Member(
                    member_id="M4_2",
                    signals={"projects": 4, "github_contributions": 50, "achievements": 2},
                ),
                Member(
                    member_id="M4_3",
                    signals={"projects": 2, "github_contributions": 40, "achievements": 0},
                ),
                Member(
                    member_id="M4_4",
                    signals={"projects": 5, "github_contributions": 90, "achievements": 1},
                ),
            ],
        ),
        # Case 5: Solo participant (1 member)
        Team(
            team_id="TEAM_CASE_5",
            name="Epsilon Solo",
            members=[
                Member(
                    member_id="M5_1",
                    signals={"projects": 4, "github_contributions": 110, "achievements": 3},
                ),
            ],
        ),
        # Case 6: Eligibility failure (fails github requirement of >= 50)
        Team(
            team_id="TEAM_CASE_6",
            name="Zeta Ineligible",
            members=[
                Member(
                    member_id="M6_1",
                    signals={"projects": 8, "github_contributions": 10, "achievements": 4},
                ),
                Member(
                    member_id="M6_2",
                    signals={"projects": 6, "github_contributions": 15, "achievements": 2},
                ),
            ],
        ),
        # Case 7A & 7B: Equal scores / tie
        Team(
            team_id="TEAM_CASE_7A",
            name="Tie Breaker A",
            members=[
                Member(
                    member_id="M7A_1",
                    signals={"projects": 4, "github_contributions": 80, "achievements": 2},
                ),
            ],
        ),
        Team(
            team_id="TEAM_CASE_7B",
            name="Tie Breaker B",
            members=[
                Member(
                    member_id="M7B_1",
                    signals={"projects": 4, "github_contributions": 80, "achievements": 2},
                ),
            ],
        ),
    ]
    return teams


def build_test_config():
    return ScoringConfig(
        top_x=3,
        weights={
            "projects": 0.40,
            "github_contributions": 0.40,
            "achievements": 0.20,
        },
        eligibility_rules=[
            RuleConfig(
                name="GitHub Contribution Requirement",
                scope=RuleScope.MEMBER,
                field="github_contributions",
                operator=RuleOperator.GTE,
                value=50,
                aggregation="ANY",
            )
        ],
        tie_breakers=["primary_score", "projects", "team_id"],
    )


def test_cases_evaluation():
    """Validates behavior across all Section 24 test cases."""
    teams = build_comprehensive_test_dataset()
    config = build_test_config()

    response = evaluate_teams_pipeline(teams, config)

    # 1. Check summary counts
    assert response.total_teams == 8
    assert response.shortlisted_teams == 3
    assert response.rejected_teams == 1  # Case 6 fails eligibility

    # 2. Case 6 must be REJECTED and preserved in results
    case_6_result = next(r for r in response.results if r.team_id == "TEAM_CASE_6")
    assert case_6_result.status == "REJECTED"
    assert case_6_result.rank is None
    assert case_6_result.eligibility.status.value == "FAIL"
    assert any("GitHub Contribution Requirement" in r for r in case_6_result.reasons)

    # 3. Case 5 (Solo participant) is handled correctly
    case_5_result = next(r for r in response.results if r.team_id == "TEAM_CASE_5")
    assert case_5_result.score is not None
    assert case_5_result.eligibility.status.value == "PASS"

    # 4. Case 2 (Missing GitHub) is normalized without penalty
    case_2_result = next(r for r in response.results if r.team_id == "TEAM_CASE_2")
    assert case_2_result.score_breakdown["github_contributions"] is None
    assert case_2_result.score is not None  # Normalized on projects + achievements

    # 5. Case 7A and 7B tie breaking
    res_7a = next(r for r in response.results if r.team_id == "TEAM_CASE_7A")
    res_7b = next(r for r in response.results if r.team_id == "TEAM_CASE_7B")
    assert res_7a.score == res_7b.score
    # team_id tie breaker ensures 7A ranks before 7B
    assert res_7a.rank < res_7b.rank


def test_case_8_reproducibility():
    """Case 8: Same input run twice must produce identical results, identical

    hashes, and identical rankings.
    """
    teams = build_comprehensive_test_dataset()
    config = build_test_config()

    run1 = evaluate_teams_pipeline(teams, config)
    run2 = evaluate_teams_pipeline(teams, config)

    # 1. Identical Run ID and Hashes
    assert run1.run_id == run2.run_id
    assert run1.dataset_hash == run2.dataset_hash
    assert run1.config_hash == run2.config_hash
    assert run1.engine_version == run2.engine_version

    # 2. Identical Team Ordering and Results
    assert len(run1.results) == len(run2.results)
    for r1, r2 in zip(run1.results, run2.results):
        assert r1.team_id == r2.team_id
        assert r1.score == r2.score
        assert r1.rank == r2.rank
        assert r1.status == r2.status
        assert r1.score_breakdown == r2.score_breakdown
        assert r1.reasons == r2.reasons

    # 3. Identical JSON serialization
    assert run1.model_dump_json() == run2.model_dump_json()

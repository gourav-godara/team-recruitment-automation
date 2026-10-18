import pytest
from backend.app.schemas.scoring import (
    EligibilityResult,
    RuleResult,
    RuleStatus,
    ScoringConfig,
    TeamScoreResult,
)
from backend.app.services.ranking_engine import rank_teams


def test_ranking_and_top_x():
    """Teams are sorted descending by score; top_x cutoff assigns SHORTLISTED

    vs ELIGIBLE.
    """
    config = ScoringConfig(
        top_x=2,
        weights={"projects": 1.0},
    )

    t1 = TeamScoreResult(
        team_id="T1",
        score=70.0,
        status="ELIGIBLE",
        eligibility=EligibilityResult(status=RuleStatus.PASS),
    )
    t2 = TeamScoreResult(
        team_id="T2",
        score=95.0,
        status="ELIGIBLE",
        eligibility=EligibilityResult(status=RuleStatus.PASS),
    )
    t3 = TeamScoreResult(
        team_id="T3",
        score=85.0,
        status="ELIGIBLE",
        eligibility=EligibilityResult(status=RuleStatus.PASS),
    )

    ranked = rank_teams([t1, t2, t3], config)

    # Order should be T2 (95.0), T3 (85.0), T1 (70.0)
    assert ranked[0].team_id == "T2"
    assert ranked[0].rank == 1
    assert ranked[0].status == "SHORTLISTED"

    assert ranked[1].team_id == "T3"
    assert ranked[1].rank == 2
    assert ranked[1].status == "SHORTLISTED"

    assert ranked[2].team_id == "T1"
    assert ranked[2].rank == 3
    assert ranked[2].status == "ELIGIBLE"


def test_deterministic_tie_breaking_by_secondary_criterion():
    """When primary scores tie, secondary criterion decides the rank."""
    config = ScoringConfig(
        top_x=1,
        weights={"projects": 0.5, "github": 0.5},
        tie_breakers=["projects", "team_id"],
    )

    # Both have final score 80.0, but T_A has higher projects (90 vs 70)
    t_a = TeamScoreResult(
        team_id="TEAM_A",
        score=80.0,
        status="ELIGIBLE",
        score_breakdown={"projects": 90.0, "github": 70.0},
        eligibility=EligibilityResult(status=RuleStatus.PASS),
    )
    t_b = TeamScoreResult(
        team_id="TEAM_B",
        score=80.0,
        status="ELIGIBLE",
        score_breakdown={"projects": 70.0, "github": 90.0},
        eligibility=EligibilityResult(status=RuleStatus.PASS),
    )

    ranked = rank_teams([t_b, t_a], config)
    assert ranked[0].team_id == "TEAM_A"
    assert ranked[0].rank == 1
    assert ranked[1].team_id == "TEAM_B"
    assert ranked[1].rank == 2


def test_deterministic_tie_breaking_by_team_id():
    """When primary and secondary criteria tie, stable team_id decides."""
    config = ScoringConfig(
        top_x=2,
        weights={"projects": 1.0},
        tie_breakers=["team_id"],
    )

    t_z = TeamScoreResult(
        team_id="TEAM_Z",
        score=85.0,
        status="ELIGIBLE",
        eligibility=EligibilityResult(status=RuleStatus.PASS),
    )
    t_a = TeamScoreResult(
        team_id="TEAM_A",
        score=85.0,
        status="ELIGIBLE",
        eligibility=EligibilityResult(status=RuleStatus.PASS),
    )

    ranked = rank_teams([t_z, t_a], config)
    assert ranked[0].team_id == "TEAM_A"
    assert ranked[1].team_id == "TEAM_Z"


def test_ineligible_teams_preserved():
    """Ineligible teams remain visible with status REJECTED and no rank."""
    config = ScoringConfig(
        top_x=1,
        weights={"projects": 1.0},
    )

    t_pass = TeamScoreResult(
        team_id="T_PASS",
        score=80.0,
        status="ELIGIBLE",
        eligibility=EligibilityResult(status=RuleStatus.PASS),
    )
    t_fail = TeamScoreResult(
        team_id="T_FAIL",
        score=None,
        status="REJECTED",
        eligibility=EligibilityResult(
            status=RuleStatus.FAIL,
            failed_rules=[
                RuleResult(
                    rule_name="Min GitHub",
                    status=RuleStatus.FAIL,
                    field="github",
                    reason="No member reached threshold",
                )
            ],
        ),
    )

    ranked = rank_teams([t_fail, t_pass], config)
    assert len(ranked) == 2
    assert ranked[0].team_id == "T_PASS"
    assert ranked[0].rank == 1
    assert ranked[0].status == "SHORTLISTED"

    assert ranked[1].team_id == "T_FAIL"
    assert ranked[1].rank is None
    assert ranked[1].status == "REJECTED"
    assert len(ranked[1].eligibility.failed_rules) == 1

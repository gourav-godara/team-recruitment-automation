import pytest
from backend.app.schemas.scoring import (
    AggregationType,
    Member,
    MissingDataPolicy,
    ScoringConfig,
    SignalState,
    Team,
)
from backend.app.services.scoring_engine import calculate_team_score


def test_complete_team_weighted_scoring():
    """Team with all criteria present receives accurate weighted score on [0,

    100] scale.
    """
    config = ScoringConfig(
        weights={
            "projects": 0.5,
            "github": 0.3,
            "achievements": 0.2,
        }
    )
    team = Team(
        team_id="T1",
        members=[
            Member(
                member_id="M1",
                signals={
                    "projects": 80,
                    "github": 60,
                    "achievements": 90,
                },
            )
        ],
    )

    score, breakdown, states, details, missing_notes, flags = calculate_team_score(team, config)
    # 80 * 0.5 + 60 * 0.3 + 90 * 0.2 = 40 + 18 + 18 = 76.0
    assert score == 76.0
    assert breakdown["projects"] == 80.0
    assert breakdown["github"] == 60.0
    assert breakdown["achievements"] == 90.0
    assert states["projects"] == SignalState.PRESENT
    assert len(missing_notes) == 0

    # Verify detailed contributions
    proj_detail = next(d for d in details if d.criterion == "projects")
    assert proj_detail.configured_weight == 0.5
    assert proj_detail.effective_weight == 0.5
    assert proj_detail.contribution == 40.0


def test_missing_criterion_available_weights_normalization():
    """Missing data is NOT penalized as zero.

    Available criteria are normalized against their available weights.
    Projects (wt 0.5) = 80, GitHub (wt 0.5) = MISSING
    Available weight = 0.5 -> Effective weight = 1.0 -> Score = 80.0.
    """
    config = ScoringConfig(
        weights={
            "projects": 0.5,
            "github": 0.5,
        }
    )
    team = Team(
        team_id="T1",
        members=[
            Member(
                member_id="M1",
                signals={
                    "projects": 80,
                    "github": None,  # Missing!
                },
            )
        ],
    )

    score, breakdown, states, details, missing_notes, flags = calculate_team_score(team, config)
    assert score == 80.0
    assert breakdown["projects"] == 80.0
    assert breakdown["github"] is None
    assert states["github"] == SignalState.MISSING
    assert any("github" in n.lower() for n in missing_notes)

    # Check effective weights in details
    proj_detail = next(d for d in details if d.criterion == "projects")
    git_detail = next(d for d in details if d.criterion == "github")
    assert proj_detail.effective_weight == 1.0
    assert proj_detail.contribution == 80.0
    assert git_detail.effective_weight == 0.0
    assert git_detail.contribution is None


def test_valid_zero_distinction_from_missing():
    """Projects = 0 vs Projects = MISSING must yield strictly different

    scores.
    """
    config = ScoringConfig(
        weights={
            "projects": 0.5,
            "github": 0.5,
        }
    )

    # Team A: explicitly 0 on projects, 100 on github
    team_a = Team(
        team_id="T_A",
        members=[
            Member(member_id="M1", signals={"projects": 0, "github": 100}),
        ],
    )
    # Team B: MISSING projects, 100 on github
    team_b = Team(
        team_id="T_B",
        members=[
            Member(member_id="M1", signals={"projects": None, "github": 100}),
        ],
    )

    score_a, breakdown_a, _, _, _, _ = calculate_team_score(team_a, config)
    score_b, breakdown_b, _, _, _, _ = calculate_team_score(team_b, config)

    # Team A: (0 * 0.5 + 100 * 0.5) = 50.0
    assert score_a == 50.0
    assert breakdown_a["projects"] == 0.0

    # Team B: normalized against available weight (100 * 0.5 / 0.5) = 100.0
    assert score_b == 100.0
    assert breakdown_b["projects"] is None


def test_all_criteria_missing():
    """When all criteria are missing, the score must be None (not 0.0!)."""
    config = ScoringConfig(
        weights={
            "projects": 0.5,
            "github": 0.5,
        }
    )
    team = Team(
        team_id="T_EMPTY",
        members=[
            Member(member_id="M1", signals={"projects": None, "github": None}),
        ],
    )

    score, breakdown, states, details, missing_notes, flags = calculate_team_score(team, config)
    assert score is None
    assert breakdown["projects"] is None
    assert breakdown["github"] is None


def test_weights_validation():
    """Weights must be positive, non-negative, and sum to 1.0."""
    with pytest.raises(ValueError, match="non-negative"):
        ScoringConfig(weights={"projects": -0.5, "github": 1.5})

    with pytest.raises(ValueError, match="empty"):
        ScoringConfig(weights={})

    with pytest.raises(ValueError, match="weights must sum to 1.0"):
        ScoringConfig(weights={"projects": 0.3, "github": 0.3})


def test_criteria_aggregation_custom_strategy():
    """Config with MAX aggregation for achievements, AVERAGE for projects."""
    config = ScoringConfig(
        weights={"achievements": 0.5, "projects": 0.5},
        criteria_aggregation={
            "achievements": AggregationType.MAX,
            "projects": AggregationType.AVERAGE,
        },
    )
    team = Team(
        team_id="T1",
        members=[
            Member(member_id="M1", signals={"achievements": 10, "projects": 4}),
            Member(member_id="M2", signals={"achievements": 30, "projects": 2}),
        ],
    )

    score, breakdown, _, details, _, _ = calculate_team_score(team, config)
    # achievements MAX = 30, projects AVERAGE = (4+2)/2 = 3
    # weighted = 30 * 0.5 + 3 * 0.5 = 15 + 1.5 = 16.5
    assert breakdown["achievements"] == 30.0
    assert breakdown["projects"] == 3.0
    assert score == 16.5

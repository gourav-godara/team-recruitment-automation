import math
import pytest
from backend.app.schemas.scoring import (
    AggregationType,
    Member,
    MissingDataPolicy,
    RuleAction,
    RuleConfig,
    RuleOperator,
    RuleScope,
    RuleStatus,
    ScoringConfig,
    ScoringEvaluationRequest,
    SignalState,
    SignalValue,
    Team,
)
from backend.app.services.decision_engine import evaluate_teams_pipeline
from backend.app.services.eligibility_engine import evaluate_single_rule
from backend.app.services.scoring_engine import calculate_team_score
from backend.app.services.team_aggregation import evaluate_operator, is_numeric, partition_signals


def test_normalized_scores_at_0_and_100():
    """Scores exactly at 0.0 and 100.0 must be accepted and properly weighted."""
    config = ScoringConfig(weights={"criterion_a": 0.5, "criterion_b": 0.5})
    team = Team(
        team_id="T_BOUNDS",
        members=[
            Member(
                member_id="M1",
                signals={"criterion_a": 0.0, "criterion_b": 100.0},
            )
        ],
    )
    score, breakdown, states, details, _, _ = calculate_team_score(team, config)
    assert score == 50.0
    assert breakdown["criterion_a"] == 0.0
    assert breakdown["criterion_b"] == 100.0
    assert states["criterion_a"] == SignalState.PRESENT
    assert states["criterion_b"] == SignalState.PRESENT


def test_scores_below_0_and_above_100_rejected():
    """Scores outside the normalized [0, 100] range must be rejected at scoring boundary."""
    config = ScoringConfig(weights={"score": 1.0})

    # Below 0
    team_neg = Team(
        team_id="T_NEG",
        members=[Member(member_id="M1", signals={"score": -0.01})],
    )
    with pytest.raises(ValueError, match=r"between 0 and 100"):
        calculate_team_score(team_neg, config)

    # Above 100
    team_high = Team(
        team_id="T_HIGH",
        members=[Member(member_id="M1", signals={"score": 100.5})],
    )
    with pytest.raises(ValueError, match=r"between 0 and 100"):
        calculate_team_score(team_high, config)


def test_nan_and_infinity_handling():
    """NaN and Infinities must be marked INVALID and rejected from scoring."""
    # 1. is_numeric checks
    assert is_numeric(float("nan")) is False
    assert is_numeric(float("inf")) is False
    assert is_numeric(float("-inf")) is False

    # 2. SignalValue normalization
    sig_nan = SignalValue(value=float("nan"))
    assert sig_nan.status == SignalState.INVALID
    sig_inf = SignalValue(value=float("inf"))
    assert sig_inf.status == SignalState.INVALID

    # 3. partition_signals routes non-finite numbers to invalid
    valid_nums, missing, invalid, na, flags = partition_signals([sig_nan, sig_inf])
    assert len(valid_nums) == 0
    assert len(invalid) == 2

    # 4. Non-finite values are quarantined as INVALID and excluded from scoring
    config = ScoringConfig(weights={"score": 1.0})
    team_nan = Team(
        team_id="T_NAN",
        members=[Member(member_id="M1", signals={"score": float("nan")})],
    )
    score, breakdown, states, _, _, flags = calculate_team_score(team_nan, config)
    assert score is None
    assert states["score"] == SignalState.INVALID
    assert any("invalid data" in f.lower() for f in flags)


def test_boolean_values_supplied_where_numerics_expected():
    """Booleans must not be silently treated as 0 or 1 in scoring or numeric comparison."""
    assert is_numeric(True) is False
    assert is_numeric(False) is False

    # Scoring boundary rejects booleans
    config = ScoringConfig(weights={"score": 1.0})
    team_bool = Team(
        team_id="T_BOOL",
        members=[Member(member_id="M1", signals={"score": True})],
    )
    with pytest.raises(ValueError, match=r"must be numeric, not boolean"):
        calculate_team_score(team_bool, config)

    # Operator evaluation prevents True == 1 equality across distinct types
    assert evaluate_operator(True, RuleOperator.EQ, 1) is False
    assert evaluate_operator(False, RuleOperator.EQ, 0) is False
    assert evaluate_operator(True, RuleOperator.GT, 0) is False
    assert evaluate_operator(False, RuleOperator.LT, 1) is False


def test_top_x_none():
    """top_x=None retains all eligible teams as SHORTLISTED."""
    config = ScoringConfig(weights={"score": 1.0}, top_x=None)
    teams = [
        Team(team_id="T1", members=[Member(member_id="M1", signals={"score": 80.0})]),
        Team(team_id="T2", members=[Member(member_id="M2", signals={"score": 90.0})]),
    ]
    resp = evaluate_teams_pipeline(teams, config)
    assert resp.shortlisted_teams == 2
    assert all(r.status == "SHORTLISTED" for r in resp.results)


def test_top_x_one():
    """top_x=1 shortlists only the highest ranked team."""
    config = ScoringConfig(weights={"score": 1.0}, top_x=1)
    teams = [
        Team(team_id="T1", members=[Member(member_id="M1", signals={"score": 80.0})]),
        Team(team_id="T2", members=[Member(member_id="M2", signals={"score": 90.0})]),
    ]
    resp = evaluate_teams_pipeline(teams, config)
    assert resp.shortlisted_teams == 1
    assert resp.results[0].team_id == "T2"
    assert resp.results[0].status == "SHORTLISTED"
    assert resp.results[1].team_id == "T1"
    assert resp.results[1].status == "ELIGIBLE"


def test_top_x_zero_and_negative_rejected():
    """top_x=0 and negative values must raise validation error."""
    with pytest.raises(ValueError, match=r"positive integer > 0"):
        ScoringConfig(weights={"score": 1.0}, top_x=0)

    with pytest.raises(ValueError, match=r"positive integer > 0"):
        ScoringConfig(weights={"score": 1.0}, top_x=-1)


def test_top_x_boolean_and_invalid_types_rejected():
    """top_x with booleans or non-integers must be rejected."""
    with pytest.raises(ValueError, match=r"not a boolean"):
        ScoringConfig(weights={"score": 1.0}, top_x=True)

    with pytest.raises(ValueError, match=r"positive integer"):
        ScoringConfig(weights={"score": 1.0}, top_x="five")  # type: ignore


def test_top_x_larger_than_eligible_count():
    """top_x exceeding eligible team count shortlists all eligible teams without crashing."""
    config = ScoringConfig(weights={"score": 1.0}, top_x=50)
    teams = [
        Team(team_id="T1", members=[Member(member_id="M1", signals={"score": 80.0})]),
        Team(team_id="T2", members=[Member(member_id="M2", signals={"score": 90.0})]),
    ]
    resp = evaluate_teams_pipeline(teams, config)
    assert resp.shortlisted_teams == 2
    assert resp.eligible_teams == 2
    assert resp.results[0].status == "SHORTLISTED"
    assert resp.results[1].status == "SHORTLISTED"


def test_duplicate_team_ids_rejected():
    """Duplicate team IDs must be rejected explicitly."""
    config = ScoringConfig(weights={"score": 1.0})
    teams = [
        Team(team_id="T_DUP", members=[Member(member_id="M1", signals={"score": 80.0})]),
        Team(team_id="T_DUP", members=[Member(member_id="M2", signals={"score": 90.0})]),
    ]
    with pytest.raises(ValueError, match=r"Duplicate team_id\(s\) detected"):
        ScoringEvaluationRequest(teams=teams, config=config)

    with pytest.raises(ValueError, match=r"Duplicate team_id\(s\) detected"):
        evaluate_teams_pipeline(teams, config)


def test_unsupported_rule_actions_rejected():
    """RuleAction BONUS, PENALTY, and FLAG must be rejected in MVP."""
    with pytest.raises(ValueError, match=r"RuleAction 'BONUS' is not supported"):
        RuleConfig(
            name="Bonus Rule",
            field="bonus_field",
            operator=RuleOperator.EQ,
            value=True,
            action=RuleAction.BONUS,
        )

    with pytest.raises(ValueError, match=r"RuleAction 'PENALTY' is not supported"):
        RuleConfig(
            name="Penalty Rule",
            field="penalty_field",
            operator=RuleOperator.EQ,
            value=True,
            action=RuleAction.PENALTY,
        )


def test_in_and_notin_with_collections():
    """IN and NOT_IN must work accurately with lists, tuples, and sets."""
    team = Team(
        team_id="T_IN",
        members=[
            Member(
                member_id="M1",
                signals={"role": "frontend", "track": "web"},
            )
        ],
    )
    r_in = RuleConfig(
        name="Role in list",
        field="role",
        operator=RuleOperator.IN,
        value=["frontend", "backend"],
    )
    assert evaluate_single_rule(team, r_in).status == RuleStatus.PASS

    r_notin = RuleConfig(
        name="Role not in set",
        field="role",
        operator=RuleOperator.NOT_IN,
        value={"admin", "judge"},
    )
    assert evaluate_single_rule(team, r_notin).status == RuleStatus.PASS


def test_in_and_notin_reject_substring_matching_and_invalid_types():
    """IN and NOT_IN must reject strings (preventing substring matches) and require collections."""
    # Substring match attempt on strings must raise validation error
    with pytest.raises(ValueError, match=r"requires 'value' to be a collection"):
        RuleConfig(
            name="Substring Trap",
            field="role",
            operator=RuleOperator.IN,
            value="developer",  # string instead of collection
        )

    # Direct operator call with non-collection raises ValueError
    with pytest.raises(ValueError, match=r"requires expected value to be a collection"):
        evaluate_operator("dev", RuleOperator.IN, "developer")

    with pytest.raises(ValueError, match=r"requires expected value to be a collection"):
        evaluate_operator("dev", RuleOperator.NOT_IN, "developer")


def test_missing_and_invalid_signal_preservation():
    """MISSING and INVALID signals are preserved and not conflated with zero."""
    config = ScoringConfig(weights={"projects": 0.5, "skills": 0.5})
    team = Team(
        team_id="T_STATES",
        members=[
            Member(
                member_id="M1",
                signals={
                    "projects": SignalValue(value=None, status=SignalState.MISSING),
                    "skills": 90.0,
                },
            ),
            Member(
                member_id="M2",
                signals={
                    "projects": SignalValue(value="corrupted", status=SignalState.INVALID),
                    "skills": 70.0,
                },
            ),
        ],
    )
    score, breakdown, states, details, missing_notes, flags = calculate_team_score(team, config)
    # Skills has valid values (avg 80), projects has 0 valid values -> effective weight shifts to skills
    assert score == 80.0
    assert states["projects"] == SignalState.INVALID
    assert states["skills"] == SignalState.PRESENT
    assert any("invalid data" in f.lower() for f in flags)


def test_zero_valued_signals_distinct_from_missing():
    """A 0 score is valid PRESENT(0.0), contributing 0 points, distinct from MISSING."""
    config = ScoringConfig(weights={"score": 0.5, "bonus": 0.5})
    # Team with 0 score
    team_zero = Team(
        team_id="T_ZERO",
        members=[Member(member_id="M1", signals={"score": 0.0, "bonus": 100.0})],
    )
    score_zero, breakdown_zero, _, _, _, _ = calculate_team_score(team_zero, config)
    assert score_zero == 50.0  # 0 * 0.5 + 100 * 0.5 = 50.0
    assert breakdown_zero["score"] == 0.0

    # Team with missing score (reweighted to bonus = 100)
    team_missing = Team(
        team_id="T_MISSING",
        members=[Member(member_id="M1", signals={"score": None, "bonus": 100.0})],
    )
    score_missing, breakdown_missing, _, _, _, _ = calculate_team_score(team_missing, config)
    assert score_missing == 100.0  # bonus effective weight becomes 1.0
    assert breakdown_missing["score"] is None


def test_teams_with_different_member_counts():
    """Teams of size 1 (solo), 2, 4, and 5 members evaluate cleanly and fairly."""
    config = ScoringConfig(
        weights={"tech_score": 1.0},
        criteria_aggregation={"tech_score": AggregationType.AVERAGE},
    )

    t_solo = Team(
        team_id="T_SOLO",
        members=[Member(member_id="M1", signals={"tech_score": 90.0})],
    )
    t_pair = Team(
        team_id="T_PAIR",
        members=[
            Member(member_id="M1", signals={"tech_score": 80.0}),
            Member(member_id="M2", signals={"tech_score": 100.0}),
        ],
    )
    t_quad = Team(
        team_id="T_QUAD",
        members=[
            Member(member_id="M1", signals={"tech_score": 70.0}),
            Member(member_id="M2", signals={"tech_score": 80.0}),
            Member(member_id="M3", signals={"tech_score": 90.0}),
            Member(member_id="M4", signals={"tech_score": 100.0}),
        ],
    )

    s_solo, _, _, _, _, _ = calculate_team_score(t_solo, config)
    s_pair, _, _, _, _, _ = calculate_team_score(t_pair, config)
    s_quad, _, _, _, _, _ = calculate_team_score(t_quad, config)

    assert s_solo == 90.0
    assert s_pair == 90.0
    assert s_quad == 85.0


def test_large_batch_500_teams_deterministic_ranking():
    """500 teams evaluated together: verify deterministic ranking, top_x cutoff, and reproducible hashes."""
    config = ScoringConfig(
        top_x=50,
        weights={"code_quality": 0.6, "experience": 0.4},
        tie_breakers=["primary_score", "code_quality", "team_id"],
    )

    teams = []
    for i in range(500):
        # Deterministic generation: scores between 50 and 100
        cq = round(50.0 + (i % 51), 1)
        exp = round(50.0 + ((i * 3) % 51), 1)
        team = Team(
            team_id=f"TEAM_{i:04d}",
            members=[
                Member(member_id=f"M_{i}_1", signals={"code_quality": cq, "experience": exp}),
                Member(member_id=f"M_{i}_2", signals={"code_quality": cq, "experience": exp}),
            ],
        )
        teams.append(team)

    run1 = evaluate_teams_pipeline(teams, config)
    run2 = evaluate_teams_pipeline(teams, config)

    # 1. Total and status counts
    assert run1.total_teams == 500
    assert run1.eligible_teams == 500
    assert run1.shortlisted_teams == 50

    # 2. Strict ranks assigned 1 to 500 without duplicates
    ranks = [r.rank for r in run1.results]
    assert ranks == list(range(1, 501))

    # 3. Determinism across runs
    assert run1.run_id == run2.run_id
    assert run1.dataset_hash == run2.dataset_hash
    assert run1.config_hash == run2.config_hash
    for r1, r2 in zip(run1.results, run2.results):
        assert r1.team_id == r2.team_id
        assert r1.score == r2.score
        assert r1.rank == r2.rank
        assert r1.status == r2.status

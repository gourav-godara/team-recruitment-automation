import pytest
from backend.app.schemas.scoring import (
    AggregationType,
    MissingDataPolicy,
    RuleOperator,
    RuleStatus,
    SignalState,
    SignalValue,
)
from backend.app.services.team_aggregation import (
    aggregate_all,
    aggregate_any,
    aggregate_average,
    aggregate_max,
    aggregate_min,
    aggregate_percentage,
    aggregate_sum,
    aggregate_team_signal,
    evaluate_operator,
)


def test_valid_zero_vs_missing():
    """Confirms that explicit 0 is PRESENT and valid, while None is MISSING."""
    sig_zero = SignalValue(value=0)
    sig_missing = SignalValue(value=None)

    assert sig_zero.status == SignalState.PRESENT
    assert sig_zero.value == 0

    assert sig_missing.status == SignalState.MISSING
    assert sig_missing.value is None


def test_average_with_missing_values():
    """Member 1: projects = 4

    Member 2: projects = 2
    Member 3: projects = MISSING
    Average must be (4 + 2) / 2 = 3.0, NOT (4 + 2 + 0) / 3 = 2.0!
    """
    signals = [
        SignalValue(value=4),
        SignalValue(value=2),
        SignalValue(value=None, status=SignalState.MISSING),
    ]
    res = aggregate_average("projects", signals)

    assert res.value == 3.0
    assert res.status == SignalState.PRESENT
    assert res.available_count == 2
    assert res.missing_count == 1
    assert res.not_applicable_count == 0
    assert res.total_count == 3


def test_average_when_all_missing():
    """When all signals are missing, average must be None and status MISSING,

    NOT 0.
    """
    signals = [
        SignalValue(value=None, status=SignalState.MISSING),
        SignalValue(value=None, status=SignalState.MISSING),
    ]
    res = aggregate_average("projects", signals)

    assert res.value is None
    assert res.status == SignalState.MISSING
    assert res.available_count == 0
    assert res.missing_count == 2


def test_average_with_valid_zeros():
    """When signals include valid 0, 0 contributes to the count and average."""
    signals = [
        SignalValue(value=6),
        SignalValue(value=0),
    ]
    res = aggregate_average("projects", signals)
    assert res.value == 3.0
    assert res.available_count == 2
    assert res.missing_count == 0


def test_sum_with_missing():
    """Sum: 4 + 2 + MISSING = 6.0, missing count = 1."""
    signals = [
        SignalValue(value=4),
        SignalValue(value=2),
        SignalValue(value=None, status=SignalState.MISSING),
    ]
    res = aggregate_sum("projects", signals)
    assert res.value == 6.0
    assert res.available_count == 2
    assert res.missing_count == 1


def test_max_and_min_with_missing():
    """Max of 4, 2, MISSING -> 4. Min of 4, 2, MISSING -> 2."""
    signals = [
        SignalValue(value=4),
        SignalValue(value=2),
        SignalValue(value=None, status=SignalState.MISSING),
    ]
    max_res = aggregate_max("projects", signals)
    min_res = aggregate_min("projects", signals)

    assert max_res.value == 4.0
    assert min_res.value == 2.0


def test_max_and_min_with_require_policy():
    """MAX and MIN must strictly enforce MissingDataPolicy.REQUIRE like

    AVERAGE/SUM.
    """
    signals = [
        SignalValue(value=4),
        SignalValue(value=None, status=SignalState.MISSING),
    ]
    max_res = aggregate_max("projects", signals, missing_policy=MissingDataPolicy.REQUIRE)
    min_res = aggregate_min("projects", signals, missing_policy=MissingDataPolicy.REQUIRE)

    assert max_res.value is None
    assert max_res.status == SignalState.MISSING

    assert min_res.value is None
    assert min_res.status == SignalState.MISSING


def test_any_aggregation_rules_with_invalid_separation():
    """ANY condition: >= 50

    Strictly separates MISSING != INVALID != NOT_APPLICABLE.
    """
    op = RuleOperator.GTE
    target = 50

    # Case 1: One verified pass
    case1 = [
        SignalValue(value=72),
        SignalValue(value=None, status=SignalState.MISSING),
        SignalValue(value=20),
    ]
    status1, _, _, missing1, invalid1, na1 = aggregate_any(case1, op, target)
    assert status1 == RuleStatus.PASS
    assert missing1 == 1
    assert invalid1 == 0

    # Case 2: One failed, one missing, one invalid
    case2 = [
        SignalValue(value=30),
        SignalValue(value=None, status=SignalState.MISSING),
        SignalValue(value="corrupted", status=SignalState.INVALID),
    ]
    status2, reason2, _, missing2, invalid2, na2 = aggregate_any(case2, op, target)
    assert status2 == RuleStatus.INSUFFICIENT_DATA
    assert missing2 == 1
    assert invalid2 == 1
    assert "1 missing" in reason2
    assert "1 invalid" in reason2


def test_all_aggregation_rules():
    """ALL condition: >= 50

    Case 1: 72, 80, MISSING -> INSUFFICIENT_DATA (cannot verify all pass)
    Case 2: 72, 30, MISSING -> FAIL (verified failure exists!)
    Case 3: 72, 80 -> PASS (all verified pass)
    """
    op = RuleOperator.GTE
    target = 50

    case1 = [
        SignalValue(value=72),
        SignalValue(value=80),
        SignalValue(value=None, status=SignalState.MISSING),
    ]
    status1, _, _, _, _, _ = aggregate_all(case1, op, target)
    assert status1 == RuleStatus.INSUFFICIENT_DATA

    case2 = [
        SignalValue(value=72),
        SignalValue(value=30),
        SignalValue(value=None, status=SignalState.MISSING),
    ]
    status2, _, _, _, _, _ = aggregate_all(case2, op, target)
    assert status2 == RuleStatus.FAIL

    case3 = [
        SignalValue(value=72),
        SignalValue(value=80),
    ]
    status3, _, _, _, _, _ = aggregate_all(case3, op, target)
    assert status3 == RuleStatus.PASS


def test_percentage_aggregation():
    """2 of 4 members satisfy >= 50 (50% or 0.5)."""
    signals = [
        SignalValue(value=70),
        SignalValue(value=60),
        SignalValue(value=30),
        SignalValue(value=20),
    ]
    res = aggregate_percentage("github", signals, RuleOperator.GTE, 50)
    assert res.value == 0.5
    assert res.available_count == 4


def test_unsupported_aggregation_fails_loudly():
    """aggregate_team_signal must raise ValueError on unsupported or invalid

    aggregation types, NOT silently fall back to AVERAGE!
    """
    signals = [SignalValue(value=10)]
    with pytest.raises(ValueError, match="Unsupported aggregation type"):
        aggregate_team_signal("projects", signals, agg_type="MEDIAN")

    with pytest.raises(ValueError, match="PERCENTAGE requires conditional rule evaluation"):
        aggregate_team_signal("projects", signals, agg_type=AggregationType.PERCENTAGE)


def test_flagged_signals_policy():
    """Flagged signals only participate when explicitly allowed."""
    signals = [
        SignalValue(value=10),
        SignalValue(value=20, status=SignalState.FLAGGED, reason="Unverified AI score"),
    ]

    # By default (allow_flagged=False), flagged value is excluded from automatic calculation
    res_default = aggregate_average("projects", signals, allow_flagged=False)
    assert res_default.value == 10.0
    assert res_default.available_count == 1
    assert "Unverified AI score" in res_default.flags

    # When allow_flagged=True, flagged value participates with warning
    res_allowed = aggregate_average("projects", signals, allow_flagged=True)
    assert res_allowed.value == 15.0  # (10 + 20) / 2
    assert res_allowed.available_count == 2
    assert "Unverified AI score" in res_allowed.flags

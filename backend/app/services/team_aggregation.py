from typing import Any, List, Optional, Tuple
from backend.app.schemas.scoring import (
    AggregationType,
    AggregatedSignal,
    MissingDataPolicy,
    RuleOperator,
    RuleStatus,
    SignalState,
    SignalValue,
)


def is_numeric(val: Any) -> bool:
    if val is None or isinstance(val, bool):
        return False
    return isinstance(val, (int, float))


def partition_signals(
    signals: List[SignalValue],
    allow_flagged: bool = False,
) -> Tuple[List[float], List[SignalValue], List[SignalValue], List[SignalValue], List[str]]:
    """Partitions member signals into distinct categories:

    - valid_nums: Verified numeric values eligible for scoring
    - missing: Unprovided / unavailable signals
    - invalid: Provided values that failed validation/parsing
    - na: Explicitly not-applicable signals
    - flags: Audit flags/warnings for review
    """
    valid_nums: List[float] = []
    missing: List[SignalValue] = []
    invalid: List[SignalValue] = []
    na: List[SignalValue] = []
    flags: List[str] = []

    for s in signals:
        if s.status == SignalState.FLAGGED:
            msg = s.reason or "Flagged uncertain signal present"
            flags.append(msg)
            if allow_flagged and is_numeric(s.value):
                valid_nums.append(float(s.value))
            elif not allow_flagged:
                # Flagged values do not silently participate in automatic scoring unless allowed
                pass
            else:
                invalid.append(s)
        elif s.status == SignalState.PRESENT:
            if is_numeric(s.value):
                valid_nums.append(float(s.value))
            elif s.value is None:
                missing.append(s)
            else:
                invalid.append(s)
        elif s.status == SignalState.MISSING:
            missing.append(s)
        elif s.status == SignalState.INVALID:
            invalid.append(s)
        elif s.status == SignalState.NOT_APPLICABLE:
            na.append(s)

    return valid_nums, missing, invalid, na, flags


def aggregate_average(
    criterion: str,
    signals: List[SignalValue],
    missing_policy: MissingDataPolicy = MissingDataPolicy.IGNORE,
    allow_flagged: bool = False,
) -> AggregatedSignal:
    total_count = len(signals)
    valid_nums, missing, invalid, na, flags = partition_signals(signals, allow_flagged=allow_flagged)
    available_count = len(valid_nums)
    missing_count = len(missing)
    invalid_count = len(invalid)
    na_count = len(na)

    if missing_policy == MissingDataPolicy.FLAG and missing_count > 0:
        flags.append(f"{criterion} missing for {missing_count} of {total_count} members")

    if available_count == 0:
        status = SignalState.INVALID if invalid_count > 0 and missing_count == 0 else SignalState.MISSING
        return AggregatedSignal(
            criterion=criterion,
            value=None,
            status=status,
            available_count=available_count,
            missing_count=missing_count,
            invalid_count=invalid_count,
            not_applicable_count=na_count,
            total_count=total_count,
            flags=flags,
        )

    if missing_policy == MissingDataPolicy.REQUIRE and missing_count > 0:
        return AggregatedSignal(
            criterion=criterion,
            value=None,
            status=SignalState.MISSING,
            available_count=available_count,
            missing_count=missing_count,
            invalid_count=invalid_count,
            not_applicable_count=na_count,
            total_count=total_count,
            flags=[f"{criterion} required complete data but {missing_count} missing"],
        )

    avg_val = round(sum(valid_nums) / available_count, 4)
    return AggregatedSignal(
        criterion=criterion,
        value=avg_val,
        status=SignalState.FLAGGED if flags else SignalState.PRESENT,
        available_count=available_count,
        missing_count=missing_count,
        invalid_count=invalid_count,
        not_applicable_count=na_count,
        total_count=total_count,
        flags=flags,
    )


def aggregate_sum(
    criterion: str,
    signals: List[SignalValue],
    missing_policy: MissingDataPolicy = MissingDataPolicy.IGNORE,
    allow_flagged: bool = False,
) -> AggregatedSignal:
    total_count = len(signals)
    valid_nums, missing, invalid, na, flags = partition_signals(signals, allow_flagged=allow_flagged)
    available_count = len(valid_nums)
    missing_count = len(missing)
    invalid_count = len(invalid)
    na_count = len(na)

    if missing_policy == MissingDataPolicy.FLAG and missing_count > 0:
        flags.append(f"{criterion} missing for {missing_count} of {total_count} members")

    if available_count == 0:
        status = SignalState.INVALID if invalid_count > 0 and missing_count == 0 else SignalState.MISSING
        return AggregatedSignal(
            criterion=criterion,
            value=None,
            status=status,
            available_count=available_count,
            missing_count=missing_count,
            invalid_count=invalid_count,
            not_applicable_count=na_count,
            total_count=total_count,
            flags=flags,
        )

    if missing_policy == MissingDataPolicy.REQUIRE and missing_count > 0:
        return AggregatedSignal(
            criterion=criterion,
            value=None,
            status=SignalState.MISSING,
            available_count=available_count,
            missing_count=missing_count,
            invalid_count=invalid_count,
            not_applicable_count=na_count,
            total_count=total_count,
            flags=[f"{criterion} required complete data but {missing_count} missing"],
        )

    sum_val = round(sum(valid_nums), 4)
    return AggregatedSignal(
        criterion=criterion,
        value=sum_val,
        status=SignalState.FLAGGED if flags else SignalState.PRESENT,
        available_count=available_count,
        missing_count=missing_count,
        invalid_count=invalid_count,
        not_applicable_count=na_count,
        total_count=total_count,
        flags=flags,
    )


def aggregate_max(
    criterion: str,
    signals: List[SignalValue],
    missing_policy: MissingDataPolicy = MissingDataPolicy.IGNORE,
    allow_flagged: bool = False,
) -> AggregatedSignal:
    total_count = len(signals)
    valid_nums, missing, invalid, na, flags = partition_signals(signals, allow_flagged=allow_flagged)
    available_count = len(valid_nums)
    missing_count = len(missing)
    invalid_count = len(invalid)
    na_count = len(na)

    if missing_policy == MissingDataPolicy.FLAG and missing_count > 0:
        flags.append(f"{criterion} missing for {missing_count} of {total_count} members")

    if available_count == 0:
        status = SignalState.INVALID if invalid_count > 0 and missing_count == 0 else SignalState.MISSING
        return AggregatedSignal(
            criterion=criterion,
            value=None,
            status=status,
            available_count=available_count,
            missing_count=missing_count,
            invalid_count=invalid_count,
            not_applicable_count=na_count,
            total_count=total_count,
            flags=flags,
        )

    if missing_policy == MissingDataPolicy.REQUIRE and missing_count > 0:
        return AggregatedSignal(
            criterion=criterion,
            value=None,
            status=SignalState.MISSING,
            available_count=available_count,
            missing_count=missing_count,
            invalid_count=invalid_count,
            not_applicable_count=na_count,
            total_count=total_count,
            flags=[f"{criterion} required complete data but {missing_count} missing"],
        )

    max_val = round(max(valid_nums), 4)
    return AggregatedSignal(
        criterion=criterion,
        value=max_val,
        status=SignalState.FLAGGED if flags else SignalState.PRESENT,
        available_count=available_count,
        missing_count=missing_count,
        invalid_count=invalid_count,
        not_applicable_count=na_count,
        total_count=total_count,
        flags=flags,
    )


def aggregate_min(
    criterion: str,
    signals: List[SignalValue],
    missing_policy: MissingDataPolicy = MissingDataPolicy.IGNORE,
    allow_flagged: bool = False,
) -> AggregatedSignal:
    total_count = len(signals)
    valid_nums, missing, invalid, na, flags = partition_signals(signals, allow_flagged=allow_flagged)
    available_count = len(valid_nums)
    missing_count = len(missing)
    invalid_count = len(invalid)
    na_count = len(na)

    if missing_policy == MissingDataPolicy.FLAG and missing_count > 0:
        flags.append(f"{criterion} missing for {missing_count} of {total_count} members")

    if available_count == 0:
        status = SignalState.INVALID if invalid_count > 0 and missing_count == 0 else SignalState.MISSING
        return AggregatedSignal(
            criterion=criterion,
            value=None,
            status=status,
            available_count=available_count,
            missing_count=missing_count,
            invalid_count=invalid_count,
            not_applicable_count=na_count,
            total_count=total_count,
            flags=flags,
        )

    if missing_policy == MissingDataPolicy.REQUIRE and missing_count > 0:
        return AggregatedSignal(
            criterion=criterion,
            value=None,
            status=SignalState.MISSING,
            available_count=available_count,
            missing_count=missing_count,
            invalid_count=invalid_count,
            not_applicable_count=na_count,
            total_count=total_count,
            flags=[f"{criterion} required complete data but {missing_count} missing"],
        )

    min_val = round(min(valid_nums), 4)
    return AggregatedSignal(
        criterion=criterion,
        value=min_val,
        status=SignalState.FLAGGED if flags else SignalState.PRESENT,
        available_count=available_count,
        missing_count=missing_count,
        invalid_count=invalid_count,
        not_applicable_count=na_count,
        total_count=total_count,
        flags=flags,
    )


def evaluate_operator(actual: Any, op: RuleOperator, expected: Any) -> bool:
    """Evaluates whether actual value matches expected value under the given operator."""
    if op == RuleOperator.EXISTS:
        return actual is not None
    if op == RuleOperator.NOT_EXISTS:
        return actual is None

    if actual is None:
        return False

    try:
        if op == RuleOperator.EQ:
            return actual == expected
        elif op == RuleOperator.NEQ:
            return actual != expected
        elif op == RuleOperator.GT:
            return actual > expected
        elif op == RuleOperator.GTE:
            return actual >= expected
        elif op == RuleOperator.LT:
            return actual < expected
        elif op == RuleOperator.LTE:
            return actual <= expected
        elif op == RuleOperator.IN:
            if isinstance(expected, (list, tuple, set)):
                return actual in expected
            return str(actual) in str(expected)
        elif op == RuleOperator.NOT_IN:
            if isinstance(expected, (list, tuple, set)):
                return actual not in expected
            return str(actual) not in str(expected)
    except (TypeError, ValueError):
        return False

    return False


def aggregate_any(
    signals: List[SignalValue],
    op: RuleOperator,
    expected: Any,
) -> Tuple[RuleStatus, str, int, int, int, int]:
    """
    ANY condition aggregation over member signals using three-valued logic.
    Strictly preserves INVALID != MISSING.
    Returns:
    (RuleStatus, reason, valid_count, missing_count, invalid_count, na_count)
    """
    total = len(signals)
    valid_evaluated = 0
    missing_count = 0
    invalid_count = 0
    na_count = 0
    has_pass = False

    for s in signals:
        if op == RuleOperator.NOT_EXISTS:
            if s.status == SignalState.MISSING or s.value is None:
                valid_evaluated += 1
                has_pass = True
            elif s.status == SignalState.INVALID:
                invalid_count += 1
            else:
                valid_evaluated += 1
            continue

        if op == RuleOperator.EXISTS:
            if s.status in (SignalState.PRESENT, SignalState.FLAGGED) and s.value is not None:
                valid_evaluated += 1
                has_pass = True
            elif s.status == SignalState.INVALID:
                invalid_count += 1
            elif s.status == SignalState.NOT_APPLICABLE:
                na_count += 1
            else:
                missing_count += 1
            continue

        if s.status == SignalState.NOT_APPLICABLE:
            na_count += 1
            continue
        if s.status == SignalState.INVALID:
            invalid_count += 1
            continue
        if s.status == SignalState.MISSING or s.value is None:
            missing_count += 1
            continue

        valid_evaluated += 1
        if evaluate_operator(s.value, op, expected):
            has_pass = True

    if has_pass:
        return (
            RuleStatus.PASS,
            "At least one member satisfied the requirement",
            valid_evaluated,
            missing_count,
            invalid_count,
            na_count,
        )

    if op == RuleOperator.NOT_EXISTS:
        return RuleStatus.FAIL, "All members possessed the field", valid_evaluated, 0, invalid_count, na_count

    if valid_evaluated == 0 and (missing_count > 0 or invalid_count > 0):
        details = []
        if missing_count:
            details.append(f"{missing_count} missing")
        if invalid_count:
            details.append(f"{invalid_count} invalid")
        return (
            RuleStatus.INSUFFICIENT_DATA,
            f"No verified member data available ({', '.join(details)})",
            0,
            missing_count,
            invalid_count,
            na_count,
        )

    if missing_count > 0 or invalid_count > 0:
        details = []
        if missing_count:
            details.append(f"{missing_count} missing")
        if invalid_count:
            details.append(f"{invalid_count} invalid")
        return (
            RuleStatus.INSUFFICIENT_DATA,
            f"No verified member satisfied requirement yet ({', '.join(details)})",
            valid_evaluated,
            missing_count,
            invalid_count,
            na_count,
        )

    return (
        RuleStatus.FAIL,
        f"All {valid_evaluated} verified member(s) failed the threshold",
        valid_evaluated,
        missing_count,
        invalid_count,
        na_count,
    )


def aggregate_all(
    signals: List[SignalValue],
    op: RuleOperator,
    expected: Any,
) -> Tuple[RuleStatus, str, int, int, int, int]:
    """
    ALL condition aggregation over member signals using three-valued logic.
    Strictly preserves INVALID != MISSING.
    Returns:
    (RuleStatus, reason, passed_count, missing_count, invalid_count, na_count)
    """
    total = len(signals)
    passed_count = 0
    failed_count = 0
    missing_count = 0
    invalid_count = 0
    na_count = 0

    for s in signals:
        if op == RuleOperator.NOT_EXISTS:
            if s.status in (SignalState.PRESENT, SignalState.FLAGGED) and s.value is not None:
                failed_count += 1
            elif s.status == SignalState.INVALID:
                invalid_count += 1
            else:
                passed_count += 1
            continue

        if op == RuleOperator.EXISTS:
            if s.status in (SignalState.PRESENT, SignalState.FLAGGED) and s.value is not None:
                passed_count += 1
            elif s.status == SignalState.INVALID:
                invalid_count += 1
            elif s.status == SignalState.NOT_APPLICABLE:
                na_count += 1
            else:
                missing_count += 1
            continue

        if s.status == SignalState.NOT_APPLICABLE:
            na_count += 1
            continue
        if s.status == SignalState.INVALID:
            invalid_count += 1
            continue
        if s.status == SignalState.MISSING or s.value is None:
            missing_count += 1
            continue

        if not evaluate_operator(s.value, op, expected):
            failed_count += 1
        else:
            passed_count += 1

    if failed_count > 0:
        return (
            RuleStatus.FAIL,
            f"{failed_count} verified member(s) failed the requirement",
            passed_count,
            missing_count,
            invalid_count,
            na_count,
        )

    if op == RuleOperator.EXISTS:
        if missing_count > 0 or invalid_count > 0:
            details = []
            if missing_count:
                details.append(f"{missing_count} missing")
            if invalid_count:
                details.append(f"{invalid_count} invalid")
            return (
                RuleStatus.FAIL,
                f"Field requirement failed: {', '.join(details)}",
                passed_count,
                missing_count,
                invalid_count,
                na_count,
            )
        return RuleStatus.PASS, "All members possess the required field", passed_count, 0, 0, na_count

    if missing_count > 0 or invalid_count > 0:
        details = []
        if missing_count:
            details.append(f"{missing_count} missing")
        if invalid_count:
            details.append(f"{invalid_count} invalid")
        return (
            RuleStatus.INSUFFICIENT_DATA,
            f"{passed_count} member(s) passed, but complete verification is blocked by {', '.join(details)}",
            passed_count,
            missing_count,
            invalid_count,
            na_count,
        )

    return (
        RuleStatus.PASS,
        f"All {passed_count} member(s) satisfied the requirement",
        passed_count,
        missing_count,
        invalid_count,
        na_count,
    )


def aggregate_percentage(
    criterion: str,
    signals: List[SignalValue],
    op: RuleOperator,
    expected: Any,
    allow_flagged: bool = False,
) -> AggregatedSignal:
    total_count = len(signals)
    valid_nums, missing, invalid, na, flags = partition_signals(signals, allow_flagged=allow_flagged)
    available_count = len(valid_nums)
    missing_count = len(missing)
    invalid_count = len(invalid)
    na_count = len(na)

    if available_count == 0:
        return AggregatedSignal(
            criterion=criterion,
            value=None,
            status=SignalState.MISSING,
            available_count=0,
            missing_count=missing_count,
            invalid_count=invalid_count,
            not_applicable_count=na_count,
            total_count=total_count,
            flags=flags,
        )

    satisfying = sum(1 for v in valid_nums if evaluate_operator(v, op, expected))
    pct = round(satisfying / available_count, 4)
    return AggregatedSignal(
        criterion=criterion,
        value=pct,
        status=SignalState.PRESENT,
        available_count=available_count,
        missing_count=missing_count,
        invalid_count=invalid_count,
        not_applicable_count=na_count,
        total_count=total_count,
        flags=flags,
    )


def aggregate_team_signal(
    criterion: str,
    signals: List[SignalValue],
    agg_type: AggregationType = AggregationType.AVERAGE,
    missing_policy: MissingDataPolicy = MissingDataPolicy.IGNORE,
    allow_flagged: bool = False,
) -> AggregatedSignal:
    """Dispatches to the chosen aggregation strategy.

    Raises ValueError for unsupported aggregation types instead of silently
    falling back to AVERAGE.
    """
    if agg_type == AggregationType.AVERAGE:
        return aggregate_average(criterion, signals, missing_policy, allow_flagged=allow_flagged)
    elif agg_type == AggregationType.SUM:
        return aggregate_sum(criterion, signals, missing_policy, allow_flagged=allow_flagged)
    elif agg_type == AggregationType.MAX:
        return aggregate_max(criterion, signals, missing_policy, allow_flagged=allow_flagged)
    elif agg_type == AggregationType.MIN:
        return aggregate_min(criterion, signals, missing_policy, allow_flagged=allow_flagged)
    elif agg_type == AggregationType.PERCENTAGE:
        raise ValueError(
            f"Criterion '{criterion}' specified PERCENTAGE aggregation. "
            "PERCENTAGE requires conditional rule evaluation (scope=MEMBER with operator and threshold), "
            "and cannot be used as an unconditional numeric scoring aggregation."
        )
    else:
        raise ValueError(
            f"Unsupported aggregation type '{agg_type}' for criterion '{criterion}'. "
            "Expected one of: AVERAGE, SUM, MAX, MIN."
        )

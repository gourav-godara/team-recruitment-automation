from typing import List, Optional
from backend.app.schemas.scoring import (
    AggregationType,
    EligibilityResult,
    MissingDataPolicy,
    RuleConfig,
    RuleOperator,
    RuleResult,
    RuleScope,
    RuleStatus,
    SignalState,
    SignalValue,
    Team,
)
from backend.app.services.team_aggregation import (
    aggregate_all,
    aggregate_any,
    aggregate_percentage,
    aggregate_team_signal,
    evaluate_operator,
)


def evaluate_single_rule(team: Team, rule: RuleConfig) -> RuleResult:
    """Evaluates a single rule against a team or its members with three-valued

    logic and explicit separation of MISSING vs INVALID vs NOT_APPLICABLE.
    """
    # 1. Handle TEAM scope
    if rule.scope == RuleScope.TEAM:
        signal = team.team_signals.get(rule.field)
        if signal is None or signal.status == SignalState.MISSING or signal.value is None:
            if rule.missing_policy == MissingDataPolicy.REQUIRE:
                return RuleResult(
                    rule_name=rule.name,
                    status=RuleStatus.FAIL,
                    reason=f"Required team field '{rule.field}' is missing",
                    field=rule.field,
                    evaluated_value=None,
                    missing_count=1,
                    total_count=1,
                )
            elif rule.missing_policy == MissingDataPolicy.FLAG:
                return RuleResult(
                    rule_name=rule.name,
                    status=RuleStatus.FLAGGED,
                    reason=f"Team field '{rule.field}' is missing (flagged for review)",
                    field=rule.field,
                    evaluated_value=None,
                    missing_count=1,
                    total_count=1,
                )
            return RuleResult(
                rule_name=rule.name,
                status=RuleStatus.INSUFFICIENT_DATA,
                reason=f"Team field '{rule.field}' is missing",
                field=rule.field,
                evaluated_value=None,
                missing_count=1,
                total_count=1,
            )

        if signal.status == SignalState.INVALID:
            return RuleResult(
                rule_name=rule.name,
                status=RuleStatus.FAIL if rule.missing_policy == MissingDataPolicy.REQUIRE else RuleStatus.FLAGGED,
                reason=f"Team field '{rule.field}' is invalid: {signal.reason or 'Validation failure'}",
                field=rule.field,
                evaluated_value=None,
                invalid_count=1,
                total_count=1,
            )

        passed = evaluate_operator(signal.value, rule.operator, rule.value)
        status = RuleStatus.PASS if passed else RuleStatus.FAIL
        reason = (
            f"Team field '{rule.field}' satisfies condition ({signal.value} {rule.operator.value} {rule.value})"
            if passed
            else f"Team field '{rule.field}' does not satisfy condition ({signal.value} {rule.operator.value} {rule.value})"
        )
        return RuleResult(
            rule_name=rule.name,
            status=status,
            reason=reason,
            field=rule.field,
            evaluated_value=signal.value,
            available_count=1,
            total_count=1,
        )

    # 2. Handle MEMBER scope
    member_signals: List[SignalValue] = []
    for m in team.members:
        sig = m.signals.get(rule.field)
        if sig is None:
            sig = SignalValue(value=None, status=SignalState.MISSING)
        member_signals.append(sig)

    total_members = len(member_signals)
    agg_method = (rule.aggregation or "ANY").upper()

    if agg_method == "ANY":
        raw_status, reason, avail, missing, invalid, na = aggregate_any(member_signals, rule.operator, rule.value)
        if raw_status == RuleStatus.INSUFFICIENT_DATA:
            if rule.missing_policy == MissingDataPolicy.REQUIRE:
                raw_status = RuleStatus.FAIL
                reason = f"Required field '{rule.field}' incomplete ({missing} missing, {invalid} invalid) and no member satisfied threshold"
            elif rule.missing_policy == MissingDataPolicy.FLAG:
                raw_status = RuleStatus.FLAGGED
                reason = f"Field '{rule.field}' has incomplete member data and no verified pass"
        return RuleResult(
            rule_name=rule.name,
            status=raw_status,
            reason=reason,
            field=rule.field,
            evaluated_value=None,
            available_count=avail,
            missing_count=missing,
            invalid_count=invalid,
            not_applicable_count=na,
            total_count=total_members,
        )

    elif agg_method == "ALL":
        raw_status, reason, avail, missing, invalid, na = aggregate_all(member_signals, rule.operator, rule.value)
        if raw_status == RuleStatus.INSUFFICIENT_DATA:
            if rule.missing_policy == MissingDataPolicy.REQUIRE:
                raw_status = RuleStatus.FAIL
                reason = f"Required field '{rule.field}' cannot verify all members ({missing} missing, {invalid} invalid)"
            elif rule.missing_policy == MissingDataPolicy.FLAG:
                raw_status = RuleStatus.FLAGGED
                reason = f"Field '{rule.field}' has incomplete data preventing complete verification"
        return RuleResult(
            rule_name=rule.name,
            status=raw_status,
            reason=reason,
            field=rule.field,
            evaluated_value=None,
            available_count=avail,
            missing_count=missing,
            invalid_count=invalid,
            not_applicable_count=na,
            total_count=total_members,
        )

    elif agg_method == "PERCENTAGE":
        agg_sig = aggregate_percentage(rule.field, member_signals, rule.operator, rule.value)
        if agg_sig.value is None:
            return RuleResult(
                rule_name=rule.name,
                status=RuleStatus.INSUFFICIENT_DATA,
                reason=f"No valid data to calculate percentage for '{rule.field}'",
                field=rule.field,
                evaluated_value=None,
                missing_count=agg_sig.missing_count,
                invalid_count=agg_sig.invalid_count,
                not_applicable_count=agg_sig.not_applicable_count,
                total_count=total_members,
            )
        target_pct = rule.threshold if rule.threshold is not None else 0.5
        passed = agg_sig.value >= target_pct
        status = RuleStatus.PASS if passed else RuleStatus.FAIL
        reason = (
            f"{int(agg_sig.value * 100)}% of members satisfy condition (required >= {int(target_pct * 100)}%)"
            if passed
            else f"Only {int(agg_sig.value * 100)}% of members satisfy condition (required >= {int(target_pct * 100)}%)"
        )
        return RuleResult(
            rule_name=rule.name,
            status=status,
            reason=reason,
            field=rule.field,
            evaluated_value=agg_sig.value,
            available_count=agg_sig.available_count,
            missing_count=agg_sig.missing_count,
            invalid_count=agg_sig.invalid_count,
            not_applicable_count=agg_sig.not_applicable_count,
            total_count=total_members,
        )

    else:
        # Numeric aggregations: AVERAGE, SUM, MAX, MIN
        try:
            agg_type = AggregationType(agg_method)
        except ValueError:
            raise ValueError(f"Unknown aggregation method '{agg_method}' for rule '{rule.name}'")

        agg_sig = aggregate_team_signal(rule.field, member_signals, agg_type, rule.missing_policy)
        if agg_sig.value is None:
            return RuleResult(
                rule_name=rule.name,
                status=RuleStatus.INSUFFICIENT_DATA,
                reason=f"Insufficient valid data to evaluate {agg_method} on '{rule.field}'",
                field=rule.field,
                evaluated_value=None,
                missing_count=agg_sig.missing_count,
                invalid_count=agg_sig.invalid_count,
                not_applicable_count=agg_sig.not_applicable_count,
                total_count=total_members,
            )

        passed = evaluate_operator(agg_sig.value, rule.operator, rule.value)
        status = RuleStatus.PASS if passed else RuleStatus.FAIL
        reason = (
            f"Team {agg_method} for '{rule.field}' is {agg_sig.value} (satisfies {rule.operator.value} {rule.value})"
            if passed
            else f"Team {agg_method} for '{rule.field}' is {agg_sig.value} (fails {rule.operator.value} {rule.value})"
        )
        return RuleResult(
            rule_name=rule.name,
            status=status,
            reason=reason,
            field=rule.field,
            evaluated_value=agg_sig.value,
            available_count=agg_sig.available_count,
            missing_count=agg_sig.missing_count,
            invalid_count=agg_sig.invalid_count,
            not_applicable_count=agg_sig.not_applicable_count,
            total_count=total_members,
        )


def evaluate_eligibility(team: Team, rules: List[RuleConfig]) -> EligibilityResult:
    """Evaluates all eligibility rules for a team."""
    if not rules:
        return EligibilityResult(
            status=RuleStatus.PASS,
            passed_rules=[],
            failed_rules=[],
            insufficient_rules=[],
            flagged_rules=[],
            summary="No eligibility rules specified; default PASS",
        )

    passed: List[RuleResult] = []
    failed: List[RuleResult] = []
    insufficient: List[RuleResult] = []
    flagged: List[RuleResult] = []

    for rule in rules:
        res = evaluate_single_rule(team, rule)
        if res.status == RuleStatus.PASS:
            passed.append(res)
        elif res.status == RuleStatus.FAIL:
            failed.append(res)
        elif res.status == RuleStatus.INSUFFICIENT_DATA:
            insufficient.append(res)
        elif res.status == RuleStatus.FLAGGED:
            flagged.append(res)

    # Determine overall status
    if failed:
        overall_status = RuleStatus.FAIL
        summary = f"Failed {len(failed)} eligibility rule(s)"
    elif insufficient:
        overall_status = RuleStatus.INSUFFICIENT_DATA
        summary = f"{len(insufficient)} rule(s) could not be determined due to insufficient/missing/invalid data"
    elif flagged:
        overall_status = RuleStatus.FLAGGED
        summary = f"{len(flagged)} rule(s) require manual review"
    else:
        overall_status = RuleStatus.PASS
        summary = f"Passed all {len(passed)} eligibility rule(s)"

    return EligibilityResult(
        status=overall_status,
        passed_rules=passed,
        failed_rules=failed,
        insufficient_rules=insufficient,
        flagged_rules=flagged,
        summary=summary,
    )

from typing import Dict, List, Optional, Tuple
from backend.app.schemas.scoring import (
    AggregationType,
    CriterionDetail,
    MissingDataPolicy,
    ScoringConfig,
    SignalState,
    SignalValue,
    Team,
)
from backend.app.services.team_aggregation import aggregate_team_signal


def calculate_team_score(
    team: Team,
    config: ScoringConfig,
) -> Tuple[
    Optional[float],
    Dict[str, Optional[float]],
    Dict[str, SignalState],
    List[CriterionDetail],
    List[str],
    List[str],
]:
    """Calculates weighted score on a standardized [0, 100] scale.

    Fairness Guarantee:
    Missing data is not penalized as zero. Available criteria are normalized
    against the sum of available weights:
      effective_weight = configured_weight / sum(available_weights)
      contribution = measured_value * effective_weight
      final_score = sum(contributions)

    Returns:
    - final_score: Optional[float] (None if all criteria are missing or required criteria missing)
    - score_breakdown: Dict[str, Optional[float]]
    - criterion_states: Dict[str, SignalState]
    - detailed_contributions: List[CriterionDetail]
    - missing_notes: List[str]
    - flags: List[str]
    """
    weights = config.weights
    breakdown: Dict[str, Optional[float]] = {}
    states: Dict[str, SignalState] = {}
    notes_per_criterion: Dict[str, str] = {}
    missing_notes: List[str] = []
    flags: List[str] = []

    available_weights_sum = 0.0
    weighted_points_sum = 0.0

    for criterion, weight in weights.items():
        agg_type = config.criteria_aggregation.get(criterion, AggregationType.AVERAGE)
        missing_policy = config.criteria_missing_policies.get(criterion, config.missing_policy)

        # Collect member signals
        member_signals: List[SignalValue] = []
        for m in team.members:
            sig = m.signals.get(criterion)
            if sig is None:
                sig = SignalValue(value=None, status=SignalState.MISSING)
            member_signals.append(sig)

        # Fallback to team level signal if team has no members
        if not member_signals and criterion in team.team_signals:
            sig = team.team_signals[criterion]
            member_signals = [sig]

        agg_sig = aggregate_team_signal(
            criterion,
            member_signals,
            agg_type,
            missing_policy,
            allow_flagged=config.allow_flagged_in_scoring,
        )
        states[criterion] = agg_sig.status
        flags.extend(agg_sig.flags)

        if agg_sig.status in (SignalState.PRESENT, SignalState.FLAGGED) and agg_sig.value is not None:
            breakdown[criterion] = agg_sig.value
            weighted_points_sum += agg_sig.value * weight
            available_weights_sum += weight

            if agg_sig.missing_count > 0:
                note = f"Score based on {agg_sig.available_count} of {agg_sig.total_count} members; {agg_sig.missing_count} missing was not penalized as zero."
                notes_per_criterion[criterion] = note
                missing_notes.append(f"{criterion}: {note}")
        else:
            breakdown[criterion] = None
            if agg_sig.status == SignalState.INVALID:
                note = f"Invalid data detected for {agg_sig.invalid_count} member(s)."
                flags.append(f"{criterion}: contains invalid data")
            elif agg_sig.status == SignalState.FLAGGED:
                note = "Flagged/unverified signal excluded from automatic scoring."
                flags.append(f"{criterion}: unverified signal excluded from scoring")
            else:
                note = f"Criterion data is missing ({agg_sig.missing_count} of {agg_sig.total_count} members)."
                missing_notes.append(f"{criterion}: criterion data is completely missing")

            notes_per_criterion[criterion] = note

            if missing_policy == MissingDataPolicy.REQUIRE:
                flags.append(f"Required criterion '{criterion}' is missing")

    # If all criteria are missing or available weight is 0
    if available_weights_sum == 0.0:
        details: List[CriterionDetail] = []
        for criterion, weight in weights.items():
            details.append(
                CriterionDetail(
                    criterion=criterion,
                    measured_value=None,
                    configured_weight=round(weight, 4),
                    effective_weight=0.0,
                    contribution=None,
                    status=states.get(criterion, SignalState.MISSING),
                    note=notes_per_criterion.get(criterion),
                )
            )
        return None, breakdown, states, details, missing_notes, flags

    # Check if any REQUIRE policy failed
    has_failed_required = False
    for criterion in weights.keys():
        policy = config.criteria_missing_policies.get(criterion, config.missing_policy)
        if policy == MissingDataPolicy.REQUIRE and breakdown.get(criterion) is None:
            has_failed_required = True
            break

    if has_failed_required:
        details = []
        for criterion, weight in weights.items():
            details.append(
                CriterionDetail(
                    criterion=criterion,
                    measured_value=breakdown.get(criterion),
                    configured_weight=round(weight, 4),
                    effective_weight=0.0,
                    contribution=None,
                    status=states.get(criterion, SignalState.MISSING),
                    note=notes_per_criterion.get(criterion),
                )
            )
        return None, breakdown, states, details, missing_notes, flags

    # Calculate normalized final score and detailed contributions
    final_score = round(weighted_points_sum / available_weights_sum, 4)

    details = []
    for criterion, weight in weights.items():
        val = breakdown.get(criterion)
        if val is not None:
            effective_wt = round(weight / available_weights_sum, 4)
            contrib = round(val * effective_wt, 4)
        else:
            effective_wt = 0.0
            contrib = None

        details.append(
            CriterionDetail(
                criterion=criterion,
                measured_value=val,
                configured_weight=round(weight, 4),
                effective_weight=effective_wt,
                contribution=contrib,
                status=states.get(criterion, SignalState.PRESENT),
                note=notes_per_criterion.get(criterion),
            )
        )

    return final_score, breakdown, states, details, missing_notes, flags

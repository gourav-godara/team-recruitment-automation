from typing import Dict, List, Optional
from backend.app.schemas.scoring import (
    CriterionDetail,
    EligibilityResult,
    RuleStatus,
    ScoringConfig,
    SignalState,
)


def generate_team_explanations(
    team_id: str,
    score: Optional[float],
    score_breakdown: Dict[str, Optional[float]],
    criterion_states: Dict[str, SignalState],
    detailed_contributions: List[CriterionDetail],
    eligibility: EligibilityResult,
    missing_notes: List[str],
    flags: List[str],
    config: ScoringConfig,
) -> List[str]:
    """Generates structured, mathematically sound, fact-grounded explanatory

    reasons for a team's evaluation result.
    """
    reasons: List[str] = []

    # 1. Eligibility reasons
    if eligibility.status == RuleStatus.FAIL:
        for failed_r in eligibility.failed_rules:
            reasons.append(f"Eligibility rule failure: '{failed_r.rule_name}' - {failed_r.reason}")
        return reasons

    if eligibility.status == RuleStatus.INSUFFICIENT_DATA:
        for in_r in eligibility.insufficient_rules:
            reasons.append(f"Eligibility verification incomplete: '{in_r.rule_name}' - {in_r.reason}")
        reasons.append("Insufficient data to complete eligibility evaluation")
        return reasons

    if eligibility.passed_rules:
        reasons.append(f"Passed all {len(eligibility.passed_rules)} configured eligibility requirements")

    # 2. Scoring reasons
    if score is None:
        reasons.append("Score could not be calculated because no valid scoring criteria were available")
        return reasons

    reasons.append(f"Overall Team Score: {score:.2f} / 100")

    # Transparent per-criterion breakdown exposing configured weight, effective weight, and contribution
    for detail in detailed_contributions:
        c_label = detail.criterion.replace("_", " ").title()
        if detail.measured_value is not None and detail.contribution is not None:
            reasons.append(
                f"{c_label}: score {detail.measured_value:.1f}/100 | configured weight {detail.configured_weight * 100:.0f}% "
                f"| effective weight {detail.effective_weight * 100:.1f}% | contribution {detail.contribution:.2f} pts"
            )
        elif detail.status == SignalState.MISSING:
            reasons.append(
                f"{c_label}: data missing | configured weight {detail.configured_weight * 100:.0f}% "
                f"| effective weight 0% (not penalized as zero)"
            )
        elif detail.status == SignalState.INVALID:
            reasons.append(
                f"{c_label}: invalid data detected | excluded from scoring calculation"
            )
        elif detail.status == SignalState.FLAGGED:
            reasons.append(
                f"{c_label}: unverified/flagged signal | excluded from automatic scoring"
            )

    # 3. Transparent missing data notes consumed directly from aggregation
    for note in missing_notes:
        reasons.append(f"Data Completeness Notice: {note}")

    # 4. Review notices and audit flags
    for f in flags:
        reasons.append(f"Audit Notice: {f}")

    return reasons

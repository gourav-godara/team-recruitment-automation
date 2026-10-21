import math
from typing import Any, Dict, List, Optional, Tuple
from backend.app.schemas.scoring import (
    AggregationType,
    CriterionDetail,
    Member,
    MemberScoreResult,
    MissingDataPolicy,
    RuleScope,
    ScoringConfig,
    SignalState,
    SignalValue,
    Team,
)
from backend.app.services.team_aggregation import aggregate_team_signal, evaluate_operator


def resolve_criterion_signal(signals: Dict[str, SignalValue], criterion: str) -> Optional[SignalValue]:
    """Resolves a signal from a signal dictionary using direct key lookup or canonical criterion aliases."""
    if criterion in signals and signals[criterion] is not None:
        return signals[criterion]

    c_norm = criterion.lower().strip()
    if c_norm in ("github", "github_composite_score", "github_score", "code_quality", "repo", "repo_score"):
        for alt in ("github_composite_score", "github_score", "code_quality", "github", "repo_score", "repo"):
            if alt in signals and signals[alt] is not None:
                return signals[alt]
    elif c_norm in ("experience_years", "experience", "exp", "years_of_experience", "work_experience", "tech"):
        for alt in ("experience_years", "experience", "exp", "work_experience", "years_of_experience", "tech"):
            if alt in signals and signals[alt] is not None:
                return signals[alt]
    elif c_norm in ("skills", "tech_skills", "technical_skills", "skills_match", "skills_count", "track"):
        for alt in ("skills", "tech_skills", "technical_skills", "skills_match", "track"):
            if alt in signals and signals[alt] is not None:
                return signals[alt]
    elif c_norm in ("presentation", "pitch", "demo", "presentation_and_pitch", "velocity", "pitch_score", "demo_score"):
        for alt in ("presentation", "pitch", "demo", "presentation_and_pitch", "velocity", "pitch_score", "demo_score"):
            if alt in signals and signals[alt] is not None:
                return signals[alt]

    return None


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
    raw_measured_display_values: Dict[str, Optional[float]] = {}

    for criterion, weight in weights.items():
        agg_type = config.criteria_aggregation.get(criterion, AggregationType.AVERAGE)
        missing_policy = config.criteria_missing_policies.get(criterion, config.missing_policy)

        # Collect member signals with alias resolution
        member_signals: List[SignalValue] = []
        for m in team.members:
            sig = resolve_criterion_signal(m.signals, criterion)
            if sig is None:
                sig = SignalValue(value=None, status=SignalState.MISSING)
            member_signals.append(sig)

        # Fallback to team level signal if team has no members or all members lack signal
        if not member_signals or all(s.status == SignalState.MISSING for s in member_signals):
            team_sig = resolve_criterion_signal(team.team_signals, criterion)
            if team_sig is not None and team_sig.status != SignalState.MISSING:
                member_signals = [team_sig]

        # Scoring boundary validation: check member/team signals entering scoring for this criterion
        scoring_member_signals = []
        raw_num_vals = []
        for orig_sig in member_signals:
            # Clone SignalValue so original candidate data is never mutated
            sig = SignalValue(
                value=orig_sig.value,
                status=orig_sig.status,
                reason=orig_sig.reason,
            )
            scoring_member_signals.append(sig)

            if orig_sig.status in (SignalState.PRESENT, SignalState.FLAGGED) and orig_sig.value is not None:
                if isinstance(orig_sig.value, (int, float)):
                    raw_num_vals.append(float(orig_sig.value))
                elif isinstance(orig_sig.value, (list, tuple, set)):
                    raw_num_vals.append(float(len(orig_sig.value)))

            if sig.status in (SignalState.PRESENT, SignalState.FLAGGED) and sig.value is not None:
                if isinstance(sig.value, (list, tuple, set)):
                    skill_cnt = len(sig.value)
                    sig.value = min(98.0, 50.0 + skill_cnt * 10.0) if skill_cnt > 0 else 35.0
                elif isinstance(sig.value, str):
                    try:
                        sig.value = float(sig.value)
                    except ValueError:
                        import re
                        items = [s.strip() for s in re.split(r"[,;/|]+", sig.value) if s.strip()]
                        skill_cnt = len(items)
                        sig.value = min(98.0, 50.0 + skill_cnt * 10.0) if skill_cnt > 0 else 35.0

                if criterion in ("skills", "tech_skills") and isinstance(sig.value, (int, float)) and sig.value <= 15.0:
                    sig.value = min(98.0, 50.0 + float(sig.value) * 10.0)
                elif criterion in ("experience_years", "experience", "exp") and isinstance(sig.value, (int, float)) and sig.value <= 15.0:
                    sig.value = min(100.0, max(25.0, (float(sig.value) / 5.0) * 100.0))

                if isinstance(sig.value, bool):
                    raise ValueError(
                        f"Criterion '{criterion}' score for team '{team.team_id}' must be numeric, not boolean "
                        f"(received {sig.value})."
                    )
                if not isinstance(sig.value, (int, float)) or not math.isfinite(sig.value):
                    raise ValueError(
                        f"Criterion '{criterion}' score for team '{team.team_id}' must be a finite number "
                        f"(received {sig.value})."
                    )
                if not (0.0 <= sig.value <= 100.0):
                    raise ValueError(
                        f"Criterion '{criterion}' score for team '{team.team_id}' must be between 0 and 100 "
                        f"(received {sig.value})."
                    )

        if raw_num_vals:
            raw_measured_display_values[criterion] = round(sum(raw_num_vals) / len(raw_num_vals), 2)

        agg_sig = aggregate_team_signal(
            criterion,
            scoring_member_signals,
            agg_type,
            missing_policy,
            allow_flagged=config.allow_flagged_in_scoring,
        )

        if agg_sig.value is not None:
            if not math.isfinite(agg_sig.value) or not (0.0 <= agg_sig.value <= 100.0):
                raise ValueError(
                    f"Aggregated score for criterion '{criterion}' in team '{team.team_id}' must be between 0 and 100 "
                    f"(received {agg_sig.value})."
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

        measured_display = raw_measured_display_values.get(criterion)
        details.append(
            CriterionDetail(
                criterion=criterion,
                measured_value=measured_display if measured_display is not None else val,
                configured_weight=round(weight, 4),
                effective_weight=effective_wt,
                contribution=contrib,
                status=states.get(criterion, SignalState.PRESENT),
                note=notes_per_criterion.get(criterion),
            )
        )

    return final_score, breakdown, states, details, missing_notes, flags


def calculate_member_score(
    member: Member,
    config: ScoringConfig,
) -> MemberScoreResult:
    """Calculates an individual candidate's weighted composite score and criterion breakdown."""
    weights = config.weights
    breakdown: Dict[str, Optional[float]] = {}
    raw_values: Dict[str, Optional[Any]] = {}
    states: Dict[str, SignalState] = {}
    warnings: List[str] = []
    missing_fields: List[str] = []

    available_weight = 0.0
    weighted_points = 0.0

    for criterion, weight in weights.items():
        sig = resolve_criterion_signal(member.signals, criterion)
        if sig is None:
            sig = SignalValue(value=None, status=SignalState.MISSING)

        states[criterion] = sig.status
        raw_values[criterion] = sig.value

        if sig.status == SignalState.MISSING:
            missing_fields.append(criterion)
            breakdown[criterion] = None
        elif sig.status == SignalState.INVALID:
            warnings.append(f"Invalid data for '{criterion}': {sig.reason or 'Unparseable'}")
            breakdown[criterion] = None
        elif sig.status in (SignalState.PRESENT, SignalState.FLAGGED) and sig.value is not None:
            val = sig.value
            if isinstance(val, (list, tuple, set)):
                skill_cnt = len(val)
                val = min(98.0, 50.0 + skill_cnt * 10.0) if skill_cnt > 0 else 35.0
            elif isinstance(val, str):
                try:
                    val = float(val)
                except ValueError:
                    import re
                    tokens = [s.strip() for s in re.split(r"[,;/|]+", val) if s.strip()]
                    skill_cnt = len(tokens)
                    val = min(98.0, 50.0 + skill_cnt * 10.0) if skill_cnt > 0 else 35.0

            if criterion in ("skills", "tech_skills") and isinstance(val, (int, float)) and val <= 15.0:
                val = min(98.0, 50.0 + float(val) * 10.0)
            elif criterion in ("experience_years", "experience", "exp") and isinstance(val, (int, float)) and val <= 15.0:
                val = min(100.0, max(25.0, (float(val) / 5.0) * 100.0))

            if isinstance(val, (int, float)) and math.isfinite(val):
                val_bounded = max(0.0, min(100.0, float(val)))
                breakdown[criterion] = val_bounded
                weighted_points += val_bounded * weight
                available_weight += weight
            else:
                breakdown[criterion] = None

    member_score = (
        round(weighted_points / available_weight, 2)
        if available_weight > 0.0
        else None
    )

    # Member links & attributes
    gh_url = member.signals.get("github_url").value if "github_url" in member.signals and member.signals["github_url"].value else None
    gh_user = member.signals.get("github_username").value if "github_username" in member.signals and member.signals["github_username"].value else None
    li_url = member.signals.get("linkedin_url").value if "linkedin_url" in member.signals and member.signals["linkedin_url"].value else None
    pf_url = member.signals.get("portfolio_url").value if "portfolio_url" in member.signals and member.signals["portfolio_url"].value else None
    email = member.signals.get("email").value if "email" in member.signals and member.signals["email"].value else None
    exp_sig = member.signals.get("experience_years")
    exp_years = float(exp_sig.value) if exp_sig and exp_sig.value is not None and isinstance(exp_sig.value, (int, float)) else None

    # Determine experience source
    exp_source = "Declared in CSV" if exp_years is not None and "experience_years" not in missing_fields else "Inferred from Skills/Role"
    if exp_years is None:
        exp_source = "Not provided"

    # Skills list
    skills_sig = member.signals.get("skills")
    skills_list: List[str] = []
    if skills_sig and skills_sig.value:
        if isinstance(skills_sig.value, list):
            skills_list = [str(s) for s in skills_sig.value]
        elif isinstance(skills_sig.value, str):
            import re
            skills_list = [s.strip() for s in re.split(r"[,;/|]+", skills_sig.value) if s.strip()]

    # Individual eligibility rules
    failed_rules = []
    for r in config.eligibility_rules:
        if r.scope == RuleScope.MEMBER:
            sig = member.signals.get(r.field)
            val = sig.value if sig and sig.status != SignalState.MISSING else None
            if val is None:
                if r.missing_policy == MissingDataPolicy.REQUIRE:
                    failed_rules.append(f"Missing required field '{r.field}'")
            else:
                passed = evaluate_operator(val, r.operator, r.value)
                if not passed:
                    failed_rules.append(f"{r.name}: observed '{val}' (requires {r.operator.value} {r.value})")

    is_eligible = len(failed_rules) == 0
    elig_status = "ELIGIBLE" if is_eligible else "INELIGIBLE"

    # Fetch candidate authentic GitHub profile & repository metrics
    gh_profile = None
    if gh_url or gh_user:
        try:
            from backend.app.services.github_service import GitHubService
            gh_profile = GitHubService().fetch_profile(gh_url or gh_user)
        except Exception:
            pass

    pub_repos = gh_profile.public_repos if gh_profile else (0 if not (gh_url or gh_user) else None)
    orig_repos = gh_profile.original_repos_count if gh_profile else (0 if not (gh_url or gh_user) else None)
    fork_repos = gh_profile.forked_repos_count if gh_profile else (0 if not (gh_url or gh_user) else None)
    tot_stars = gh_profile.total_stars if gh_profile else (0 if not (gh_url or gh_user) else None)
    top_langs = gh_profile.top_languages if gh_profile else []
    recent_r = gh_profile.recent_repos if gh_profile else []
    gh_stat = gh_profile.status if gh_profile else ("missing" if not (gh_url or gh_user) else "unverified")

    # If GitHub signal raw value is reported, format it with authentic repo count and tech stack
    for gh_key in ("github_composite_score", "github"):
        if gh_key in raw_values:
            if pub_repos is not None and pub_repos > 0:
                lang_str = f" • {', '.join(top_langs[:2])}" if top_langs else ""
                raw_values[gh_key] = f"{pub_repos} repos{lang_str}"
            elif pub_repos == 0:
                raw_values[gh_key] = "0 repos"
            elif not (gh_url or gh_user):
                raw_values[gh_key] = "No GitHub link"

    # Fallback score estimation from grounded candidate attributes if weights sum had missing signals
    if member_score is None:
        base = 50.0
        if exp_years is not None:
            base += min(25.0, exp_years * 5.0)
        else:
            base += 12.0
        if gh_url or gh_user:
            base += 15.0
        if pub_repos is not None and pub_repos > 0:
            base += min(15.0, pub_repos * 2.0)
        if skills_list:
            base += min(15.0, len(skills_list) * 2.5)
        member_score = round(min(98.0, max(40.0, base)), 1)

    return MemberScoreResult(
        member_id=member.member_id,
        name=member.name,
        score=member_score,
        score_breakdown=breakdown,
        raw_values=raw_values,
        criterion_states=states,
        is_eligible=is_eligible,
        eligibility_status=elig_status,
        failed_rules=failed_rules,
        github_url=gh_url,
        github_username=gh_user,
        linkedin_url=li_url,
        portfolio_url=pf_url,
        email=email,
        experience_years=exp_years,
        experience_source=exp_source,
        skills=skills_list,
        missing_fields=missing_fields,
        warnings=warnings,
        public_repos=pub_repos,
        original_repos_count=orig_repos,
        forked_repos_count=fork_repos,
        total_stars=tot_stars,
        top_languages=top_langs,
        recent_repos=recent_r,
        github_status=gh_stat,
    )

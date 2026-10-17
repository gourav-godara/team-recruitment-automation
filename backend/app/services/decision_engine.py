import hashlib
import json
from typing import Any, List
from backend.app.schemas.rules import RuleOutcome
from backend.app.schemas.scoring import (
    ENGINE_VERSION,
    RuleStatus,
    ScoringConfig,
    ScoringEvaluationRequest,
    ScoringEvaluationResponse,
    Team,
    TeamScoreResult,
)
from backend.app.services.eligibility_engine import evaluate_eligibility
from backend.app.services.explanation_engine import generate_team_explanations
from backend.app.services.ranking_engine import rank_teams
from backend.app.services.rule_engine import ConfigurableRuleEngine
from backend.app.services.scoring_engine import calculate_team_score


def compute_canonical_hash(data: Any) -> str:
    """Computes a deterministic, canonical SHA-256 hash for JSON data.

    Uses sorted keys and uniform separators (',', ':') to guarantee byte-for-byte
    reproducibility across runs and environments.
    """
    serialized = json.dumps(data, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def evaluate_teams_pipeline(
    teams: List[Team],
    config: ScoringConfig,
) -> ScoringEvaluationResponse:
    """Executes the complete deterministic decision engine pipeline:

    1. Eligibility Hard Filters
    2. Weighted Scoring (with effective weight normalization)
    3. Grounded Explanation Generation
    4. Deterministic Ranking & Top-X Cutoff
    5. Reproducibility metadata generation
    """
    # 0. Check for duplicate team IDs
    seen_ids = set()
    duplicates = []
    for t in teams:
        if t.team_id in seen_ids:
            duplicates.append(t.team_id)
        seen_ids.add(t.team_id)
    if duplicates:
        sorted_dups = sorted(list(set(duplicates)))
        raise ValueError(
            f"Duplicate team_id(s) detected in evaluation request: {sorted_dups}. "
            "Each team must have a unique team_id."
        )

    # 1. Canonical hashes for auditability & reproducibility
    dataset_repr = [t.model_dump(mode="json") for t in teams]
    config_repr = config.model_dump(mode="json")
    dataset_hash = compute_canonical_hash(dataset_repr)
    config_hash = compute_canonical_hash(config_repr)

    # Deterministic run_id based on dataset + config hashes + engine version
    combined_hash = hashlib.sha256(
        f"{dataset_hash}_{config_hash}_{ENGINE_VERSION}".encode("utf-8")
    ).hexdigest()
    run_id = f"run_{combined_hash[:16]}"

    # 2. Evaluate each team
    evaluated_results: List[TeamScoreResult] = []

    for team in teams:
        # Step A: Eligibility
        eligibility = evaluate_eligibility(team, config.eligibility_rules)
        rule_summary = None
        if config.configurable_rules:
            rule_summary = ConfigurableRuleEngine.evaluate_team(team, config.configurable_rules)

        # Step B: Determine Eligibility Status
        is_rejected = (
            eligibility.status == RuleStatus.FAIL
            or (rule_summary is not None and (not rule_summary.is_eligible or rule_summary.status == RuleOutcome.FAIL))
        )
        is_manual_review = (
            rule_summary is not None
            and (rule_summary.requires_manual_review or rule_summary.status == RuleOutcome.UNKNOWN)
        )
        is_insufficient = eligibility.status == RuleStatus.INSUFFICIENT_DATA

        # Step C: Scoring
        if is_rejected:
            score = None
            breakdown = {}
            states = {}
            details = []
            missing_notes = []
            flags = []
            status = "REJECTED"
            if rule_summary and rule_summary.failed_rules:
                for f in rule_summary.failed_rules:
                    flags.append(f"Eligibility Rule Failure ({f.rule_name}): {f.explanation}")
        else:
            score, breakdown, states, details, missing_notes, flags = calculate_team_score(team, config)
            if is_manual_review:
                status = "MANUAL_REVIEW"
                if rule_summary:
                    for u in rule_summary.unknown_rules:
                        flags.append(f"Manual Review Required ({u.rule_name}): {u.explanation}")
            elif score is None or is_insufficient:
                status = "INSUFFICIENT_DATA"
            else:
                status = "ELIGIBLE"

        # Step D: Grounded explanations with transparent contribution metrics
        reasons = generate_team_explanations(
            team_id=team.team_id,
            score=score,
            score_breakdown=breakdown,
            criterion_states=states,
            detailed_contributions=details,
            eligibility=eligibility,
            missing_notes=missing_notes,
            flags=flags,
            config=config,
        )
        if rule_summary:
            if is_rejected:
                reasons.insert(0, f"Team Ineligible: {rule_summary.summary}")
            elif is_manual_review:
                reasons.insert(0, f"Team Requires Manual Review: {rule_summary.summary}")
            elif rule_summary.status == RuleOutcome.PASS and rule_summary.summary:
                reasons.append(f"Rule Compliance: {rule_summary.summary}")

        team_res = TeamScoreResult(
            team_id=team.team_id,
            name=team.name,
            score=score,
            rank=None,
            status=status,
            eligibility=eligibility,
            rule_summary=rule_summary,
            score_breakdown=breakdown,
            criterion_states=states,
            detailed_contributions=details,
            reasons=reasons,
            missing_data=missing_notes,
            flags=flags,
        )
        evaluated_results.append(team_res)

    # 3. Deterministic Ranking and Top X selection
    ranked_results = rank_teams(evaluated_results, config)

    # 4. Summary counts
    total_teams = len(ranked_results)
    shortlisted_teams = sum(1 for r in ranked_results if r.status == "SHORTLISTED")
    eligible_teams = sum(1 for r in ranked_results if r.status in ("SHORTLISTED", "ELIGIBLE"))
    rejected_teams = sum(1 for r in ranked_results if r.status == "REJECTED")

    return ScoringEvaluationResponse(
        run_id=run_id,
        dataset_hash=dataset_hash,
        config_hash=config_hash,
        engine_version=ENGINE_VERSION,
        total_teams=total_teams,
        eligible_teams=eligible_teams,
        shortlisted_teams=shortlisted_teams,
        rejected_teams=rejected_teams,
        results=ranked_results,
        config=config,
    )

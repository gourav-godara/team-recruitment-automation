import hashlib
import json
from typing import Any, List
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

        # Step B: Scoring
        if eligibility.status == RuleStatus.FAIL:
            score = None
            breakdown = {}
            states = {}
            details = []
            missing_notes = []
            flags = []
            status = "REJECTED"
        else:
            score, breakdown, states, details, missing_notes, flags = calculate_team_score(team, config)
            if score is None:
                status = "INSUFFICIENT_DATA"
            elif eligibility.status == RuleStatus.INSUFFICIENT_DATA:
                status = "INSUFFICIENT_DATA"
            else:
                status = "ELIGIBLE"

        # Step C: Grounded explanations with transparent contribution metrics
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

        team_res = TeamScoreResult(
            team_id=team.team_id,
            name=team.name,
            score=score,
            rank=None,
            status=status,
            eligibility=eligibility,
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

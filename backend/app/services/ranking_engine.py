from typing import Any, List, Optional, Tuple
from backend.app.schemas.scoring import (
    RuleStatus,
    ScoringConfig,
    TeamScoreResult,
)


def sort_key_for_team(
    result: TeamScoreResult,
    tie_breakers: List[str],
) -> Tuple[Any, ...]:
    """Generates a deterministic tuple sort key for eligible teams.

    Primary score sorts descending (highest score first). Configured
    tie-breaker criteria sort descending. Fallback team_id sorts ascending for
    stable deterministic resolution.
    """
    key_parts: List[Any] = []

    # 1. Primary score (descending)
    primary_score = result.score if result.score is not None else 0.0
    key_parts.append(-primary_score)

    # 2. Configured tie breakers
    for tb in tie_breakers:
        if tb == "primary_score":
            continue
        elif tb == "team_id":
            key_parts.append(result.team_id)
        else:
            crit_val = result.score_breakdown.get(tb)
            c_score = crit_val if crit_val is not None else 0.0
            key_parts.append(-c_score)

    # 3. Always include team_id as ultimate deterministic tie-breaker
    if "team_id" not in tie_breakers:
        key_parts.append(result.team_id)

    return tuple(key_parts)


def rank_teams(
    results: List[TeamScoreResult],
    config: ScoringConfig,
) -> List[TeamScoreResult]:
    """Applies deterministic sorting, tie-breaking, rank assignment, and top_x

    selection to a list of evaluated teams. Ineligible/rejected teams are
    preserved.
    """
    eligible_teams: List[TeamScoreResult] = []
    ineligible_teams: List[TeamScoreResult] = []
    insufficient_teams: List[TeamScoreResult] = []

    for r in results:
        if r.eligibility.status == RuleStatus.FAIL:
            r.status = "REJECTED"
            ineligible_teams.append(r)
        elif r.eligibility.status == RuleStatus.INSUFFICIENT_DATA:
            r.status = "INSUFFICIENT_DATA"
            insufficient_teams.append(r)
        elif r.score is None:
            r.status = "INSUFFICIENT_DATA"
            insufficient_teams.append(r)
        else:
            eligible_teams.append(r)

    # Deterministic sort for eligible scored teams
    tie_breakers = config.tie_breakers or ["primary_score", "team_id"]
    eligible_teams.sort(key=lambda t: sort_key_for_team(t, tie_breakers))

    # Assign ranks and top_x status
    top_x = config.top_x
    for idx, team_res in enumerate(eligible_teams, start=1):
        team_res.rank = idx
        if top_x is not None:
            if idx <= top_x:
                team_res.status = "SHORTLISTED"
            else:
                team_res.status = "ELIGIBLE"
        else:
            team_res.status = "SHORTLISTED"

    # Ineligible and insufficient data teams are kept visible
    all_results = eligible_teams + insufficient_teams + ineligible_teams
    return all_results

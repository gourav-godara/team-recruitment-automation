"""Service for Pairwise Head-to-Head Comparison between two candidate teams."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.scoring import ScoringEvaluationResponse, TeamScoreResult
from backend.app.services.evaluation_service import EvaluationService


class CriterionHeadToHead(BaseModel):
    criterion: str
    team_a_score: Optional[float] = None
    team_b_score: Optional[float] = None
    delta: Optional[float] = None  # team_a - team_b
    winner: Optional[str] = None  # "team_a", "team_b", or "tie"


class PairwiseComparisonResponse(BaseModel):
    run_id: str
    team_a_id: str
    team_a_name: str
    team_a_rank: Optional[int] = None
    team_a_score: Optional[float] = None
    team_a_status: str

    team_b_id: str
    team_b_name: str
    team_b_rank: Optional[int] = None
    team_b_score: Optional[float] = None
    team_b_status: str

    overall_winner: Optional[str] = None
    score_delta: Optional[float] = None  # team_a_score - team_b_score
    criteria_comparison: List[CriterionHeadToHead] = Field(default_factory=list)
    summary: str


class ComparisonService:
    """Provides side-by-side head-to-head comparative analysis between teams."""

    @classmethod
    def compare_teams(
        cls,
        db: Any,
        run_id: str,
        team_a_id: str,
        team_b_id: str,
    ) -> Optional[PairwiseComparisonResponse]:
        """Compares two teams in a saved evaluation run."""
        saved_run: Optional[ScoringEvaluationResponse] = EvaluationService.get_saved_evaluation(db, run_id)
        if not saved_run:
            return None

        lookup = {r.team_id: r for r in saved_run.results}
        res_a = lookup.get(team_a_id)
        res_b = lookup.get(team_b_id)

        if not res_a or not res_b:
            return None

        score_a = res_a.score
        score_b = res_b.score
        score_delta = round(score_a - score_b, 2) if (score_a is not None and score_b is not None) else None

        overall_winner = None
        if score_delta is not None:
            if score_delta > 0:
                overall_winner = team_a_id
            elif score_delta < 0:
                overall_winner = team_b_id
            else:
                overall_winner = "tie"

        # Compare per-criterion breakdown
        all_criteria = sorted(list(set(res_a.score_breakdown.keys()) | set(res_b.score_breakdown.keys())))
        crit_comps: List[CriterionHeadToHead] = []

        team_a_wins = 0
        team_b_wins = 0

        for c in all_criteria:
            val_a = res_a.score_breakdown.get(c)
            val_b = res_b.score_breakdown.get(c)
            c_delta = round(val_a - val_b, 2) if (val_a is not None and val_b is not None) else None

            winner = None
            if c_delta is not None:
                if c_delta > 0:
                    winner = team_a_id
                    team_a_wins += 1
                elif c_delta < 0:
                    winner = team_b_id
                    team_b_wins += 1
                else:
                    winner = "tie"

            crit_comps.append(
                CriterionHeadToHead(
                    criterion=c,
                    team_a_score=val_a,
                    team_b_score=val_b,
                    delta=c_delta,
                    winner=winner,
                )
            )

        name_a = res_a.name or team_a_id
        name_b = res_b.name or team_b_id

        if overall_winner == team_a_id:
            summary = f"{name_a} leads by +{score_delta} pts overall (leads in {team_a_wins}/{len(all_criteria)} criteria)."
        elif overall_winner == team_b_id:
            summary = f"{name_b} leads by +{abs(score_delta or 0.0)} pts overall (leads in {team_b_wins}/{len(all_criteria)} criteria)."
        else:
            summary = f"{name_a} and {name_b} are tied with equal scores."

        return PairwiseComparisonResponse(
            run_id=run_id,
            team_a_id=team_a_id,
            team_a_name=name_a,
            team_a_rank=res_a.rank,
            team_a_score=score_a,
            team_a_status=res_a.status,
            team_b_id=team_b_id,
            team_b_name=name_b,
            team_b_rank=res_b.rank,
            team_b_score=score_b,
            team_b_status=res_b.status,
            overall_winner=overall_winner,
            score_delta=score_delta,
            criteria_comparison=crit_comps,
            summary=summary,
        )

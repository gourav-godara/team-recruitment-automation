"""Sensitivity Analysis ('What-If') Engine for simulating config and rule adjustments."""

from typing import Any, Dict, List, Optional, Set, Union

from backend.app.models.entities import Run, Team as DBTeam
from backend.app.schemas.sensitivity import SensitivityComparison, TeamSensitivityDelta
from backend.app.schemas.scoring import (
    ScoringConfig,
    ScoringEvaluationResponse,
    Team,
    TeamScoreResult,
)
from backend.app.services.decision_engine import evaluate_teams_pipeline


class SensitivityService:
    """Calculates sensitivity impact, rank deltas, and shortlist turnover between configurations."""

    @classmethod
    def compare_evaluations(
        cls,
        base_resp: ScoringEvaluationResponse,
        new_resp: ScoringEvaluationResponse,
    ) -> SensitivityComparison:
        """Compares two evaluated responses to produce an actionable sensitivity report."""
        base_lookup: Dict[str, TeamScoreResult] = {r.team_id: r for r in base_resp.results}
        new_lookup: Dict[str, TeamScoreResult] = {r.team_id: r for r in new_resp.results}

        all_team_ids = list(base_lookup.keys())
        # Preserve order from new ranking where possible
        for r in new_resp.results:
            if r.team_id not in all_team_ids:
                all_team_ids.append(r.team_id)

        team_deltas: List[TeamSensitivityDelta] = []
        newly_shortlisted: List[str] = []
        dropped_from_shortlist: List[str] = []

        for tid in all_team_ids:
            b_res = base_lookup.get(tid)
            n_res = new_lookup.get(tid)

            b_score = b_res.score if b_res else None
            n_score = n_res.score if n_res else None
            score_delta = (
                round(n_score - b_score, 4)
                if (b_score is not None and n_score is not None)
                else None
            )

            b_rank = b_res.rank if b_res else None
            n_rank = n_res.rank if n_res else None
            rank_delta = (
                (b_rank - n_rank)
                if (b_rank is not None and n_rank is not None)
                else None
            )

            b_status = b_res.status if b_res else "NOT_FOUND"
            n_status = n_res.status if n_res else "NOT_FOUND"

            if b_status != "SHORTLISTED" and n_status == "SHORTLISTED":
                status_change = "NEWLY_SHORTLISTED"
                newly_shortlisted.append(tid)
            elif b_status == "SHORTLISTED" and n_status != "SHORTLISTED":
                status_change = "DROPPED_FROM_SHORTLIST"
                dropped_from_shortlist.append(tid)
            elif b_status == n_status:
                status_change = "UNCHANGED"
            else:
                status_change = "STATUS_CHANGED"

            name = (n_res.name if n_res else None) or (b_res.name if b_res else None) or tid

            team_deltas.append(
                TeamSensitivityDelta(
                    team_id=tid,
                    team_name=name,
                    base_score=b_score,
                    new_score=n_score,
                    score_delta=score_delta,
                    base_rank=b_rank,
                    new_rank=n_rank,
                    rank_delta=rank_delta,
                    base_status=b_status,
                    new_status=n_status,
                    status_change=status_change,
                )
            )

        # Weight deltas
        base_weights = base_resp.config.weights
        new_weights = new_resp.config.weights
        all_criteria: Set[str] = set(base_weights.keys()).union(set(new_weights.keys()))
        weight_deltas: Dict[str, float] = {}
        for c in sorted(all_criteria):
            bw = base_weights.get(c, 0.0)
            nw = new_weights.get(c, 0.0)
            weight_deltas[c] = round(nw - bw, 4)

        shortlist_size = base_resp.shortlisted_teams or new_resp.shortlisted_teams or 1
        turnover_count = len(newly_shortlisted)
        turnover_rate = round((turnover_count / max(shortlist_size, 1)) * 100.0, 1)

        # Gainers & Decliners
        scored_deltas = [td for td in team_deltas if td.rank_delta is not None]
        gainers = sorted([td for td in scored_deltas if td.rank_delta > 0], key=lambda x: x.rank_delta, reverse=True)[:3]
        decliners = sorted([td for td in scored_deltas if td.rank_delta < 0], key=lambda x: x.rank_delta)[:3]

        # Natural language summary
        summary_lines = []
        if turnover_count == 0:
            summary_lines.append(f"Rankings are highly stable: 0% turnover in the shortlist ({shortlist_size} teams).")
        else:
            summary_lines.append(
                f"Configuration change caused {turnover_count} team(s) ({turnover_rate}% turnover) to shift in/out of the shortlist."
            )
        if newly_shortlisted:
            summary_lines.append(f"Newly shortlisted: {', '.join(newly_shortlisted)}.")
        if dropped_from_shortlist:
            summary_lines.append(f"Dropped from shortlist: {', '.join(dropped_from_shortlist)}.")
        if gainers:
            top_g = gainers[0]
            summary_lines.append(f"Biggest gainer: {top_g.team_id} (+{top_g.rank_delta} positions).")

        return SensitivityComparison(
            base_run_id=base_resp.run_id,
            total_teams=len(all_team_ids),
            shortlist_size=shortlist_size,
            turnover_count=turnover_count,
            turnover_rate=turnover_rate,
            newly_shortlisted=newly_shortlisted,
            dropped_from_shortlist=dropped_from_shortlist,
            biggest_gainers=gainers,
            biggest_decliners=decliners,
            team_deltas=team_deltas,
            weight_deltas=weight_deltas,
            summary=" ".join(summary_lines),
        )

    @classmethod
    def simulate_what_if(
        cls,
        teams: List[Team],
        base_config: ScoringConfig,
        new_config: ScoringConfig,
    ) -> SensitivityComparison:
        """Executes both configurations against candidate teams and computes sensitivity analysis."""
        base_resp = evaluate_teams_pipeline(teams, base_config)
        new_resp = evaluate_teams_pipeline(teams, new_config)
        return cls.compare_evaluations(base_resp, new_resp)

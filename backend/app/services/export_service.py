"""Service for exporting evaluation results into standardized RFC 4180 CSV formats."""

import csv
import io
from typing import Any, List, Optional

from backend.app.schemas.scoring import ScoringEvaluationResponse
from backend.app.services.evaluation_service import EvaluationService


class ExportService:
    """Handles CSV export generation for evaluation runs."""

    @classmethod
    def export_evaluation_run_to_csv(cls, db: Any, run_id: str) -> Optional[str]:
        """Generates a CSV string representing the saved evaluation results for run_id.

        Does NOT recalculate scores; exports persisted data directly.
        Returns None if run_id does not exist.
        """
        saved_run: Optional[ScoringEvaluationResponse] = EvaluationService.get_saved_evaluation(db, run_id)
        if not saved_run:
            return None

        # Collect all unique criteria keys from score breakdowns
        all_criteria = []
        seen_criteria = set()
        for res in saved_run.results:
            for c_name in res.score_breakdown.keys():
                if c_name not in seen_criteria:
                    seen_criteria.add(c_name)
                    all_criteria.append(c_name)

        output = io.StringIO()
        writer = csv.writer(output, lineterminator="\r\n")

        # Define CSV headers
        headers = [
            "Rank",
            "Team ID",
            "Team Name",
            "Status",
            "Eligibility",
            "Final Score",
            "Shortlisted",
        ]
        for c in all_criteria:
            headers.append(f"Score: {c}")
        headers.append("Explanation / Rejection Reasons")

        writer.writerow(headers)

        # Write rows
        for res in saved_run.results:
            rank_str = str(res.rank) if res.rank is not None else ""
            score_str = f"{res.score:.2f}" if res.score is not None else ""
            elig_str = res.eligibility.status.value if hasattr(res.eligibility.status, "value") else str(res.eligibility.status)
            shortlist_str = "Yes" if res.status == "SHORTLISTED" else "No"

            row = [
                rank_str,
                res.team_id,
                res.name or res.team_id,
                res.status,
                elig_str,
                score_str,
                shortlist_str,
            ]

            # Criterion breakdown columns
            for c in all_criteria:
                val = res.score_breakdown.get(c)
                if val is not None:
                    row.append(f"{val:.2f}")
                else:
                    state = res.criterion_states.get(c)
                    row.append(state.value if hasattr(state, "value") else (state or ""))

            # Explanations
            reasons_combined = "; ".join(res.reasons) if res.reasons else ""
            row.append(reasons_combined)

            writer.writerow(row)

        return output.getvalue()

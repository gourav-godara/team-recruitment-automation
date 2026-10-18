"""Service for exporting evaluation results into standardized RFC 4180 CSV formats."""

import csv
import io
from typing import Any, List, Optional

from backend.app.schemas.scoring import ScoringEvaluationResponse
from backend.app.services.evaluation_service import EvaluationService


import json
import zipfile


class ExportService:
    """Handles CSV, JSON, and ZIP export generation for evaluation runs."""

    @classmethod
    def export_evaluation_run_to_csv(cls, db: Any, run_id: str) -> Optional[str]:
        """Backward-compatible alias for full audit CSV export."""
        return cls.export_full_audit_to_csv(db, run_id)

    @classmethod
    def export_shortlist_to_csv(cls, db: Any, run_id: str) -> Optional[str]:
        """Generates an RFC 4180 CSV containing only officially shortlisted teams."""
        saved_run: Optional[ScoringEvaluationResponse] = EvaluationService.get_saved_evaluation(db, run_id)
        if not saved_run:
            return None

        output = io.StringIO()
        writer = csv.writer(output, lineterminator="\r\n")
        writer.writerow(["Rank", "Team ID", "Team Name", "Final Score", "Score Breakdown", "Shortlist Justification"])

        for res in saved_run.results:
            if res.status == "SHORTLISTED":
                breakdown_parts = [
                    f"{k}: {v:.1f}" for k, v in res.score_breakdown.items() if v is not None
                ]
                breakdown_str = " | ".join(breakdown_parts)
                justification = f"Ranked #{res.rank} with score {res.score:.2f}/100. Met all eligibility criteria."
                writer.writerow([
                    res.rank,
                    res.team_id,
                    res.name or res.team_id,
                    f"{res.score:.2f}" if res.score is not None else "",
                    breakdown_str,
                    justification,
                ])

        return output.getvalue()

    @classmethod
    def export_full_audit_to_csv(cls, db: Any, run_id: str) -> Optional[str]:
        """Generates a comprehensive CSV representing all evaluated teams, breakdowns, and failure reasons."""
        saved_run: Optional[ScoringEvaluationResponse] = EvaluationService.get_saved_evaluation(db, run_id)
        if not saved_run:
            return None

        all_criteria = []
        seen_criteria = set()
        for res in saved_run.results:
            for c_name in res.score_breakdown.keys():
                if c_name not in seen_criteria:
                    seen_criteria.add(c_name)
                    all_criteria.append(c_name)

        output = io.StringIO()
        writer = csv.writer(output, lineterminator="\r\n")

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

            for c in all_criteria:
                val = res.score_breakdown.get(c)
                if val is not None:
                    row.append(f"{val:.2f}")
                else:
                    state = res.criterion_states.get(c)
                    row.append(state.value if hasattr(state, "value") else (state or ""))

            reasons_combined = "; ".join(res.reasons) if res.reasons else ""
            row.append(reasons_combined)

            writer.writerow(row)

        return output.getvalue()

    @classmethod
    def export_configuration_snapshot_json(cls, db: Any, run_id: str) -> Optional[str]:
        """Generates a formatted JSON audit configuration snapshot with cryptographic hashes."""
        saved_run: Optional[ScoringEvaluationResponse] = EvaluationService.get_saved_evaluation(db, run_id)
        if not saved_run:
            return None

        snapshot_payload = {
            "run_id": saved_run.run_id,
            "engine_version": saved_run.engine_version,
            "dataset_hash": saved_run.dataset_hash,
            "config_hash": saved_run.config_hash,
            "total_teams": saved_run.total_teams,
            "eligible_teams": saved_run.eligible_teams,
            "shortlisted_teams": saved_run.shortlisted_teams,
            "rejected_teams": saved_run.rejected_teams,
            "config": saved_run.config.model_dump(mode="json") if saved_run.config else {},
        }
        return json.dumps(snapshot_payload, indent=2)

    @classmethod
    def export_complete_bundle_zip(cls, db: Any, run_id: str) -> Optional[bytes]:
        """Bundles the shortlist CSV, full audit CSV, and config snapshot JSON into an in-memory ZIP archive."""
        shortlist_csv = cls.export_shortlist_to_csv(db, run_id)
        if shortlist_csv is None:
            return None

        full_audit_csv = cls.export_full_audit_to_csv(db, run_id) or ""
        config_json = cls.export_configuration_snapshot_json(db, run_id) or "{}"

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(f"shortlist_top_x_{run_id}.csv", shortlist_csv)
            zf.writestr(f"full_evaluation_audit_{run_id}.csv", full_audit_csv)
            zf.writestr(f"run_configuration_snapshot_{run_id}.json", config_json)

        return zip_buffer.getvalue()


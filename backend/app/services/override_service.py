"""Override and Audit Trail service managing manual recruiter interventions.

Directly integrates with PostgreSQL tables:
- overrides (with 'uq_run_team_override' and trigger 'trg_audit_overrides')
- audit_log
- run_results
- runs
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
import uuid

from backend.app.models.entities import (
    AuditLog,
    Override,
    Run,
    RunResult,
    Team,
)
from backend.app.schemas.scoring import (
    LeaderboardItemResponse,
)


class OverrideService:
    """Manages reviewer overrides and audit trail logs with strict transactional integrity."""

    @classmethod
    def apply_override(
        cls,
        db: Any,
        run_id: Union[int, str],
        team_id_or_code: Union[int, str],
        action: str,
        reason: str,
        user_id: Optional[Union[uuid.UUID, str]] = None,
    ) -> Dict[str, Any]:
        """Applies a manual reviewer override ('pin', 'exclude', 'waitlist') to a team in an evaluation run,

        updating the run_results outcome and recording the intervention in audit_log.
        """
        run_id_int = int(run_id)
        run = db.query(Run).get(run_id_int)
        if not run:
            raise ValueError(f"Evaluation run '{run_id}' not found.")

        # Resolve team by integer ID or external_id
        team = None
        if isinstance(team_id_or_code, int) or (isinstance(team_id_or_code, str) and team_id_or_code.isdigit()):
            team = db.query(Team).get(int(team_id_or_code))

        if not team:
            team = db.query(Team).filter_by(dataset_id=run.dataset_id, external_id=str(team_id_or_code)).first()

        if not team:
            raise ValueError(f"Team '{team_id_or_code}' not found in dataset '{run.dataset_id}'.")

        # Find RunResult for this team
        run_result = db.query(RunResult).filter_by(run_id=run_id_int, team_id=team.id).first()
        if not run_result:
            raise ValueError(f"Team '{team.external_id}' was not evaluated in run '{run_id}'.")

        # Normalize action
        action_clean = action.strip().lower()
        if action_clean not in ("pin", "exclude", "waitlist"):
            raise ValueError(f"Invalid override action '{action}'. Must be 'pin', 'exclude', or 'waitlist'.")

        user_uuid = None
        if user_id:
            user_uuid = user_id if isinstance(user_id, uuid.UUID) else uuid.UUID(str(user_id))

        # Check existing override for (run_id, team_id)
        existing_override = db.query(Override).filter_by(run_id=run_id_int, team_id=team.id).first()
        old_action = existing_override.action if existing_override else None

        if existing_override:
            old_values = {
                "action": existing_override.action,
                "reason": existing_override.reason,
                "created_by": str(existing_override.created_by) if existing_override.created_by else None,
            }
            existing_override.action = action_clean
            existing_override.reason = reason
            existing_override.created_at = datetime.now(timezone.utc)
            existing_override.created_by = user_uuid
            override_record = existing_override
            audit_action = "update"
        else:
            old_values = None
            override_record = Override(
                run_id=run_id_int,
                team_id=team.id,
                action=action_clean,
                reason=reason,
                created_at=datetime.now(timezone.utc),
                created_by=user_uuid,
            )
            db.add(override_record)
            audit_action = "insert"

        if hasattr(db, "flush"):
            db.flush()

        # Update run_results outcome based on override action
        if action_clean == "pin":
            run_result.outcome = "shortlisted"
            run_result.is_eligible = True
            run_result.reason = f"Manual override (PIN): {reason}"
        elif action_clean == "exclude":
            run_result.outcome = "excluded"
            run_result.is_eligible = False
            run_result.reason = f"Manual override (EXCLUDE): {reason}"
        elif action_clean == "waitlist":
            run_result.outcome = "waitlisted"
            run_result.reason = f"Manual override (WAITLIST): {reason}"

        # Recalculate shortlisted count on Run
        all_results = db.query(RunResult).filter_by(run_id=run_id_int).all()
        run.teams_shortlisted = sum(1 for r in all_results if r.outcome == "shortlisted")

        # For in-memory / non-trigger sessions, record explicitly in AuditLog
        new_values = {
            "run_id": run_id_int,
            "team_id": team.id,
            "action": action_clean,
            "reason": reason,
            "created_by": str(user_uuid) if user_uuid else None,
        }
        audit_entry = AuditLog(
            table_name="overrides",
            record_id=override_record.id,
            action=audit_action,
            old_values=old_values,
            new_values=new_values,
            changed_at=datetime.now(timezone.utc),
            changed_by=user_uuid,
        )
        db.add(audit_entry)

        return {
            "id": override_record.id,
            "run_id": run_id_int,
            "team_id": team.id,
            "team_code": team.external_id,
            "team_name": team.team_name,
            "action": action_clean,
            "reason": reason,
            "outcome": run_result.outcome,
            "created_at": override_record.created_at,
            "created_by": str(user_uuid) if user_uuid else None,
        }

    @classmethod
    def get_run_overrides(cls, db: Any, run_id: Union[int, str]) -> List[Dict[str, Any]]:
        """Retrieves all reviewer overrides for a given evaluation run."""
        run_id_int = int(run_id)
        overrides = db.query(Override).filter_by(run_id=run_id_int).all()

        results = []
        for o in overrides:
            team = db.query(Team).get(o.team_id)
            run_result = db.query(RunResult).filter_by(run_id=o.run_id, team_id=o.team_id).first()
            results.append(
                {
                    "id": o.id,
                    "run_id": o.run_id,
                    "team_id": o.team_id,
                    "team_code": team.external_id if team else f"T{o.team_id}",
                    "team_name": team.team_name if team else f"Team {o.team_id}",
                    "action": o.action,
                    "reason": o.reason,
                    "outcome": run_result.outcome if run_result else o.action,
                    "created_at": o.created_at,
                    "created_by": str(o.created_by) if o.created_by else None,
                }
            )
        return results

    @classmethod
    def get_run_audit_trail(cls, db: Any, run_id: Union[int, str]) -> List[Dict[str, Any]]:
        """Retrieves the chronological audit history for changes made to an evaluation run."""
        run_id_int = int(run_id)
        logs = db.query(AuditLog).all()

        # Filter logs relating to this run or overrides on this run
        run_overrides = db.query(Override).filter_by(run_id=run_id_int).all()
        override_ids = {o.id for o in run_overrides if o.id is not None}

        trail = []
        for l in logs:
            is_relevant = False
            if l.table_name == "runs" and l.record_id == run_id_int:
                is_relevant = True
            elif l.table_name == "overrides":
                if l.record_id in override_ids:
                    is_relevant = True
                elif l.new_values and l.new_values.get("run_id") == run_id_int:
                    is_relevant = True
                elif l.old_values and l.old_values.get("run_id") == run_id_int:
                    is_relevant = True

            if is_relevant:
                trail.append(
                    {
                        "id": l.id,
                        "table_name": l.table_name,
                        "record_id": l.record_id,
                        "action": l.action,
                        "old_values": l.old_values,
                        "new_values": l.new_values,
                        "changed_at": l.changed_at or datetime.now(timezone.utc),
                        "changed_by": str(l.changed_by) if l.changed_by else None,
                    }
                )

        trail.sort(key=lambda x: x["changed_at"] if x["changed_at"] else datetime.min.replace(tzinfo=timezone.utc))
        return trail

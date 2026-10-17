"""Evaluation service coordinating Core Decision Engine execution and persistence into Sushmita's schema.

Persists into PostgreSQL tables:
- runs
- run_results
- run_score_details
- run_rule_results
- audit_log
"""

from datetime import datetime, timezone
import hashlib
import json
from typing import Any, Dict, List, Optional, Union

from schemas.team import TeamData

from backend.app.models.entities import (
    AuditLog,
    Criterion,
    Run,
    RunResult,
    RunRuleResult,
    RunScoreDetail,
    Team,
)
from backend.app.schemas.scoring import (
    CriterionDetail,
    EligibilityResult,
    RuleResult,
    RuleStatus,
    ScoringConfig,
    ScoringEvaluationResponse,
    SignalState,
    Team as EngineTeam,
    TeamScoreResult,
)
from backend.app.services.config_service import ConfigService
from backend.app.services.decision_engine import evaluate_teams_pipeline
from backend.app.services.import_adapter import adapt_team_data_list


class EvaluationService:
    """Coordinates team evaluation, decision engine invocation, and full PostgreSQL audit persistence."""

    @classmethod
    def evaluate_and_persist(
        cls,
        db: Any,
        teams: List[TeamData],
        config: ScoringConfig,
        dataset_id: Union[int, str],
        config_id: Optional[Union[int, str]] = None,
    ) -> ScoringEvaluationResponse:
        """Executes the Core Decision Engine pipeline and persists the evaluation run and results into runs,
        run_results, run_score_details, and run_rule_results.
        """
        # 1. Adapt TeamData into engine Team entities
        engine_teams: List[EngineTeam] = adapt_team_data_list(teams)

        # 2. Execute deterministic Core Decision Engine
        response: ScoringEvaluationResponse = evaluate_teams_pipeline(
            teams=engine_teams,
            config=config,
        )

        # 3. Retrieve or auto-save Config record in 'configs'
        cfg_record = None
        if config_id is not None:
            cfg_record = ConfigService.get_config_model_by_id(db, config_id)

        if not cfg_record:
            cfg_record = ConfigService.save_config(
                db=db,
                config=config,
                name=f"Config for run {response.run_id[:8]}",
            )
            if hasattr(db, "flush"):
                db.flush()

        # Build team lookup: external_id -> database integer team.id
        team_id_map: Dict[str, int] = {}
        for t in teams:
            db_id = t.metadata.get("db_team_id")
            if db_id is not None:
                team_id_map[str(t.id)] = int(db_id)
            else:
                # Query database for team matching this dataset and external_id
                t_row = db.query(Team).filter_by(dataset_id=int(dataset_id), external_id=str(t.id)).first()
                if t_row:
                    team_id_map[str(t.id)] = t_row.id

        # 4. Create Run record in 'runs'
        # Note: 'top_x' has check constraint (top_x > 0). If config.top_x is None, default to total teams or 1.
        top_x_val = config.top_x if config.top_x and config.top_x > 0 else max(len(teams), 1)

        config_snapshot_payload = {
            "config": config.model_dump(mode="json"),
            "config_hash": response.config_hash,
            "dataset_hash": response.dataset_hash,
            "engine_version": response.engine_version,
            "engine_run_id": response.run_id,
        }

        run_row = Run(
            dataset_id=int(dataset_id),
            config_id=cfg_record.id,
            config_snapshot=config_snapshot_payload,
            top_x=top_x_val,
            teams_total=response.total_teams,
            teams_shortlisted=response.shortlisted_teams,
            result_hash=hashlib.sha256(
                json.dumps(
                    [{"id": r.team_id, "score": r.score, "rank": r.rank} for r in response.results],
                    sort_keys=True,
                ).encode("utf-8")
            ).hexdigest(),
            run_at=datetime.now(timezone.utc),
        )
        db.add(run_row)

        if hasattr(db, "flush"):
            db.flush()

        # 5. Persist team results in 'run_results', 'run_score_details', 'run_rule_results'
        for res in response.results:
            db_team_id = team_id_map.get(str(res.team_id))
            if db_team_id is None:
                # Fallback to int conversion or 0
                try:
                    db_team_id = int(res.team_id)
                except ValueError:
                    db_team_id = 0

            is_eligible = res.eligibility.status == RuleStatus.PASS

            # Outcome check constraint: 'shortlisted', 'waitlisted', 'rejected', 'ineligible', 'excluded'
            if res.status == "SHORTLISTED":
                outcome = "shortlisted"
            elif is_eligible:
                outcome = "waitlisted"
            else:
                outcome = "ineligible"

            result_row = RunResult(
                run_id=run_row.id,
                team_id=db_team_id,
                is_eligible=is_eligible,
                total_score=float(res.score) if res.score is not None else None,
                rank=res.rank,
                outcome=outcome,
                reason="; ".join(res.reasons) if res.reasons else None,
                has_missing_data=bool(res.missing_data),
                tie_break_note=None,
            )
            db.add(result_row)

            # Persist per-criterion score details in 'run_score_details'
            for cd in res.detailed_contributions:
                # Ensure criterion exists in 'criteria'
                crit = db.query(Criterion).filter_by(key=cd.criterion).first()
                if not crit:
                    db.add(
                        Criterion(
                            key=cd.criterion,
                            label=cd.criterion.replace("_", " ").title(),
                            source="scoring_engine",
                            value_type="number",
                        )
                    )

                # data_status: 'ok', 'partial', 'missing'
                if cd.status == SignalState.MISSING:
                    d_status = "missing"
                elif cd.status in (SignalState.INVALID, SignalState.FLAGGED):
                    d_status = "partial"
                else:
                    d_status = "ok"

                score_detail = RunScoreDetail(
                    run_id=run_row.id,
                    team_id=db_team_id,
                    criterion_key=cd.criterion,
                    team_raw_value=str(cd.measured_value) if cd.measured_value is not None else None,
                    normalized_value=float(cd.measured_value) if cd.measured_value is not None else None,
                    weight=float(cd.configured_weight),
                    weighted_score=float(cd.contribution) if cd.contribution is not None else None,
                    data_status=d_status,
                    members_with_data=1,
                    members_total=1,
                    explanation=cd.note,
                )
                db.add(score_detail)

            # Persist rule evaluations in 'run_rule_results'
            all_rule_results = res.eligibility.passed_rules + res.eligibility.failed_rules
            for rr in all_rule_results:
                rule_row = RunRuleResult(
                    run_id=run_row.id,
                    team_id=db_team_id,
                    rule_name=rr.rule_name,
                    passed=(rr.status == RuleStatus.PASS),
                    details=rr.reason or "",
                )
                db.add(rule_row)

        # 6. Audit log entry
        audit = AuditLog(
            table_name="runs",
            record_id=run_row.id,
            action="insert",
            new_values={
                "run_id": run_row.id,
                "dataset_id": run_row.dataset_id,
                "teams_total": run_row.teams_total,
                "teams_shortlisted": run_row.teams_shortlisted,
                "result_hash": run_row.result_hash,
            },
        )
        db.add(audit)

        # Update the run_id in the response to the integer run ID (as string) for frontend consistency
        response.run_id = str(run_row.id)
        return response

    @classmethod
    def get_saved_evaluation(
        cls,
        db: Any,
        run_id: Union[int, str],
    ) -> Optional[ScoringEvaluationResponse]:
        """Retrieves a previously executed evaluation run without recalculating scores."""
        try:
            int_run_id = int(run_id)
            run = db.query(Run).filter_by(id=int_run_id).first()
        except ValueError:
            run = db.query(Run).filter_by(id=run_id).first()

        if not run:
            return None

        # Retrieve saved run_results
        result_rows = db.query(RunResult).filter_by(run_id=run.id).all()

        # Sort: ranked items ascending, unranked items at the end
        def rank_key(rr):
            return (0 if rr.rank is not None else 1, rr.rank if rr.rank is not None else 0, rr.team_id)

        sorted_rows = sorted(result_rows, key=rank_key)

        reconstructed_results: List[TeamScoreResult] = []
        for rr in sorted_rows:
            # Query team to obtain external_id and team_name
            team_row = db.query(Team).filter_by(id=rr.team_id).first()
            team_external_id = team_row.external_id if team_row else str(rr.team_id)
            team_name = team_row.team_name if team_row else f"Team {team_external_id}"

            # Query criteria score details for this team
            score_details = (
                db.query(RunScoreDetail)
                .filter_by(run_id=run.id, team_id=rr.team_id)
                .all()
            )

            score_breakdown: Dict[str, Optional[float]] = {}
            criterion_states: Dict[str, SignalState] = {}
            detailed_contributions: List[CriterionDetail] = []

            for sd in score_details:
                score_breakdown[sd.criterion_key] = sd.normalized_value
                state = SignalState.MISSING if sd.data_status == "missing" else SignalState.PRESENT
                criterion_states[sd.criterion_key] = state
                detailed_contributions.append(
                    CriterionDetail(
                        criterion=sd.criterion_key,
                        measured_value=sd.normalized_value,
                        configured_weight=sd.weight,
                        effective_weight=sd.weight,
                        contribution=sd.weighted_score,
                        status=state,
                        note=sd.explanation,
                    )
                )

            # Query rule results
            rule_rows = (
                db.query(RunRuleResult)
                .filter_by(run_id=run.id, team_id=rr.team_id)
                .all()
            )
            passed_rules = [
                RuleResult(rule_name=r.rule_name, status=RuleStatus.PASS, field="rule", reason=r.details)
                for r in rule_rows
                if r.passed
            ]
            failed_rules = [
                RuleResult(rule_name=r.rule_name, status=RuleStatus.FAIL, field="rule", reason=r.details)
                for r in rule_rows
                if not r.passed
            ]

            elig_status = RuleStatus.PASS if rr.is_eligible else RuleStatus.FAIL
            status_str = "SHORTLISTED" if rr.outcome == "shortlisted" else ("ELIGIBLE" if rr.is_eligible else "REJECTED")

            reconstructed_results.append(
                TeamScoreResult(
                    team_id=team_external_id,
                    name=team_name,
                    score=rr.total_score,
                    rank=rr.rank,
                    status=status_str,
                    eligibility=EligibilityResult(
                        status=elig_status,
                        passed_rules=passed_rules,
                        failed_rules=failed_rules,
                    ),
                    score_breakdown=score_breakdown,
                    criterion_states=criterion_states,
                    detailed_contributions=detailed_contributions,
                    reasons=[rr.reason] if rr.reason else [],
                    missing_data=[],
                )
            )

        # Retrieve snapshot metadata
        snapshot = run.config_snapshot or {}
        config_data = snapshot.get("config", {})
        if config_data:
            config = ScoringConfig(**config_data)
        else:
            config = ConfigService.get_config_by_id(db, run.config_id) or ScoringConfig(weights={"fallback": 1.0})

        eligible_count = sum(1 for r in reconstructed_results if r.eligibility.status == RuleStatus.PASS)
        rejected_count = run.teams_total - eligible_count

        return ScoringEvaluationResponse(
            run_id=str(run.id),
            dataset_hash=snapshot.get("dataset_hash", run.result_hash or ""),
            config_hash=snapshot.get("config_hash", ""),
            engine_version=snapshot.get("engine_version", "2.0.0"),
            total_teams=run.teams_total,
            eligible_teams=eligible_count,
            shortlisted_teams=run.teams_shortlisted,
            rejected_teams=rejected_count,
            results=reconstructed_results,
            config=config,
        )

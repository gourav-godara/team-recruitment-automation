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
    Dataset,
    LeaderboardView,
    Run,
    RunResult,
    RunRuleResult,
    RunScoreDetail,
    Team,
)
from backend.app.schemas.rules import RuleOutcome
from backend.app.schemas.scoring import (
    CriterionDetail,
    EligibilityResult,
    LeaderboardItemResponse,
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
        session_id: Optional[str] = None,
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
            session_id=session_id,
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

        # Track existing criteria keys to avoid duplicate inserts
        seen_criteria = set()
        if hasattr(db, "query"):
            try:
                for row in db.query(Criterion.key).all():
                    seen_criteria.add(row[0] if isinstance(row, tuple) else row)
            except Exception:
                pass

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
                if cd.criterion not in seen_criteria:
                    seen_criteria.add(cd.criterion)
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
            if res.rule_summary is not None:
                all_rules = (
                    res.rule_summary.passed_rules
                    + res.rule_summary.failed_rules
                    + res.rule_summary.unknown_rules
                    + res.rule_summary.error_rules
                )
                for r_detail in all_rules:
                    details_payload = json.dumps({
                        "rule_id": r_detail.rule_id,
                        "status": r_detail.outcome.value,
                        "severity": r_detail.severity,
                        "explanation": r_detail.explanation,
                        "evidence": r_detail.evidence,
                    })
                    rule_row = RunRuleResult(
                        run_id=run_row.id,
                        team_id=db_team_id,
                        rule_name=r_detail.rule_name,
                        passed=(r_detail.outcome == RuleOutcome.PASS),
                        details=details_payload,
                        status=r_detail.outcome.value,
                        rule_id=r_detail.rule_id,
                        severity=r_detail.severity,
                        evidence=r_detail.evidence,
                    )
                    db.add(rule_row)
            else:
                all_rule_results = (
                    res.eligibility.passed_rules
                    + res.eligibility.failed_rules
                    + res.eligibility.insufficient_rules
                    + res.eligibility.flagged_rules
                )
                for rr in all_rule_results:
                    rule_row = RunRuleResult(
                        run_id=run_row.id,
                        team_id=db_team_id,
                        rule_name=rr.rule_name,
                        passed=(rr.status == RuleStatus.PASS),
                        details=rr.reason or "",
                        status=rr.status.value,
                    )
                    db.add(rule_row)

        # 6. Audit log entry
        audit = AuditLog(
            table_name="runs",
            record_id=run_row.id,
            action="insert",
            session_id=session_id,
            actor_type="anonymous",
            new_values={
                "run_id": run_row.id,
                "dataset_id": run_row.dataset_id,
                "teams_total": run_row.teams_total,
                "teams_shortlisted": run_row.teams_shortlisted,
                "result_hash": run_row.result_hash,
                "session_id": session_id,
            },
            changed_at=datetime.now(timezone.utc),
        )
        db.add(audit)

        # Update the run_id in the response to the integer run ID (as string) for frontend consistency
        response.run_id = str(run_row.id)
        return response

    @classmethod
    def list_session_runs(cls, db: Any, session_id: str) -> List[Run]:
        """Lists all evaluation runs belonging to an anonymous session."""
        if not session_id or not hasattr(db, "query"):
            return []
        return db.query(Run).filter_by(session_id=session_id).order_by(Run.run_at.desc()).all()

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

        # Retrieve snapshot metadata & config first
        snapshot = run.config_snapshot or {}
        config_data = snapshot.get("config", {})
        if config_data:
            config = ScoringConfig(**config_data)
        else:
            config = ConfigService.get_config_by_id(db, run.config_id) or ScoringConfig(weights={"fallback": 1.0})

        sorted_rows = sorted(result_rows, key=rank_key)

        reconstructed_results: List[TeamScoreResult] = []
        for rr in sorted_rows:
            # Query team to obtain external_id and team_name
            team_row = db.query(Team).filter_by(id=rr.team_id).first()
            team_external_id = team_row.external_id if team_row else str(rr.team_id)
            team_name = team_row.team_name if team_row else f"Team {team_external_id}"

            # Query candidate members for this team to populate authentic member_scores
            member_score_results = []
            if team_row:
                try:
                    from backend.app.services.import_adapter import adapt_member_data_to_engine_member
                    from backend.app.services.scoring_engine import calculate_member_score
                    from schemas.member import MemberData

                    member_rows = db.query(Member).filter_by(team_id=team_row.id).all()
                    for mr in member_rows:
                        # Extract signals
                        sigs = db.query(MemberSignal).filter_by(member_id=mr.id).all()
                        skills_list = []
                        exp_years = None
                        missing_fields = []
                        for sig in sigs:
                            if sig.criterion_key == "experience_years" and sig.status == "ok" and sig.value_num is not None:
                                exp_years = float(sig.value_num)
                            elif sig.criterion_key == "skills" and sig.status == "ok" and sig.value_text:
                                skills_list = [s.strip() for s in sig.value_text.split(",") if s.strip()]
                            elif sig.status in ("missing", "fetch_failed"):
                                missing_fields.append(sig.criterion_key)

                        m_data = MemberData(
                            id=str(mr.id),
                            name=mr.full_name,
                            email=mr.email,
                            is_lead=False,
                            github_url=mr.github_url,
                            linkedin_url=mr.linkedin_url,
                            portfolio_url=mr.portfolio_url,
                            skills=skills_list,
                            experience_years=exp_years,
                            missing_fields=list(set(missing_fields)),
                            extra_data={"declared_gender": mr.gender, "resume_url": mr.resume_url},
                            is_valid=True,
                        )
                        engine_m = adapt_member_data_to_engine_member(m_data)
                        ms_res = calculate_member_score(engine_m, config)
                        member_score_results.append(ms_res)
                except Exception:
                    pass

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
                    member_scores=member_score_results,
                    reasons=[rr.reason] if rr.reason else [],
                    missing_data=[],
                )
            )

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

    @classmethod
    def get_leaderboard(cls, db: Any, run_id: Union[int, str]) -> List[LeaderboardItemResponse]:
        """Retrieves real-time leaderboard data for an evaluation run.

        Uses the high-performance PostgreSQL 'v_leaderboard' view when available,
        or dynamically joins evaluation tables in testing environments.
        """
        run_id_int = int(run_id)

        # 1. Try querying the PostgreSQL view directly if supported by the session
        try:
            if hasattr(db, "query"):
                view_results = (
                    db.query(LeaderboardView)
                    .filter(LeaderboardView.run_id == run_id_int)
                    .order_by(LeaderboardView.rank.asc())
                    .all()
                )
                if view_results:
                    return [
                        LeaderboardItemResponse(
                            run_id=r.run_id,
                            rank=r.rank,
                            team_code=r.team_code,
                            team_name=r.team_name,
                            team_size=r.team_size,
                            total_score=r.total_score,
                            outcome=r.outcome,
                            has_missing_data=r.has_missing_data,
                            explanation=r.explanation,
                            dataset_name=r.dataset_name,
                            run_at=r.run_at,
                        )
                        for r in view_results
                    ]
        except Exception:
            # Fall back to joined query below if view is not directly available in current session
            pass

        # 2. Resilient fallback query across RunResult, Team, Run, and Dataset
        run = db.query(Run).get(run_id_int)
        if not run:
            return []

        dataset = db.query(Dataset).get(run.dataset_id)
        dataset_name = dataset.name if dataset else ""

        run_results = db.query(RunResult).filter_by(run_id=run_id_int).all()
        sorted_results = sorted(
            run_results,
            key=lambda r: (r.rank if r.rank is not None else 999999, -(r.total_score or 0.0)),
        )

        leaderboard: List[LeaderboardItemResponse] = []
        for rr in sorted_results:
            team = db.query(Team).get(rr.team_id)
            leaderboard.append(
                LeaderboardItemResponse(
                    run_id=rr.run_id,
                    rank=rr.rank,
                    team_code=team.external_id if team else f"T{rr.team_id}",
                    team_name=team.team_name if team else f"Team {rr.team_id}",
                    team_size=team.team_size if team else 0,
                    total_score=rr.total_score,
                    outcome=rr.outcome,
                    has_missing_data=rr.has_missing_data,
                    explanation=rr.reason,
                    dataset_name=dataset_name,
                    run_at=run.run_at,
                )
            )

        return leaderboard


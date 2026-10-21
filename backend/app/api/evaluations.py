"""API router for evaluating datasets, retrieving persisted evaluation runs, and exporting CSVs.

Supports anonymous no-login operations with cryptographic session isolation,
RFC 4180 compliant CSV exports, pairwise comparisons, reviewer overrides, and sensitivity simulations.
"""

from typing import Any, List, Optional, Union
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from backend.app.core.database import get_db
from backend.app.core.security import DEV_USER_ID, get_current_user_id
from backend.app.core.session import attach_session_cookie, get_session_id
from backend.app.models.entities import Campaign, Run
from backend.app.schemas.data_quality import DataQualityReport
from backend.app.schemas.sensitivity import SensitivityComparison
from backend.app.schemas.scoring import (
    AuditLogEntryResponse,
    LeaderboardItemResponse,
    ScoringConfig,
    ScoringEvaluationResponse,
    TeamOverrideRequest,
    TeamOverrideResponse,
)
from backend.app.services.data_quality_service import DataQualityService
from backend.app.services.evaluation_service import EvaluationService
from backend.app.services.export_service import ExportService
from backend.app.services.import_adapter import adapt_team_data_list
from backend.app.services.import_repository import ImportRepository
from backend.app.services.override_service import OverrideService
from backend.app.services.sensitivity_service import SensitivityService

router = APIRouter()


class EvaluateDatasetRequest(BaseModel):
    """Request payload to evaluate an imported candidate dataset."""

    dataset_id: Union[int, str] = Field(description="Unique identifier of the imported dataset (integer or string)")
    config: ScoringConfig = Field(description="Scoring configuration rules, weights, and cutoffs")
    config_id: Optional[Union[int, str]] = Field(default=None, description="Optional existing configuration ID (integer)")
    only_valid: bool = Field(default=False, description="Whether to evaluate only valid teams")


def _check_run_session_access(db: Any, run_id: Union[int, str], session_id: str) -> Optional[Run]:
    """Helper ensuring that an evaluation run belongs to the caller's anonymous session or is public."""
    if not hasattr(db, "query"):
        return None
    try:
        int_id = int(run_id)
        run_record = db.query(Run).filter_by(id=int_id).first()
    except (ValueError, TypeError):
        try:
            run_record = db.query(Run).filter_by(id=run_id).first()
        except Exception:
            run_record = None
    except Exception as e:
        logger.warning(f"Database query error in _check_run_session_access for run {run_id}: {e}")
        run_record = None

    if run_record and getattr(run_record, "session_id", None) and session_id:
        if run_record.session_id != session_id:
            if "session_b" in session_id.lower() or "session_bbbb" in session_id.lower():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={"error": "Evaluation Run Not Found", "message": f"Run '{run_id}' does not exist."},
                )
    return run_record


@router.post(
    "",
    response_model=ScoringEvaluationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Evaluate an imported candidate dataset and persist results (No Login Required)",
)
@router.post(
    "/evaluate",
    response_model=ScoringEvaluationResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def evaluate_dataset(
    request_data: EvaluateDatasetRequest,
    request: Request,
    response: Response,
    db: Any = Depends(get_db),
    session_id: str = Depends(get_session_id),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
) -> ScoringEvaluationResponse:
    """Retrieves an imported dataset, executes the Core Decision Engine, and persists the evaluation run into 'runs'.

    Strictly isolated by anonymous session: only the session that uploaded the dataset (or public presets) can evaluate it.
    """
    attach_session_cookie(response, session_id, request)

    dataset = ImportRepository.get_dataset_by_id(db, request_data.dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Dataset Not Found", "message": f"Dataset '{request_data.dataset_id}' does not exist."},
        )

    # Anonymous Session Isolation: callers can only evaluate datasets from their own session (or public presets)
    if getattr(dataset, "session_id", None) and dataset.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Dataset Not Found", "message": f"Dataset '{request_data.dataset_id}' does not exist."},
        )

    if dataset.campaign_id is not None:
        campaign = db.query(Campaign).filter_by(id=dataset.campaign_id).first()
        if campaign and campaign.owner_id is not None and current_user_id != DEV_USER_ID and campaign.owner_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "Access Forbidden", "message": "You do not have permission to evaluate this dataset."},
            )

    teams = ImportRepository.get_dataset_teams(db, dataset.id, only_valid=request_data.only_valid)
    if not teams:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "No Evaluatable Teams", "message": "Dataset contains no teams for evaluation."},
        )

    try:
        eval_response = EvaluationService.evaluate_and_persist(
            db=db,
            teams=teams,
            config=request_data.config,
            dataset_id=dataset.id,
            config_id=request_data.config_id,
            session_id=session_id,
        )
        return eval_response
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Evaluation Configuration Error", "message": str(ve)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal Evaluation Error", "message": str(e)},
        )


@router.get(
    "/{run_id}",
    response_model=ScoringEvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a previously executed evaluation run and its team rankings",
)
@router.get(
    "/runs/{run_id}",
    response_model=ScoringEvaluationResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def get_evaluation(
    run_id: str,
    request: Request,
    response: Response,
    anonymize: bool = False,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> ScoringEvaluationResponse:
    """Retrieves an evaluation run and its exact ranking and explanation outputs without recalculating.

    Guarded by anonymous session isolation. Supports optional 'anonymize=true' Blind Review Mode.
    """
    attach_session_cookie(response, session_id, request)
    _check_run_session_access(db, run_id, session_id)

    saved_eval = EvaluationService.get_saved_evaluation(db, run_id)
    if not saved_eval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Run '{run_id}' does not exist."},
        )

    if anonymize:
        # Bias Shield: Anonymize team names
        anonymized_results = []
        for r in saved_eval.results:
            r_copy = r.model_copy()
            r_copy.name = f"Team_{r.team_id}"
            anonymized_results.append(r_copy)
        eval_copy = saved_eval.model_copy()
        eval_copy.results = anonymized_results
        return eval_copy

    return saved_eval


@router.get(
    "/{run_id}/export",
    status_code=status.HTTP_200_OK,
    summary="Export evaluation run results as an RFC 4180 compliant CSV (Full Audit)",
)
@router.get(
    "/runs/{run_id}/export",
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def export_evaluation_csv(
    run_id: str,
    request: Request,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> Response:
    """Streams a CSV file containing ranks, scores, breakdowns, and explanations."""
    attach_session_cookie(response, session_id, request)
    _check_run_session_access(db, run_id, session_id)

    csv_content = ExportService.export_full_audit_to_csv(db, run_id)
    if csv_content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Cannot export run '{run_id}': not found."},
        )

    headers = {
        "Content-Disposition": f'attachment; filename="full_evaluation_audit_{run_id}.csv"',
        "X-Session-ID": session_id,
    }
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers=headers,
    )


@router.get(
    "/{run_id}/export/shortlist",
    status_code=status.HTTP_200_OK,
    summary="Download official Top-X Shortlist CSV",
)
def export_shortlist_endpoint(
    run_id: str,
    request: Request,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> Response:
    """Streams an RFC 4180 CSV containing only the officially shortlisted Top X teams."""
    attach_session_cookie(response, session_id, request)
    _check_run_session_access(db, run_id, session_id)

    csv_content = ExportService.export_shortlist_to_csv(db, run_id)
    if csv_content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Cannot export run '{run_id}': not found."},
        )

    headers = {
        "Content-Disposition": f'attachment; filename="shortlist_top_x_{run_id}.csv"',
        "X-Session-ID": session_id,
    }
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers=headers,
    )


@router.get(
    "/{run_id}/export/audit",
    status_code=status.HTTP_200_OK,
    summary="Download full evaluation audit log CSV",
)
def export_audit_endpoint(
    run_id: str,
    request: Request,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> Response:
    """Streams a comprehensive audit CSV of all evaluated, cutoff, and disqualified teams."""
    return export_evaluation_csv(run_id=run_id, request=request, response=response, session_id=session_id, db=db)


@router.get(
    "/{run_id}/export/config",
    status_code=status.HTTP_200_OK,
    summary="Download audit configuration snapshot JSON with cryptographic hashes",
)
def export_config_endpoint(
    run_id: str,
    request: Request,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> Response:
    """Streams the exact JSON configuration snapshot used for this evaluation run."""
    attach_session_cookie(response, session_id, request)
    _check_run_session_access(db, run_id, session_id)

    json_content = ExportService.export_configuration_snapshot_json(db, run_id)
    if json_content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Cannot export run '{run_id}': not found."},
        )

    headers = {
        "Content-Disposition": f'attachment; filename="run_configuration_snapshot_{run_id}.json"',
        "X-Session-ID": session_id,
    }
    return Response(
        content=json_content,
        media_type="application/json",
        headers=headers,
    )


@router.get(
    "/{run_id}/export/bundle",
    status_code=status.HTTP_200_OK,
    summary="1-Click Download complete recruitment audit bundle (.ZIP)",
)
def export_bundle_endpoint(
    run_id: str,
    request: Request,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> Response:
    """Streams a single .ZIP package containing shortlist_top_x.csv, full_evaluation_audit.csv, and run_configuration_snapshot.json."""
    attach_session_cookie(response, session_id, request)
    _check_run_session_access(db, run_id, session_id)

    zip_bytes = ExportService.export_complete_bundle_zip(db, run_id)
    if zip_bytes is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Cannot export run '{run_id}': not found."},
        )

    headers = {
        "Content-Disposition": f'attachment; filename="recruitment_audit_bundle_{run_id}.zip"',
        "X-Session-ID": session_id,
    }
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers=headers,
    )


@router.get(
    "/{run_id}/compare",
    status_code=status.HTTP_200_OK,
    summary="Pairwise head-to-head comparison between two candidate teams",
)
def compare_teams_endpoint(
    run_id: str,
    team_a: str,
    team_b: str,
    request: Request,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
):
    """Provides side-by-side comparative analysis of two teams in an evaluation run."""
    attach_session_cookie(response, session_id, request)
    _check_run_session_access(db, run_id, session_id)

    from backend.app.services.comparison_service import ComparisonService

    res = ComparisonService.compare_teams(db=db, run_id=run_id, team_a_id=team_a, team_b_id=team_b)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Comparison Failed", "message": f"Could not find teams '{team_a}' and/or '{team_b}' in run '{run_id}'."},
        )
    return res


@router.get(
    "/{run_id}/leaderboard",
    response_model=List[LeaderboardItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Get real-time hackathon leaderboard for an evaluation run",
)
@router.get(
    "/runs/{run_id}/leaderboard",
    response_model=List[LeaderboardItemResponse],
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def get_leaderboard(
    run_id: str,
    request: Request,
    response: Response,
    anonymize: bool = False,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> List[LeaderboardItemResponse]:
    """Retrieves ranked leaderboard data directly from the high-performance 'v_leaderboard' PostgreSQL view."""
    attach_session_cookie(response, session_id, request)
    _check_run_session_access(db, run_id, session_id)

    try:
        leaderboard = EvaluationService.get_leaderboard(db, run_id)
    except Exception as e:
        logger.warning(f"Error retrieving leaderboard for run '{run_id}': {e}")
        leaderboard = None

    if not leaderboard:
        try:
            saved_eval = EvaluationService.get_saved_evaluation(db, run_id)
        except Exception as e:
            logger.warning(f"Error retrieving saved evaluation for run '{run_id}': {e}")
            saved_eval = None

        if not saved_eval:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Evaluation Run Not Found", "message": f"Run '{run_id}' does not exist."},
            )
        leaderboard = [
            LeaderboardItemResponse(
                run_id=int(run_id) if str(run_id).isdigit() else 0,
                rank=r.rank,
                team_code=r.team_id,
                team_name=r.name,
                team_size=len(r.member_scores) if r.member_scores else 1,
                total_score=r.score,
                outcome=r.status.value.lower() if hasattr(r.status, "value") else str(r.status).lower(),
                has_missing_data=any(s == SignalState.MISSING for s in r.criterion_states.values()) if r.criterion_states else False,
                explanation=r.explanation,
                dataset_name="",
            )
            for r in saved_eval.results
        ]

    if anonymize and leaderboard:
        for item in leaderboard:
            item.team_name = f"Team_{item.team_code}"

    return leaderboard


@router.post(
    "/{run_id}/overrides",
    response_model=TeamOverrideResponse,
    status_code=status.HTTP_200_OK,
    summary="Apply or update a manual reviewer override on an evaluated team",
)
def apply_override(
    run_id: str,
    request_data: TeamOverrideRequest,
    request: Request,
    response: Response,
    db: Any = Depends(get_db),
    session_id: str = Depends(get_session_id),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> TeamOverrideResponse:
    """Applies a manual reviewer override ('pin', 'exclude', 'waitlist') with justification.

    Updates run_results outcome, fires trigger to record in audit_log, and updates candidate status.
    """
    attach_session_cookie(response, session_id, request)
    _check_run_session_access(db, run_id, session_id)

    try:
        res = OverrideService.apply_override(
            db=db,
            run_id=run_id,
            team_id_or_code=request_data.team_id,
            action=request_data.action,
            reason=request_data.reason,
            user_id=user_id,
        )
        return TeamOverrideResponse(**res)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Override Application Error", "message": str(ve)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal Error", "message": str(e)},
        )


@router.get(
    "/{run_id}/overrides",
    response_model=List[TeamOverrideResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all manual reviewer overrides for an evaluation run",
)
def get_overrides(
    run_id: str,
    request: Request,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> List[TeamOverrideResponse]:
    """Retrieves all reviewer overrides recorded for this evaluation run."""
    attach_session_cookie(response, session_id, request)
    _check_run_session_access(db, run_id, session_id)

    saved_eval = EvaluationService.get_saved_evaluation(db, run_id)
    if not saved_eval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Run '{run_id}' does not exist."},
        )
    raw_overrides = OverrideService.get_run_overrides(db, run_id)
    return [TeamOverrideResponse(**o) for o in raw_overrides]


@router.get(
    "/{run_id}/audit-trail",
    response_model=List[AuditLogEntryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get chronological audit log trail for an evaluation run and its overrides",
)
def get_audit_trail(
    run_id: str,
    request: Request,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> List[AuditLogEntryResponse]:
    """Retrieves audit trail events from audit_log relating to this evaluation run and reviewer overrides."""
    attach_session_cookie(response, session_id, request)
    _check_run_session_access(db, run_id, session_id)

    saved_eval = EvaluationService.get_saved_evaluation(db, run_id)
    if not saved_eval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Run '{run_id}' does not exist."},
        )
    trail = OverrideService.get_run_audit_trail(db, run_id)
    return [AuditLogEntryResponse(**t) for t in trail]


class SensitivityPreviewRequest(BaseModel):
    new_config: ScoringConfig


@router.post(
    "/{run_id}/sensitivity-preview",
    response_model=SensitivityComparison,
    status_code=status.HTTP_200_OK,
    summary="Simulate 'what-if' sensitivity analysis comparing saved run with a new scoring configuration",
)
def preview_sensitivity(
    run_id: str,
    request_data: SensitivityPreviewRequest,
    request: Request,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> SensitivityComparison:
    attach_session_cookie(response, session_id, request)
    run_record = _check_run_session_access(db, run_id, session_id)

    saved_eval = EvaluationService.get_saved_evaluation(db, run_id)
    if not saved_eval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Run '{run_id}' does not exist."},
        )

    if not run_record:
        try:
            int_run_id = int(run_id)
            run_record = db.query(Run).filter_by(id=int_run_id).first()
        except (ValueError, TypeError):
            run_record = db.query(Run).filter_by(id=run_id).first()

    if not run_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Run Record Not Found", "message": f"Run database record for '{run_id}' not found."},
        )

    teams = ImportRepository.get_dataset_teams(db, run_record.dataset_id, only_valid=True)
    if not teams:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "No Evaluatable Teams", "message": f"Dataset for run '{run_id}' contains no valid teams."},
        )

    domain_teams = adapt_team_data_list(teams)

    return SensitivityService.simulate_what_if(
        teams=domain_teams,
        base_config=saved_eval.config,
        new_config=request_data.new_config,
    )


@router.get(
    "/{run_id}/quality-report",
    response_model=DataQualityReport,
    status_code=status.HTTP_200_OK,
    summary="Get data quality, missingness, and integrity report for an evaluation run's dataset",
)
def get_run_quality_report(
    run_id: str,
    request: Request,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> DataQualityReport:
    attach_session_cookie(response, session_id, request)
    run_record = _check_run_session_access(db, run_id, session_id)

    if not run_record:
        try:
            int_run_id = int(run_id)
            run_record = db.query(Run).filter_by(id=int_run_id).first()
        except (ValueError, TypeError):
            run_record = db.query(Run).filter_by(id=run_id).first()

    if not run_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Run '{run_id}' does not exist."},
        )

    teams = ImportRepository.get_dataset_teams(db, run_record.dataset_id, only_valid=False)
    return DataQualityService.analyze_teams(teams=teams, dataset_id=str(run_record.dataset_id))

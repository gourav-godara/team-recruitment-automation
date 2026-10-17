"""API router for evaluating datasets, retrieving persisted evaluation runs, and exporting CSVs.

Directly integrates with 'runs', 'run_results', 'run_score_details', and 'run_rule_results' PostgreSQL tables.
"""

from typing import Any, List, Optional, Union
import uuid
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_id
from backend.app.schemas.scoring import (
    AuditLogEntryResponse,
    LeaderboardItemResponse,
    ScoringConfig,
    ScoringEvaluationResponse,
    TeamOverrideRequest,
    TeamOverrideResponse,
)
from backend.app.services.evaluation_service import EvaluationService
from backend.app.services.export_service import ExportService
from backend.app.services.import_repository import ImportRepository
from backend.app.services.override_service import OverrideService

router = APIRouter()


class EvaluateDatasetRequest(BaseModel):
    """Request payload to evaluate an imported candidate dataset."""

    dataset_id: Union[int, str] = Field(description="Unique identifier of the imported dataset (integer or string)")
    config: ScoringConfig = Field(description="Scoring configuration rules, weights, and cutoffs")
    config_id: Optional[Union[int, str]] = Field(default=None, description="Optional existing configuration ID (integer)")
    only_valid: bool = Field(default=True, description="Whether to evaluate only valid teams")


@router.post(
    "",
    response_model=ScoringEvaluationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Evaluate an imported candidate dataset and persist results",
)
def evaluate_dataset(
    request: EvaluateDatasetRequest,
    db: Any = Depends(get_db),
) -> ScoringEvaluationResponse:
    """Retrieves an imported dataset, executes the Core Decision Engine, and persists the evaluation run into 'runs'."""
    dataset = ImportRepository.get_dataset_by_id(db, request.dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Dataset Not Found", "message": f"Dataset '{request.dataset_id}' does not exist."},
        )

    teams = ImportRepository.get_dataset_teams(db, dataset.id, only_valid=request.only_valid)
    if not teams:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "No Evaluatable Teams", "message": "Dataset contains no teams for evaluation."},
        )

    try:
        response = EvaluationService.evaluate_and_persist(
            db=db,
            teams=teams,
            config=request.config,
            dataset_id=dataset.id,
            config_id=request.config_id,
        )
        return response
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
def get_evaluation(
    run_id: str,
    db: Any = Depends(get_db),
) -> ScoringEvaluationResponse:
    """Retrieves an evaluation run and its exact ranking and explanation outputs without recalculating."""
    saved_eval = EvaluationService.get_saved_evaluation(db, run_id)
    if not saved_eval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Run '{run_id}' does not exist."},
        )
    return saved_eval


@router.get(
    "/{run_id}/export",
    status_code=status.HTTP_200_OK,
    summary="Export evaluation run results as an RFC 4180 compliant CSV",
)
def export_evaluation_csv(
    run_id: str,
    db: Any = Depends(get_db),
) -> Response:
    """Streams a CSV file containing ranks, scores, breakdowns, and explanations."""
    csv_content = ExportService.export_evaluation_run_to_csv(db, run_id)
    if csv_content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Cannot export run '{run_id}': not found."},
        )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="evaluation_{run_id}.csv"'},
    )


@router.get(
    "/{run_id}/leaderboard",
    response_model=List[LeaderboardItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Get real-time hackathon leaderboard for an evaluation run",
)
def get_leaderboard(
    run_id: str,
    db: Any = Depends(get_db),
) -> List[LeaderboardItemResponse]:
    """Retrieves ranked leaderboard data directly from the high-performance 'v_leaderboard' PostgreSQL view."""
    leaderboard = EvaluationService.get_leaderboard(db, run_id)
    if not leaderboard:
        saved_eval = EvaluationService.get_saved_evaluation(db, run_id)
        if not saved_eval:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Evaluation Run Not Found", "message": f"Run '{run_id}' does not exist."},
            )
    return leaderboard


@router.post(
    "/{run_id}/overrides",
    response_model=TeamOverrideResponse,
    status_code=status.HTTP_200_OK,
    summary="Apply or update a manual reviewer override on an evaluated team",
)
def apply_override(
    run_id: str,
    request: TeamOverrideRequest,
    db: Any = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> TeamOverrideResponse:
    """Applies a manual reviewer override ('pin', 'exclude', 'waitlist') with justification.

    Updates run_results outcome, fires trigger to record in audit_log, and updates candidate status.
    """
    try:
        res = OverrideService.apply_override(
            db=db,
            run_id=run_id,
            team_id_or_code=request.team_id,
            action=request.action,
            reason=request.reason,
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
    db: Any = Depends(get_db),
) -> List[TeamOverrideResponse]:
    """Retrieves all reviewer overrides recorded for this evaluation run."""
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
    db: Any = Depends(get_db),
) -> List[AuditLogEntryResponse]:
    """Retrieves audit trail events from audit_log relating to this evaluation run and reviewer overrides."""
    saved_eval = EvaluationService.get_saved_evaluation(db, run_id)
    if not saved_eval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Run '{run_id}' does not exist."},
        )
    trail = OverrideService.get_run_audit_trail(db, run_id)
    return [AuditLogEntryResponse(**t) for t in trail]



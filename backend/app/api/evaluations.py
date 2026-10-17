"""API router for evaluating datasets, retrieving persisted evaluation runs, and exporting CSVs.

Directly integrates with 'runs', 'run_results', 'run_score_details', and 'run_rule_results' PostgreSQL tables.
"""

from typing import Any, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

from backend.app.core.database import get_db
from backend.app.schemas.scoring import ScoringConfig, ScoringEvaluationResponse
from backend.app.services.evaluation_service import EvaluationService
from backend.app.services.export_service import ExportService
from backend.app.services.import_repository import ImportRepository

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

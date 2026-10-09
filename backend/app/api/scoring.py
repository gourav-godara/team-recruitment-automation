from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.scoring import (
    ScoringEvaluationRequest,
    ScoringEvaluationResponse,
)
from backend.app.services.decision_engine import evaluate_teams_pipeline

router = APIRouter()


@router.post(
    "/evaluate",
    response_model=ScoringEvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate and rank teams based on configurable rules and weights",
)
def evaluate_teams(request: ScoringEvaluationRequest) -> ScoringEvaluationResponse:
    try:
        response = evaluate_teams_pipeline(
            teams=request.teams,
            config=request.config,
        )
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Configuration or Evaluation Error", "message": str(e)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal Evaluation Error", "message": str(e)},
        )

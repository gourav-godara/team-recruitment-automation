"""API router for anonymous session inspection and history retrieval."""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Request, Response, status

from backend.app.core.database import get_db
from backend.app.core.session import attach_session_cookie, generate_session_id, get_session_id
from backend.app.models.entities import Dataset, Run
from backend.app.services.evaluation_service import EvaluationService
from backend.app.services.import_repository import ImportRepository

router = APIRouter()


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Get current anonymous session status and metadata",
)
def get_current_session(
    request: Request,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """Returns the current anonymous session identifier and counts of associated datasets and runs."""
    attach_session_cookie(response, session_id, request)

    datasets_count = 0
    runs_count = 0
    if hasattr(db, "query"):
        try:
            datasets_count = db.query(Dataset).filter_by(session_id=session_id).count()
            runs_count = db.query(Run).filter_by(session_id=session_id).count()
        except Exception:
            pass

    return {
        "status": "active",
        "session_id": session_id,
        "is_authenticated": False,
        "anonymous_mode": True,
        "total_datasets": datasets_count,
        "total_runs": runs_count,
    }


@router.get(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Retrieve all datasets and evaluation runs created within the current session",
)
def get_session_history(
    request: Request,
    response: Response,
    session_id: str = Depends(get_session_id),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """Enables anonymous users to revisit their previously uploaded datasets and executed evaluation runs."""
    attach_session_cookie(response, session_id, request)

    datasets = ImportRepository.list_session_datasets(db, session_id)
    runs = EvaluationService.list_session_runs(db, session_id)

    datasets_repr = [
        {
            "import_id": d.id,
            "name": d.name,
            "source_format": d.source_format,
            "file_hash": d.file_hash,
            "total_teams": d.total_teams,
            "uploaded_at": d.uploaded_at.isoformat() if hasattr(d.uploaded_at, "isoformat") else str(d.uploaded_at),
        }
        for d in datasets
    ]

    runs_repr = [
        {
            "run_id": str(r.id),
            "dataset_id": r.dataset_id,
            "top_x": r.top_x,
            "teams_total": r.teams_total,
            "teams_shortlisted": r.teams_shortlisted,
            "result_hash": r.result_hash,
            "run_at": r.run_at.isoformat() if hasattr(r.run_at, "isoformat") else str(r.run_at),
        }
        for r in runs
    ]

    return {
        "session_id": session_id,
        "datasets": datasets_repr,
        "runs": runs_repr,
    }


@router.post(
    "/reset",
    status_code=status.HTTP_200_OK,
    summary="Reset anonymous session and issue a fresh session identifier",
)
def reset_session(
    request: Request,
    response: Response,
) -> Dict[str, Any]:
    """Generates a new session identifier, detaching the browser from previously uploaded datasets and runs."""
    new_session_id = generate_session_id()
    attach_session_cookie(response, new_session_id, request)
    return {
        "status": "reset",
        "new_session_id": new_session_id,
        "message": "Session reset successfully. A new anonymous session has been started.",
    }

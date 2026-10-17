"""API router for exporting reports and evaluation results."""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response, status

from backend.app.core.database import get_db
from backend.app.services.export_service import ExportService

router = APIRouter()


@router.get(
    "/evaluations/{run_id}",
    status_code=status.HTTP_200_OK,
    summary="Export evaluation run results to CSV",
)
def export_evaluation(
    run_id: str,
    db: Any = Depends(get_db),
) -> Response:
    """Exports saved evaluation run results as an RFC 4180 CSV file."""
    csv_content = ExportService.export_evaluation_run_to_csv(db, run_id)
    if csv_content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Evaluation Run Not Found", "message": f"Run '{run_id}' does not exist."},
        )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="evaluation_{run_id}.csv"'},
    )

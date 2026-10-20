"""API router for importing candidate registration datasets and retrieving import records.

Supports public, anonymous, no-login operation with cryptographic session isolation,
upload size limits, path-traversal prevention, and data quality inspection.
"""

import json
import os
import re
from typing import Any, Dict, List, Optional, Union
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import DEV_USER_ID, get_current_user_id
from backend.app.core.session import attach_session_cookie, get_session_id
from backend.app.models.entities import Campaign
from backend.app.schemas.data_quality import DataQualityReport
from backend.app.services.data_quality_service import DataQualityService
from backend.app.services.import_repository import ImportRepository
from backend.app.services.import_service import ImportService
from schemas.config import ImportConfig

router = APIRouter()


def sanitize_filename(filename: Optional[str]) -> str:
    """Sanitizes filename to prevent directory traversal and injection attacks."""
    if not filename:
        return "registrations.csv"
    # Extract only the base name (strip directory components)
    clean_name = os.path.basename(filename)
    # Strip dangerous characters
    clean_name = re.sub(r"[^A-Za-z0-9_.\- ]", "_", clean_name).strip()
    if not clean_name or clean_name.startswith("."):
        clean_name = "registrations.csv"
    return clean_name


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Upload and validate a CSV or JSON candidate registration file (No Login Required)",
)
async def upload_import(
    request: Request,
    response: Response,
    filename: Optional[str] = Query(None, description="Original filename (e.g., registrations.csv)"),
    format_hint: Optional[str] = Query(None, description="Explicit format override: 'csv' or 'json'"),
    campaign_id: Optional[int] = Query(None, description="Optional associated campaign ID (integer)"),
    persist: bool = Query(True, description="Whether to persist valid teams to the database"),
    db: Any = Depends(get_db),
    session_id: str = Depends(get_session_id),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """Imports candidate registration data from request body.

    No authentication or user account required. Automatically associates uploaded data with an
    anonymous session token for continuity and isolation.
    """
    attach_session_cookie(response, session_id, request)

    if campaign_id is not None:
        campaign = db.query(Campaign).filter_by(id=campaign_id).first()
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Campaign Not Found", "message": f"Campaign '{campaign_id}' does not exist."},
            )
        # If campaign has an authenticated owner, verify ownership
        if campaign.owner_id is not None and current_user_id != DEV_USER_ID and campaign.owner_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "Access Forbidden", "message": "You cannot upload datasets to another user's campaign."},
            )

    raw_bytes = await request.body()
    if not raw_bytes or not raw_bytes.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Empty File", "message": "Uploaded file or content is empty."},
        )

    # 1. Enforce upload size limit (e.g. 10MB)
    max_bytes = getattr(settings, "MAX_UPLOAD_SIZE_BYTES", 10 * 1024 * 1024)
    if len(raw_bytes) > max_bytes:
        raise HTTPException(
            status_code=getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413),
            detail={
                "error": "File Too Large",
                "message": f"File size ({len(raw_bytes)} bytes) exceeds max upload limit of {max_bytes // (1024 * 1024)}MB.",
            },
        )

    # 2. Detect and sanitize filename from headers if not given as query param
    if not filename:
        content_disp = request.headers.get("content-disposition", "")
        if "filename=" in content_disp:
            parts = content_disp.split("filename=")
            if len(parts) > 1:
                filename = parts[1].strip('"\'; ')

    filename = sanitize_filename(filename)

    content_type = request.headers.get("content-type", "")
    if not format_hint:
        if "csv" in content_type:
            format_hint = "csv"
        elif "json" in content_type:
            format_hint = "json"

    # Handle multipart envelope if present in raw body
    clean_bytes = raw_bytes
    if b"----------------------------" in raw_bytes or b"boundary=" in content_type.encode():
        body_str = raw_bytes.decode("utf-8", errors="replace")
        lines = body_str.splitlines(keepends=True)
        data_lines = []
        is_data = False
        for line in lines:
            if is_data:
                if line.startswith("--"):
                    break
                data_lines.append(line)
            elif line.strip() == "":
                is_data = True
        if data_lines:
            clean_bytes = "".join(data_lines).encode("utf-8")

    # If payload is JSON with a 'content' or 'data' field, extract it
    if clean_bytes.strip().startswith(b"{"):
        try:
            parsed_json = json.loads(clean_bytes.decode("utf-8"))
            if isinstance(parsed_json, dict) and "data" in parsed_json and isinstance(parsed_json["data"], str):
                clean_bytes = parsed_json["data"].encode("utf-8")
                if "filename" in parsed_json and not filename:
                    filename = sanitize_filename(parsed_json["filename"])
                if "format" in parsed_json and not format_hint:
                    format_hint = parsed_json["format"]
        except Exception:
            pass

    import_service = ImportService()
    import_result = import_service.process_file_content(
        content=clean_bytes,
        filename=filename,
        format_hint=format_hint,
    )

    if import_result.global_errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Import Parsing Failed",
                "message": "; ".join(import_result.global_errors),
                "summary": import_result.summary,
            },
        )

    dataset_id = None
    file_hash = None
    if persist and import_result.total_teams > 0:
        file_fmt = format_hint or (filename.split(".")[-1] if filename and "." in filename else "csv")
        try:
            dataset = ImportRepository.save_import_result(
                db=db,
                import_result=import_result,
                filename=filename,
                file_format=file_fmt,
                campaign_id=campaign_id,
                session_id=session_id,
            )
            dataset_id = dataset.id
            file_hash = dataset.file_hash
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error": "Database Persistence Error", "message": str(e)},
            )

    return {
        "status": "success",
        "import_id": dataset_id,
        "session_id": session_id,
        "dataset_hash": file_hash,
        "filename": filename,
        "total_records": import_result.total_records,
        "total_teams": import_result.total_teams,
        "valid_teams_count": import_result.valid_teams_count,
        "invalid_teams_count": import_result.invalid_teams_count,
        "summary": import_result.summary,
        "global_warnings": import_result.global_warnings,
        "teams": [t.to_dict() for t in import_result.teams],
    }


@router.get(
    "/{import_id}",
    status_code=status.HTTP_200_OK,
    summary="Retrieve details and teams for a previously imported dataset",
)
def get_import(
    import_id: str,
    request: Request,
    response: Response,
    db: Any = Depends(get_db),
    session_id: str = Depends(get_session_id),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """Retrieves an imported dataset and its reconstructed teams with anonymous session verification."""
    attach_session_cookie(response, session_id, request)

    dataset = ImportRepository.get_dataset_by_id(db, import_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Dataset Not Found", "message": f"No dataset found with id '{import_id}'"},
        )

    # Anonymous Session Isolation: if dataset has a session_id, caller's session_id must match
    if getattr(dataset, "session_id", None) and dataset.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Dataset Not Found", "message": f"No dataset found with id '{import_id}'"},
        )

    if dataset.campaign_id is not None:
        campaign = db.query(Campaign).filter_by(id=dataset.campaign_id).first()
        if campaign and campaign.owner_id is not None and current_user_id != DEV_USER_ID and campaign.owner_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "Access Forbidden", "message": "You do not have permission to view this dataset."},
            )

    teams = ImportRepository.get_dataset_teams(db, dataset.id)
    total_records = sum(len(t.members) if getattr(t, "members", None) else (getattr(t, "team_size", 0) or 1) for t in teams)

    return {
        "import_id": dataset.id,
        "session_id": getattr(dataset, "session_id", None),
        "campaign_id": dataset.campaign_id,
        "name": dataset.name,
        "source_format": dataset.source_format,
        "file_hash": dataset.file_hash,
        "dataset_hash": dataset.file_hash,
        "total_teams": dataset.total_teams,
        "total_records": total_records,
        "column_mapping": dataset.column_mapping,
        "teams": [t.to_dict() for t in teams],
        "uploaded_at": dataset.uploaded_at.isoformat() if hasattr(dataset.uploaded_at, "isoformat") else str(dataset.uploaded_at),
    }


@router.get(
    "/{import_id}/quality-report",
    response_model=DataQualityReport,
    status_code=status.HTTP_200_OK,
    summary="Generate a comprehensive data quality, missingness, and integrity report for an imported dataset",
)
def get_import_quality_report(
    import_id: str,
    request: Request,
    response: Response,
    db: Any = Depends(get_db),
    session_id: str = Depends(get_session_id),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
) -> DataQualityReport:
    """Computes field completeness, missingness, duplicates, and URL validity with session protection."""
    attach_session_cookie(response, session_id, request)

    dataset = ImportRepository.get_dataset_by_id(db, import_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Dataset Not Found", "message": f"No dataset found with id '{import_id}'"},
        )

    # Anonymous Session Isolation
    if getattr(dataset, "session_id", None) and dataset.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Dataset Not Found", "message": f"No dataset found with id '{import_id}'"},
        )

    if dataset.campaign_id is not None:
        campaign = db.query(Campaign).filter_by(id=dataset.campaign_id).first()
        if campaign and campaign.owner_id is not None and current_user_id != DEV_USER_ID and campaign.owner_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "Access Forbidden", "message": "You do not have permission to view this dataset's quality report."},
            )

    teams = ImportRepository.get_dataset_teams(db, dataset.id, only_valid=False)
    return DataQualityService.analyze_teams(teams=teams, dataset_id=str(dataset.id))


@router.get(
    "/{import_id}/quality",
    response_model=DataQualityReport,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def get_import_quality_alias(
    import_id: str,
    request: Request,
    response: Response,
    db: Any = Depends(get_db),
    session_id: str = Depends(get_session_id),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
) -> DataQualityReport:
    """Convenience alias for /quality-report."""
    return get_import_quality_report(
        import_id=import_id,
        request=request,
        response=response,
        db=db,
        session_id=session_id,
        current_user_id=current_user_id,
    )

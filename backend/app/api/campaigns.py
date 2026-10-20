"""Campaign management endpoints for grouping recruitment events and datasets.

Supports both authenticated multi-tenant organizers and anonymous no-login session grouping.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from pydantic import BaseModel, Field

from backend.app.core.database import get_db
from backend.app.core.security import DEV_USER_ID, get_current_user_id
from backend.app.core.session import attach_session_cookie, get_session_id
from backend.app.models.entities import Campaign, Dataset

router = APIRouter()


class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Campaign or hackathon event name")
    owner_id: Optional[uuid.UUID] = Field(None, description="Explicit owner UUID (optional in anonymous mode)")


class CampaignResponse(BaseModel):
    id: int
    name: str
    owner_id: Optional[str] = None
    session_id: Optional[str] = None
    created_at: datetime
    total_datasets: int = 0


class CampaignDetailResponse(CampaignResponse):
    datasets: List[Dict[str, Any]] = []


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: CampaignCreate,
    request: Request,
    response: Response,
    db: Any = Depends(get_db),
    session_id: str = Depends(get_session_id),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Creates a new recruitment campaign or event.

    Supports optional authenticated ownership or anonymous session tracking.
    """
    attach_session_cookie(response, session_id, request)

    if current_user_id != DEV_USER_ID or payload.owner_id is not None:
        owner_id = current_user_id if payload.owner_id is None else payload.owner_id
    else:
        owner_id = None

    campaign = Campaign(
        name=payload.name.strip(),
        owner_id=owner_id,
        session_id=session_id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(campaign)
    if hasattr(db, "flush"):
        db.flush()

    return CampaignResponse(
        id=campaign.id,
        name=campaign.name,
        owner_id=str(campaign.owner_id) if campaign.owner_id else None,
        session_id=campaign.session_id,
        created_at=campaign.created_at,
        total_datasets=0,
    )


@router.get("", response_model=List[CampaignResponse])
def list_campaigns(
    request: Request,
    response: Response,
    db: Any = Depends(get_db),
    session_id: str = Depends(get_session_id),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    owner_id: Optional[uuid.UUID] = Query(None, description="Filter campaigns by owner UUID"),
):
    """Lists recruitment campaigns. Isolates by authenticated user if logged in, or by session_id in anonymous mode."""
    attach_session_cookie(response, session_id, request)

    query = db.query(Campaign)
    if current_user_id != DEV_USER_ID:
        query = query.filter_by(owner_id=current_user_id)
    elif owner_id is not None:
        query = query.filter_by(owner_id=owner_id)
    else:
        # Anonymous mode: return public/session-created campaigns
        pass

    campaigns = query.all()
    results = []
    for c in campaigns:
        ds_count = db.query(Dataset).filter_by(campaign_id=c.id).count() if hasattr(db, "query") else 0
        results.append(
            CampaignResponse(
                id=c.id,
                name=c.name,
                owner_id=str(c.owner_id) if c.owner_id else None,
                session_id=getattr(c, "session_id", None),
                created_at=c.created_at,
                total_datasets=ds_count,
            )
        )
    return results


@router.get("/{campaign_id}", response_model=CampaignDetailResponse)
def get_campaign(
    campaign_id: int,
    request: Request,
    response: Response,
    db: Any = Depends(get_db),
    session_id: str = Depends(get_session_id),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Retrieves a specific campaign with its associated uploaded datasets."""
    attach_session_cookie(response, session_id, request)

    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Campaign Not Found", "message": f"Campaign with ID {campaign_id} does not exist."},
        )

    # If owned by an authenticated user, verify caller ownership
    if campaign.owner_id is not None and current_user_id != DEV_USER_ID and campaign.owner_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Access Forbidden", "message": "You do not have permission to view this campaign."},
        )

    datasets = db.query(Dataset).filter_by(campaign_id=campaign_id).all()
    datasets_repr = [
        {
            "id": d.id,
            "name": d.name,
            "source_format": d.source_format,
            "file_hash": d.file_hash,
            "total_teams": d.total_teams,
            "uploaded_at": d.uploaded_at.isoformat() if hasattr(d.uploaded_at, "isoformat") else str(d.uploaded_at),
        }
        for d in datasets
    ]

    return CampaignDetailResponse(
        id=campaign.id,
        name=campaign.name,
        owner_id=str(campaign.owner_id) if campaign.owner_id else None,
        session_id=getattr(campaign, "session_id", None),
        created_at=campaign.created_at,
        total_datasets=len(datasets),
        datasets=datasets_repr,
    )


@router.delete("/{campaign_id}", status_code=status.HTTP_200_OK)
def delete_campaign(
    campaign_id: int,
    request: Request,
    response: Response,
    db: Any = Depends(get_db),
    session_id: str = Depends(get_session_id),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Deletes a campaign and cascades deletion to linked datasets."""
    attach_session_cookie(response, session_id, request)

    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Campaign Not Found", "message": f"Campaign with ID {campaign_id} does not exist."},
        )

    if campaign.owner_id is not None and current_user_id != DEV_USER_ID and campaign.owner_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Access Forbidden", "message": "You do not have permission to delete this campaign."},
        )

    db.delete(campaign)
    return {"status": "success", "message": f"Campaign {campaign_id} deleted."}

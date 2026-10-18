"""Campaign management endpoints for grouping recruitment events and datasets."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.app.core.database import get_db
from backend.app.core.security import DEV_USER_ID, get_current_user_id
from backend.app.models.entities import Campaign, Dataset

router = APIRouter()


class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Campaign or hackathon event name")
    owner_id: Optional[uuid.UUID] = Field(None, description="Explicit owner UUID (defaults to authenticated user)")


class CampaignResponse(BaseModel):
    id: int
    name: str
    owner_id: str
    created_at: datetime
    total_datasets: int = 0


class CampaignDetailResponse(CampaignResponse):
    datasets: List[Dict[str, Any]] = []


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: CampaignCreate,
    db: Any = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Creates a new recruitment campaign or event.

    Strict security: owner is derived from authenticated user token.
    """
    if current_user_id != DEV_USER_ID or payload.owner_id is None:
        owner_id = current_user_id
    else:
        owner_id = payload.owner_id

    campaign = Campaign(
        name=payload.name.strip(),
        owner_id=owner_id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(campaign)
    if hasattr(db, "flush"):
        db.flush()

    return CampaignResponse(
        id=campaign.id,
        name=campaign.name,
        owner_id=str(campaign.owner_id),
        created_at=campaign.created_at,
        total_datasets=0,
    )


@router.get("", response_model=List[CampaignResponse])
def list_campaigns(
    db: Any = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    owner_id: Optional[uuid.UUID] = Query(None, description="Filter campaigns by owner UUID"),
):
    """Lists recruitment campaigns. Strictly isolates by authenticated user unless in dev/admin mode."""
    query = db.query(Campaign)
    if current_user_id != DEV_USER_ID:
        query = query.filter_by(owner_id=current_user_id)
    elif owner_id is not None:
        query = query.filter_by(owner_id=owner_id)

    campaigns = query.all()
    results = []
    for c in campaigns:
        ds_count = db.query(Dataset).filter_by(campaign_id=c.id).count() if hasattr(db, "query") else 0
        results.append(
            CampaignResponse(
                id=c.id,
                name=c.name,
                owner_id=str(c.owner_id),
                created_at=c.created_at,
                total_datasets=ds_count,
            )
        )
    return results


@router.get("/{campaign_id}", response_model=CampaignDetailResponse)
def get_campaign(
    campaign_id: int,
    db: Any = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Retrieves a specific campaign with its associated uploaded datasets."""
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Campaign Not Found", "message": f"Campaign with ID {campaign_id} does not exist."},
        )

    if current_user_id != DEV_USER_ID and campaign.owner_id != current_user_id:
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
        owner_id=str(campaign.owner_id),
        created_at=campaign.created_at,
        total_datasets=len(datasets),
        datasets=datasets_repr,
    )


@router.delete("/{campaign_id}", status_code=status.HTTP_200_OK)
def delete_campaign(
    campaign_id: int,
    db: Any = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    """Deletes a campaign and cascades deletion to linked datasets."""
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Campaign Not Found", "message": f"Campaign with ID {campaign_id} does not exist."},
        )

    if current_user_id != DEV_USER_ID and campaign.owner_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Access Forbidden", "message": "You do not have permission to delete this campaign."},
        )

    db.delete(campaign)
    return {"status": "success", "message": f"Campaign {campaign_id} deleted."}


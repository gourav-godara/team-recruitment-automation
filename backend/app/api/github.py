"""API endpoints for candidate GitHub profile inspection and signal enrichment."""

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.app.services.github_service import GitHubProfileData, GitHubService

router = APIRouter()
github_service = GitHubService()


class GitHubEnrichRequest(BaseModel):
    url_or_username: str = Field(..., description="GitHub URL or candidate username")
    force_refresh: bool = Field(False, description="Whether to bypass the in-memory cache")


class GitHubEnrichResponse(BaseModel):
    profile: Dict[str, Any]
    signals: Dict[str, Any]


@router.get("/profile", response_model=Dict[str, Any])
def get_github_profile(
    url_or_username: str = Query(..., description="Candidate GitHub profile URL or handle"),
    force_refresh: bool = Query(False, description="Bypass cache"),
):
    """Fetches public developer profile metrics from GitHub."""
    profile = github_service.fetch_profile(url_or_username, force_refresh=force_refresh)
    return profile.to_dict()


@router.post("/enrich", response_model=GitHubEnrichResponse)
def enrich_github_signals(payload: GitHubEnrichRequest):
    """Enriches candidate profile and generates Core Decision Engine signals."""
    profile = github_service.fetch_profile(payload.url_or_username, force_refresh=payload.force_refresh)
    signals = github_service.to_decision_signals(profile)
    return {
        "profile": profile.to_dict(),
        "signals": {k: v.model_dump() for k, v in signals.items()},
    }

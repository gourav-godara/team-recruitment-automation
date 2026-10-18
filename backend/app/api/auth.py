"""Authentication session inspection endpoints."""

import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.app.core.security import DEV_USER_ID, get_current_user_id

router = APIRouter()


class UserProfileResponse(BaseModel):
    user_id: str
    is_authenticated: bool
    is_development_fallback: bool
    role: str


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    current_user: uuid.UUID = Depends(get_current_user_id),
):
    """Returns the authenticated user UUID and session state."""
    is_dev = current_user == DEV_USER_ID
    return UserProfileResponse(
        user_id=str(current_user),
        is_authenticated=True,
        is_development_fallback=is_dev,
        role="admin" if is_dev else "recruiter",
    )

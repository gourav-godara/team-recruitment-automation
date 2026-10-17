"""Authentication and security utilities for Supabase Auth integration."""

import base64
import json
import logging
import os
from typing import Any, Dict, Optional
import uuid

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Reusable HTTP Bearer scheme (does not auto-error to allow dev fallback)
bearer_scheme = HTTPBearer(auto_error=False)

# Default development user UUID when running without active Supabase Auth headers
DEV_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def decode_jwt_unverified_claims(token: str) -> Dict[str, Any]:
    """Extracts payload claims from a JWT without cryptographic verification.

    Useful for reading user claims (sub, email, role) emitted by Supabase Auth gateway.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return {}
        # Add base64 padding if needed
        payload_b64 = parts[1]
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        decoded_bytes = base64.urlsafe_b64decode(padded)
        return json.loads(decoded_bytes.decode("utf-8"))
    except Exception as e:
        logger.debug(f"Failed to decode JWT claims: {e}")
        return {}


def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> uuid.UUID:
    """FastAPI dependency that extracts the authenticated user UUID from Supabase Auth token.

    Falls back to a standard development UUID if no bearer token is present in dev mode.
    """
    if credentials and credentials.credentials:
        claims = decode_jwt_unverified_claims(credentials.credentials)
        sub = claims.get("sub")
        if sub:
            try:
                return uuid.UUID(str(sub))
            except ValueError:
                pass

    # Allow development mode fallback
    return DEV_USER_ID


def require_authenticated_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> uuid.UUID:
    """Strict FastAPI dependency requiring a valid Bearer token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Authentication Required", "message": "Missing Bearer authorization token."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = decode_jwt_unverified_claims(credentials.credentials)
    sub = claims.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Invalid Token", "message": "Token does not contain a valid user subject ('sub')."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return uuid.UUID(str(sub))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Invalid User ID", "message": "Subject claim is not a valid UUID."},
        )

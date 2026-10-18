"""Authentication and security utilities for Supabase Auth integration."""

import base64
import hashlib
import hmac
import json
import logging
import os
import time
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


def _b64url_decode(s: str) -> bytes:
    """Decodes a base64url string with proper padding."""
    padded = s + "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(padded)


def _b64url_encode(data: bytes) -> str:
    """Encodes bytes to base64url without padding '=' characters."""
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def create_test_jwt(
    sub: str,
    email: str = "recruiter@example.com",
    role: str = "authenticated",
    secret: Optional[str] = None,
    expires_in: int = 3600,
) -> str:
    """Helper to generate standard Supabase-compatible HS256 JWT tokens for testing."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "sub": sub,
        "email": email,
        "role": role,
        "aud": "authenticated",
        "iat": now,
        "exp": now + expires_in,
    }
    h_b64 = _b64url_encode(json.dumps(header).encode("utf-8"))
    p_b64 = _b64url_encode(json.dumps(payload).encode("utf-8"))
    signing_input = f"{h_b64}.{p_b64}".encode("utf-8")

    jwt_secret = secret or settings.SUPABASE_JWT_SECRET or "dev-insecure-secret"
    sig = hmac.new(jwt_secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(sig)
    return f"{h_b64}.{p_b64}.{sig_b64}"


def decode_jwt_token(token: str, verify_signature: bool = True) -> Dict[str, Any]:
    """Decodes and validates a Supabase Auth JWT token.

    If SUPABASE_JWT_SECRET is configured and verify_signature is True, cryptographically
    verifies the HS256 HMAC signature and checks token expiration.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT token format: expected header.payload.signature")

    header_b64, payload_b64, sig_b64 = parts

    # Cryptographic verification if secret is present
    if settings.SUPABASE_JWT_SECRET and verify_signature:
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(
            settings.SUPABASE_JWT_SECRET.encode("utf-8"),
            signing_input,
            hashlib.sha256,
        ).digest()
        actual_sig = _b64url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            raise ValueError("Invalid JWT signature: token verification failed")

    # Decode payload
    try:
        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception as e:
        raise ValueError(f"Malformed JWT payload: {e}")

    # Check expiration if present
    if "exp" in payload and payload["exp"] < time.time():
        raise ValueError("JWT token has expired")

    return payload


def decode_jwt_unverified_claims(token: str) -> Dict[str, Any]:
    """Extracts payload claims from a JWT without cryptographic verification."""
    try:
        return decode_jwt_token(token, verify_signature=False)
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
        try:
            claims = decode_jwt_token(credentials.credentials, verify_signature=bool(settings.SUPABASE_JWT_SECRET))
            sub = claims.get("sub")
            if sub:
                return uuid.UUID(str(sub))
        except Exception as e:
            logger.warning(f"Error extracting user from token: {e}")
            # If in strict production, error out; in dev fallback, log and fall through
            if settings.SUPABASE_JWT_SECRET:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={"error": "Authentication Failed", "message": str(e)},
                    headers={"WWW-Authenticate": "Bearer"},
                )

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

    try:
        claims = decode_jwt_token(credentials.credentials, verify_signature=bool(settings.SUPABASE_JWT_SECRET))
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Invalid Token", "message": str(ve)},
            headers={"WWW-Authenticate": "Bearer"},
        )

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

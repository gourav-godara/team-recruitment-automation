"""Anonymous session management for public, no-login usage.

Provides cryptographically secure session generation, extraction from HttpOnly cookies or
X-Session-ID headers, and automatic response header/cookie injection.
"""

import re
import secrets
from typing import Optional

from fastapi import Request, Response

from backend.app.core.config import settings

# Session ID format: 32 bytes URL-safe base64 (alphanumeric + '-' + '_', length 43-44)
SESSION_REGEX = re.compile(r"^[A-Za-z0-9_\-]{20,64}$")


def generate_session_id() -> str:
    """Generates an unpredictable, cryptographically random session identifier."""
    return secrets.token_urlsafe(32)


def validate_session_id(session_id: Optional[str]) -> Optional[str]:
    """Validates session ID format to prevent header injection or malformed tokens."""
    if not session_id or not isinstance(session_id, str):
        return None
    session_id = session_id.strip()
    if SESSION_REGEX.match(session_id):
        return session_id
    return None


def get_session_id(request: Request) -> str:
    """FastAPI dependency extracting the anonymous session ID.

    Checks:
    1. HttpOnly cookie ('recruitment_session_id')
    2. 'X-Session-ID' HTTP header
    3. Generates a new session ID if neither is present.
    """
    # 1. Check if already determined in request.state
    if hasattr(request.state, "session_id") and request.state.session_id:
        return request.state.session_id

    # 2. Check Header (explicit header takes priority for API clients/tests)
    header_val = request.headers.get("X-Session-ID")
    valid_id = validate_session_id(header_val)

    # 3. Check Cookie (browser session persistence)
    if not valid_id:
        cookie_val = request.cookies.get(getattr(settings, "SESSION_COOKIE_NAME", "recruitment_session_id"))
        valid_id = validate_session_id(cookie_val)

    # 4. Generate new if not provided or invalid
    if not valid_id:
        valid_id = generate_session_id()
        request.state.is_new_session = True
    else:
        request.state.is_new_session = False

    request.state.session_id = valid_id
    return valid_id


def attach_session_cookie(response: Response, session_id: str, request: Optional[Request] = None):
    """Attaches HttpOnly session cookie and X-Session-ID header to an outgoing response."""
    cookie_name = getattr(settings, "SESSION_COOKIE_NAME", "recruitment_session_id")
    max_age = getattr(settings, "SESSION_MAX_AGE_SECONDS", 7 * 24 * 3600)
    secure = getattr(settings, "SESSION_COOKIE_SECURE", False)
    samesite = getattr(settings, "SESSION_COOKIE_SAMESITE", "lax")

    # If request is over HTTPS, ensure secure flag is true
    if request and request.url.scheme == "https":
        secure = True

    response.set_cookie(
        key=cookie_name,
        value=session_id,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path="/",
    )
    response.headers["X-Session-ID"] = session_id

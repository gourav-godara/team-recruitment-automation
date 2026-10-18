"""Format and syntax validators for email and URL attributes."""

import re
from typing import Optional
from urllib.parse import urlparse

# RFC 5322-compliant simplified email pattern
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$"
)

# Valid GitHub username: 1-39 chars, alphanumeric or single hyphen, cannot start/end with hyphen
GITHUB_USERNAME_REGEX = re.compile(
    r"^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$"
)


def is_valid_email(email: Optional[str]) -> bool:
    """Validate email address format.

    Returns True if email is non-empty, contains valid local and domain parts,
    and has a valid top-level domain without spaces or disallowed characters.
    """
    if not email or not isinstance(email, str):
        return False

    email = email.strip()
    if len(email) > 254 or " " in email:
        return False

    if not EMAIL_REGEX.match(email):
        return False

    # Check for consecutive dots in local part or domain
    parts = email.split("@")
    if len(parts) != 2:
        return False
    local, domain = parts
    if ".." in local or ".." in domain:
        return False

    # Check top-level domain length (at least 2 letters)
    domain_labels = domain.split(".")
    if len(domain_labels) < 2 or len(domain_labels[-1]) < 2:
        return False

    return True


def is_valid_url(url: Optional[str]) -> bool:
    """Check if a string is a well-formed HTTP or HTTPS URL."""
    if not url or not isinstance(url, str):
        return False

    val = url.strip()
    if " " in val:
        return False

    try:
        parsed = urlparse(val)
        if parsed.scheme.lower() not in ("http", "https"):
            return False
        if not parsed.netloc:
            return False
        # Domain must contain at least one dot or be localhost
        if "." not in parsed.netloc and parsed.netloc.lower() != "localhost":
            return False
        return True
    except Exception:
        return False


def is_secure_url(url: Optional[str]) -> bool:
    """Check if URL uses HTTPS rather than unencrypted HTTP."""
    if not url or not isinstance(url, str):
        return False
    return url.strip().lower().startswith("https://")


def is_valid_github_url(url: Optional[str]) -> bool:
    """Validate that the URL points to a legitimate GitHub profile or repository.

    Requires http/https scheme, github.com domain, and a non-empty, valid handle path.
    """
    if not is_valid_url(url):
        return False

    parsed = urlparse(url.strip())
    domain = parsed.netloc.lower()
    if domain not in ("github.com", "www.github.com"):
        return False

    path_segments = [seg for seg in parsed.path.strip("/").split("/") if seg]
    if not path_segments:
        return False

    # First segment of path is the username / organization handle
    handle = path_segments[0]
    return bool(GITHUB_USERNAME_REGEX.match(handle))


def is_valid_linkedin_url(url: Optional[str]) -> bool:
    """Validate that the URL points to a legitimate LinkedIn profile."""
    if not is_valid_url(url):
        return False

    parsed = urlparse(url.strip())
    domain = parsed.netloc.lower()
    if domain != "linkedin.com" and not domain.endswith(".linkedin.com"):
        return False

    path_segments = [seg for seg in parsed.path.strip("/").split("/") if seg]
    # LinkedIn profiles typically have /in/<username> or similar path
    return len(path_segments) >= 1


def is_valid_portfolio_url(url: Optional[str]) -> bool:
    """Validate personal portfolio or website URL."""
    return is_valid_url(url)

"""Conservative profile URL and handle normalization."""

import re
from typing import Any, Optional, Tuple

# Common placeholders that indicate absent data rather than real usernames
NEGATIVE_PLACEHOLDERS = {
    "", "none", "n/a", "na", "null", "-", "--", "nil", "no", "false", "undefined", "not available"
}


class LinkNormalizer:
    """Normalizes GitHub, LinkedIn, and portfolio links conservatively without inventing data."""

    # Valid GitHub username: 1-39 characters, alphanumeric or single hyphens, cannot start/end with hyphen
    GITHUB_USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$")

    @classmethod
    def normalize_github(cls, raw: Any) -> Tuple[Optional[str], Optional[str]]:
        """Normalize GitHub profile to (canonical_url, sanitized_username).

        Returns:
            (canonical_url, username) if valid.
            (raw_value, None) if URL is unparseable (preserves raw for review).
            (None, None) if absent or placeholder.
        """
        if raw is None:
            return None, None

        val = str(raw).strip()
        if not val or val.lower() in NEGATIVE_PLACEHOLDERS:
            return None, None

        # Handle @handle format
        if val.startswith("@"):
            handle = val[1:].strip()
            if cls.GITHUB_USERNAME_REGEX.match(handle):
                return f"https://github.com/{handle}", handle
            return val, None

        # Check if full URL or domain URL: github.com/username or https://github.com/username
        url_match = re.match(
            r"^(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_\-]+)(?:/.*)?$",
            val,
            re.IGNORECASE,
        )
        if url_match:
            candidate = url_match.group(1).strip()
            if cls.GITHUB_USERNAME_REGEX.match(candidate):
                return f"https://github.com/{candidate}", candidate
            # If path segment exists but fails username regex (e.g. org/repo or weird chars)
            return val, None

        # Check if bare string looks like a valid GitHub username
        if cls.GITHUB_USERNAME_REGEX.match(val) and "/" not in val and "." not in val:
            return f"https://github.com/{val}", val

        # If it doesn't match standard patterns, preserve raw string without inventing username
        return val, None

    @classmethod
    def normalize_linkedin(cls, raw: Any) -> Optional[str]:
        """Normalize LinkedIn URL to canonical format.

        Returns:
            Canonical LinkedIn URL if recognizable.
            Original raw string if unparseable.
            None if absent or placeholder.
        """
        if raw is None:
            return None

        val = str(raw).strip()
        if not val or val.lower() in NEGATIVE_PLACEHOLDERS:
            return None

        # Remove trailing slashes
        clean_val = val.rstrip("/")

        # Format: linkedin.com/in/... or https://www.linkedin.com/in/...
        match = re.match(
            r"^(?:https?://)?(?:www\.)?linkedin\.com/(in/[a-zA-Z0-9_\-]+.*)$",
            clean_val,
            re.IGNORECASE,
        )
        if match:
            path = match.group(1)
            return f"https://www.linkedin.com/{path}"

        if clean_val.startswith("in/"):
            return f"https://www.linkedin.com/{clean_val}"

        if clean_val.startswith("http://") or clean_val.startswith("https://"):
            return clean_val

        # If bare domain without protocol (e.g. linkedin.com/pub/...)
        if "linkedin.com" in clean_val.lower():
            return f"https://{clean_val}"

        # Otherwise preserve raw string without guessing
        return clean_val

    @classmethod
    def normalize_portfolio(cls, raw: Any) -> Optional[str]:
        """Normalize personal portfolio or website URL.

        Returns:
            URL with protocol prepended if recognized as domain.
            Original string if unparseable.
            None if absent or placeholder.
        """
        if raw is None:
            return None

        val = str(raw).strip()
        if not val or val.lower() in NEGATIVE_PLACEHOLDERS:
            return None

        if val.startswith("http://") or val.startswith("https://"):
            return val

        # If looks like a domain (e.g. myportfolio.com, dev.io/me)
        if re.match(r"^[a-zA-Z0-9_\-]+\.[a-zA-Z]{2,}(?:/.*)?$", val):
            return f"https://{val}"

        return val

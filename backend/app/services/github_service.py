"""GitHub profile enrichment service for candidate scoring and signal generation."""

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
import logging
import os
import re
from typing import Any, Dict, List, Optional, Tuple
import httpx

from backend.app.core.config import settings
from backend.app.schemas.scoring import SignalState, SignalValue

logger = logging.getLogger(__name__)

# Common placeholders that indicate missing data
NEGATIVE_PLACEHOLDERS = {
    "", "none", "n/a", "na", "null", "-", "--", "nil", "no", "false", "undefined", "not available"
}

GITHUB_USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$")


@dataclass
class GitHubProfileData:
    """Structured candidate GitHub profile metrics."""

    username: str
    canonical_url: str
    valid: bool
    public_repos: int = 0
    followers: int = 0
    total_stars: int = 0
    top_languages: List[str] = field(default_factory=list)
    account_created_at: Optional[str] = None
    account_age_years: float = 0.0
    composite_score: float = 0.0  # Normalized [0, 100]
    status: str = "ok"  # 'ok', 'not_found', 'rate_limited', 'error', 'invalid'
    error_message: Optional[str] = None
    fetched_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class GitHubService:
    """Enriches candidate profiles with real or cached GitHub developer metrics."""

    _cache: Dict[str, Tuple[datetime, GitHubProfileData]] = {}
    CACHE_TTL_SECONDS = 3600  # 1 hour in-memory cache

    def __init__(
        self,
        token: Optional[str] = None,
        timeout: Optional[float] = None,
        client: Optional[httpx.Client] = None,
    ):
        self.token = token or getattr(settings, "GITHUB_TOKEN", None)
        self.timeout = timeout or getattr(settings, "GITHUB_API_TIMEOUT", 8.0)
        self._client = client

    @classmethod
    def extract_username(cls, raw: Any) -> Tuple[Optional[str], Optional[str]]:
        """Extracts (canonical_url, username) from a raw GitHub URL or handle.

        Returns:
            (canonical_url, username) if valid.
            (None, None) if absent or placeholder.
            (raw_string, None) if unparseable/invalid.
        """
        if raw is None:
            return None, None

        val = str(raw).strip()
        if not val or val.lower() in NEGATIVE_PLACEHOLDERS:
            return None, None

        if val.startswith("@"):
            handle = val[1:].strip()
            if GITHUB_USERNAME_REGEX.match(handle):
                return f"https://github.com/{handle}", handle
            return val, None

        url_match = re.match(
            r"^(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_\-]+)/?(?:[?#].*)?$",
            val,
            re.IGNORECASE,
        )
        if url_match:
            candidate = url_match.group(1).strip()
            if GITHUB_USERNAME_REGEX.match(candidate):
                return f"https://github.com/{candidate}", candidate
            return val, None

        if GITHUB_USERNAME_REGEX.match(val) and "/" not in val and "." not in val:
            return f"https://github.com/{val}", val

        return val, None

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Team-Recruitment-Automation-Backend/2.0",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def fetch_profile(self, url_or_username: str, force_refresh: bool = False) -> GitHubProfileData:
        """Fetches public developer metrics for a candidate GitHub handle or URL."""
        canonical_url, username = self.extract_username(url_or_username)

        if not username:
            return GitHubProfileData(
                username=str(url_or_username or ""),
                canonical_url=canonical_url or "",
                valid=False,
                status="invalid",
                error_message="Invalid or missing GitHub username",
            )

        cache_key = username.lower()
        now = datetime.now(timezone.utc)

        # Check cache
        if not force_refresh and cache_key in self._cache:
            cached_time, cached_profile = self._cache[cache_key]
            if (now - cached_time).total_seconds() < self.CACHE_TTL_SECONDS:
                return cached_profile

        # Network fetch
        try:
            profile = self._execute_fetch(username, canonical_url or f"https://github.com/{username}")
            self._cache[cache_key] = (now, profile)
            return profile
        except Exception as e:
            logger.warning(f"Error fetching GitHub data for {username}: {e}")
            err_profile = GitHubProfileData(
                username=username,
                canonical_url=canonical_url or f"https://github.com/{username}",
                valid=False,
                status="error",
                error_message=str(e),
            )
            return err_profile

    def _execute_fetch(self, username: str, canonical_url: str) -> GitHubProfileData:
        """Executes HTTP queries to GitHub REST API."""
        headers = self._get_headers()
        client = self._client or httpx.Client(timeout=self.timeout)

        user_url = f"https://api.github.com/users/{username}"
        repos_url = f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated"

        close_client = self._client is None
        try:
            user_resp = client.get(user_url, headers=headers)

            if user_resp.status_code == 404:
                return GitHubProfileData(
                    username=username,
                    canonical_url=canonical_url,
                    valid=False,
                    status="not_found",
                    error_message=f"GitHub user '{username}' not found",
                )
            elif user_resp.status_code in (403, 429):
                return GitHubProfileData(
                    username=username,
                    canonical_url=canonical_url,
                    valid=False,
                    status="rate_limited",
                    error_message="GitHub API rate limit exceeded",
                )
            elif user_resp.status_code != 200:
                return GitHubProfileData(
                    username=username,
                    canonical_url=canonical_url,
                    valid=False,
                    status="error",
                    error_message=f"GitHub API returned HTTP {user_resp.status_code}",
                )

            user_data = user_resp.json()
            public_repos = int(user_data.get("public_repos", 0))
            followers = int(user_data.get("followers", 0))
            created_at_str = user_data.get("created_at")

            account_age_years = 0.0
            if created_at_str:
                try:
                    dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                    account_age_years = max((datetime.now(timezone.utc) - dt).days / 365.25, 0.0)
                except Exception:
                    pass

            # Fetch repositories to compute stars and top languages
            total_stars = 0
            languages_count: Dict[str, int] = {}

            try:
                repos_resp = client.get(repos_url, headers=headers)
                if repos_resp.status_code == 200:
                    repos_data = repos_resp.json()
                    if isinstance(repos_data, list):
                        for r in repos_data:
                            if not r.get("fork", False):  # Focus on original repos
                                total_stars += int(r.get("stargazers_count", 0))
                                lang = r.get("language")
                                if lang:
                                    languages_count[lang] = languages_count.get(lang, 0) + 1
            except Exception as e:
                logger.debug(f"Could not fetch repos for {username}: {e}")

            sorted_languages = sorted(languages_count.keys(), key=lambda l: languages_count[l], reverse=True)[:5]

            # Calculate composite score [0, 100]
            composite_score = self.calculate_composite_score(
                public_repos=public_repos,
                total_stars=total_stars,
                followers=followers,
                account_age_years=account_age_years,
            )

            return GitHubProfileData(
                username=username,
                canonical_url=canonical_url,
                valid=True,
                public_repos=public_repos,
                followers=followers,
                total_stars=total_stars,
                top_languages=sorted_languages,
                account_created_at=created_at_str,
                account_age_years=round(account_age_years, 2),
                composite_score=round(composite_score, 2),
                status="ok",
            )
        finally:
            if close_client:
                client.close()

    @staticmethod
    def calculate_composite_score(
        public_repos: int,
        total_stars: int,
        followers: int,
        account_age_years: float,
    ) -> float:
        """Calculates a bounded [0, 100] technical score based on public developer activity.

        Weighting breakdown:
        - Repositories (up to 30 pts): 3.0 pts per repo (caps at 10 original repos)
        - Stars (up to 35 pts): 7.0 pts per star (caps at 5 stars)
        - Followers (up to 20 pts): 4.0 pts per follower (caps at 5 followers)
        - Experience/Longevity (up to 15 pts): 5.0 pts per year active (caps at 3 years)
        """
        repo_pts = min(max(public_repos, 0) * 3.0, 30.0)
        star_pts = min(max(total_stars, 0) * 7.0, 35.0)
        follower_pts = min(max(followers, 0) * 4.0, 20.0)
        age_pts = min(max(account_age_years, 0.0) * 5.0, 15.0)

        total = repo_pts + star_pts + follower_pts + age_pts
        return min(max(total, 0.0), 100.0)

    def to_decision_signals(self, profile: GitHubProfileData) -> Dict[str, SignalValue]:
        """Converts GitHub metrics into standardized SignalValues for the Core Decision Engine."""
        if profile.status == "ok" and profile.valid:
            evidence = (
                f"GitHub @{profile.username}: {profile.public_repos} repos, "
                f"{profile.total_stars} stars, {profile.followers} followers. "
                f"Top languages: {', '.join(profile.top_languages) if profile.top_languages else 'None'}."
            )
            return {
                "github": SignalValue(
                    value=profile.composite_score,
                    status=SignalState.PRESENT,
                    confidence=0.9,
                    reason=evidence,
                ),
                "github_repos": SignalValue(
                    value=float(profile.public_repos),
                    status=SignalState.PRESENT,
                    confidence=0.95,
                    reason=f"{profile.public_repos} public repositories.",
                ),
                "github_stars": SignalValue(
                    value=float(profile.total_stars),
                    status=SignalState.PRESENT,
                    confidence=0.95,
                    reason=f"{profile.total_stars} total repository stars.",
                ),
                "github_followers": SignalValue(
                    value=float(profile.followers),
                    status=SignalState.PRESENT,
                    confidence=0.95,
                    reason=f"{profile.followers} followers.",
                ),
            }
        elif profile.status == "not_found":
            return {
                "github": SignalValue(
                    value=None,
                    status=SignalState.INVALID,
                    confidence=0.8,
                    reason=profile.error_message or "GitHub user not found.",
                )
            }
        elif profile.status == "rate_limited":
            return {
                "github": SignalValue(
                    value=None,
                    status=SignalState.FLAGGED,
                    confidence=0.3,
                    reason="GitHub API rate limit exceeded. Verification deferred.",
                )
            }
        else:
            return {
                "github": SignalValue(
                    value=None,
                    status=SignalState.MISSING,
                    confidence=1.0,
                    reason="No valid GitHub profile provided.",
                )
            }

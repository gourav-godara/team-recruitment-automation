"""Tests for GitHub profile enrichment service and API endpoints."""

from unittest.mock import MagicMock, patch
import httpx
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.scoring import SignalState
from backend.app.services.github_service import (
    GitHubProfileData,
    GitHubService,
)


@pytest.fixture
def client():
    return TestClient(app)


def test_extract_username_various_formats():
    """Verify conservative extraction of username from various URL formats."""
    # Standard URLs
    assert GitHubService.extract_username("https://github.com/torvalds") == ("https://github.com/torvalds", "torvalds")
    assert GitHubService.extract_username("https://github.com/octocat/") == ("https://github.com/octocat", "octocat")
    assert GitHubService.extract_username("http://www.github.com/alice") == ("https://github.com/alice", "alice")

    # Handles & bare usernames
    assert GitHubService.extract_username("@bob") == ("https://github.com/bob", "bob")
    assert GitHubService.extract_username("charlie-dev") == ("https://github.com/charlie-dev", "charlie-dev")

    # Placeholders & missing
    assert GitHubService.extract_username(None) == (None, None)
    assert GitHubService.extract_username("") == (None, None)
    assert GitHubService.extract_username("   ") == (None, None)
    assert GitHubService.extract_username("N/A") == (None, None)
    assert GitHubService.extract_username("none") == (None, None)
    assert GitHubService.extract_username("-") == (None, None)
    assert GitHubService.extract_username("null") == (None, None)

    # Invalid characters / organizations deep paths
    raw_val, user = GitHubService.extract_username("https://github.com/org/repo/subpath")
    assert user is None


def test_composite_score_calculation():
    """Verify bounded [0, 100] technical score computation."""
    # Zero activity
    score_zero = GitHubService.calculate_composite_score(0, 0, 0, 0.0)
    assert score_zero == 0.0

    # Intermediate activity: 5 repos (15 pts), 2 stars (14 pts), 2 followers (8 pts), 1 year (5 pts) = 42 pts
    score_mid = GitHubService.calculate_composite_score(5, 2, 2, 1.0)
    assert score_mid == 42.0

    # Maximum caps reached
    score_max = GitHubService.calculate_composite_score(20, 10, 10, 5.0)
    assert score_max == 100.0

    # Negative inputs bounded at 0
    score_neg = GitHubService.calculate_composite_score(-5, -2, -1, -3.0)
    assert score_neg == 0.0


def test_fetch_profile_success_mocked():
    """Verify successful profile fetch and repository star aggregation."""
    mock_client = MagicMock(spec=httpx.Client)

    # Mock user response
    mock_user_resp = MagicMock()
    mock_user_resp.status_code = 200
    mock_user_resp.json.return_value = {
        "login": "octocat",
        "public_repos": 8,
        "followers": 15,
        "created_at": "2020-01-01T00:00:00Z",
    }

    # Mock repos response
    mock_repos_resp = MagicMock()
    mock_repos_resp.status_code = 200
    mock_repos_resp.json.return_value = [
        {"name": "repo1", "stargazers_count": 5, "language": "Python", "fork": False},
        {"name": "repo2", "stargazers_count": 10, "language": "TypeScript", "fork": False},
        {"name": "repo3", "stargazers_count": 2, "language": "Python", "fork": True},  # Forked, should be excluded
    ]

    def mock_get(url, **kwargs):
        if "repos" in url:
            return mock_repos_resp
        return mock_user_resp

    mock_client.get.side_effect = mock_get

    service = GitHubService(client=mock_client)
    profile = service.fetch_profile("https://github.com/octocat", force_refresh=True)

    assert profile.valid is True
    assert profile.username == "octocat"
    assert profile.public_repos == 8
    assert profile.total_stars == 15  # 5 + 10 (forked excluded)
    assert "Python" in profile.top_languages
    assert profile.composite_score > 0.0
    assert profile.status == "ok"


def test_fetch_profile_user_not_found():
    """Verify handling when GitHub user does not exist (HTTP 404)."""
    mock_client = MagicMock(spec=httpx.Client)
    mock_resp = MagicMock()
    mock_resp.status_code = 404
    mock_client.get.return_value = mock_resp

    service = GitHubService(client=mock_client)
    profile = service.fetch_profile("non-existent-user-99999", force_refresh=True)

    assert profile.valid is False
    assert profile.status == "not_found"

    signals = service.to_decision_signals(profile)
    assert signals["github"].status == SignalState.INVALID
    assert signals["github"].value is None


def test_fetch_profile_rate_limited():
    """Verify graceful fallback when GitHub API rate limit is exceeded (HTTP 403)."""
    mock_client = MagicMock(spec=httpx.Client)
    mock_resp = MagicMock()
    mock_resp.status_code = 403
    mock_client.get.return_value = mock_resp

    service = GitHubService(client=mock_client)
    profile = service.fetch_profile("busy-coder", force_refresh=True)

    assert profile.valid is False
    assert profile.status == "rate_limited"

    signals = service.to_decision_signals(profile)
    assert signals["github"].status == SignalState.FLAGGED
    assert signals["github"].confidence == 0.3


def test_to_decision_signals_structure():
    """Verify structure and metadata of signals produced for decision engine."""
    profile = GitHubProfileData(
        username="dev-pro",
        canonical_url="https://github.com/dev-pro",
        valid=True,
        public_repos=12,
        followers=20,
        total_stars=25,
        top_languages=["Rust", "Python"],
        account_age_years=3.5,
        composite_score=85.0,
        status="ok",
    )

    service = GitHubService()
    signals = service.to_decision_signals(profile)

    assert "github" in signals
    assert "github_repos" in signals
    assert "github_stars" in signals
    assert "github_followers" in signals

    assert signals["github"].value == 85.0
    assert signals["github"].status == SignalState.PRESENT
    assert signals["github_repos"].value == 12.0
    assert signals["github_stars"].value == 25.0
    assert signals["github_followers"].value == 20.0
    assert "dev-pro" in signals["github"].reason


def test_caching_avoids_duplicate_network_calls():
    """Verify that multiple fetches of the same user hit cache."""
    mock_client = MagicMock(spec=httpx.Client)
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"login": "cached_user", "public_repos": 3, "followers": 1}
    mock_client.get.return_value = mock_resp

    service = GitHubService(client=mock_client)
    # First call - network
    p1 = service.fetch_profile("cached_user", force_refresh=True)
    initial_call_count = mock_client.get.call_count

    # Second call - cache hit
    p2 = service.fetch_profile("cached_user", force_refresh=False)
    assert p1.username == p2.username
    assert mock_client.get.call_count == initial_call_count  # No additional network requests


def test_github_api_endpoints(client):
    """Verify FastAPI routes for GitHub enrichment."""
    # Test invalid input
    resp_invalid = client.get("/api/v1/github/profile?url_or_username=N/A")
    assert resp_invalid.status_code == 200
    data_inv = resp_invalid.json()
    assert data_inv["valid"] is False

    # Test enrich endpoint with mocked service
    with patch.object(GitHubService, "fetch_profile") as mock_fetch:
        mock_fetch.return_value = GitHubProfileData(
            username="test_api_dev",
            canonical_url="https://github.com/test_api_dev",
            valid=True,
            public_repos=5,
            followers=10,
            total_stars=12,
            composite_score=50.0,
            status="ok",
        )
        post_resp = client.post("/api/v1/github/enrich", json={"url_or_username": "test_api_dev"})
        assert post_resp.status_code == 200
        post_data = post_resp.json()
        assert post_data["profile"]["username"] == "test_api_dev"
        assert post_data["signals"]["github"]["value"] == 50.0
        assert post_data["signals"]["github"]["status"] == "PRESENT"

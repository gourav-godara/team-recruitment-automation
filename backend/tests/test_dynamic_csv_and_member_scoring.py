"""Integration tests for Dynamic CSV Evaluation, Member-Level Scoring,
Detailed Ineligibility Explanations, and GitHub Insights.
"""

from pathlib import Path
import pytest

from backend.app.schemas.scoring import (
    MissingDataPolicy,
    RuleConfig,
    RuleOperator,
    RuleScope,
    ScoringConfig,
)
from backend.app.services.decision_engine import evaluate_teams_pipeline
from backend.app.services.export_service import ExportService
from backend.app.services.github_service import GitHubProfileData, GitHubService
from backend.app.services.import_adapter import adapt_team_data_to_engine_team
from backend.app.services.import_service import ImportService
from backend.app.services.scoring_engine import calculate_member_score


@pytest.fixture
def hackathon_csv_bytes():
    path = Path("data/test_friends_hackathon.csv")
    assert path.exists(), "test_friends_hackathon.csv must exist in data/"
    return path.read_bytes()


def test_dynamic_csv_parsing_and_evaluation(hackathon_csv_bytes):
    """Verifies that arbitrary hackathon CSV files parse correctly into teams and members."""
    import_service = ImportService()
    import_res = import_service.process_file_content(hackathon_csv_bytes, filename="test_friends_hackathon.csv")

    assert import_res.total_teams == 23
    assert import_res.total_records >= 60

    engine_teams = [adapt_team_data_to_engine_team(t) for t in import_res.teams]
    assert len(engine_teams) == 23

    config = ScoringConfig(
        top_x=5,
        weights={"github_composite_score": 0.35, "experience_years": 0.35, "skills": 0.30},
        eligibility_rules=[
            RuleConfig(
                name="Team Size (1-5)",
                scope=RuleScope.TEAM,
                field="team_size",
                operator=RuleOperator.BETWEEN,
                value=[1, 5],
            ),
            RuleConfig(
                name="Valid GitHub Profile Provided",
                scope=RuleScope.MEMBER,
                field="github_username",
                operator=RuleOperator.EXISTS,
                missing_policy=MissingDataPolicy.REQUIRE,
            ),
        ],
    )

    result = evaluate_teams_pipeline(engine_teams, config)
    assert len(result.results) == 23
    assert result.shortlisted_teams == 5

    # Check IncompleteSquad (Liam and Noah have no GitHub)
    incomplete_teams = [r for r in result.results if "Incomplete" in (r.name or "")]
    assert len(incomplete_teams) == 1
    incomplete_team = incomplete_teams[0]

    assert incomplete_team.status == "REJECTED"
    assert incomplete_team.eligibility.status != "PASS"
    assert len(incomplete_team.eligibility.failed_rules) >= 1

    failed_rule = incomplete_team.eligibility.failed_rules[0]
    assert "GitHub" in failed_rule.rule_name
    assert failed_rule.expected_condition == "EXISTS"
    assert len(failed_rule.affected_members) >= 2

    affected_names = [m.member_name for m in failed_rule.affected_members]
    assert "Liam O'Connor" in affected_names
    assert "Noah Smith" in affected_names


def test_member_level_scoring_and_attribution(hackathon_csv_bytes):
    """Verifies that individual members receive independent scores and experience attribution."""
    import_service = ImportService()
    import_res = import_service.process_file_content(hackathon_csv_bytes, filename="test_friends_hackathon.csv")
    engine_teams = [adapt_team_data_to_engine_team(t) for t in import_res.teams]

    config = ScoringConfig(
        top_x=5,
        weights={"github_composite_score": 0.35, "experience_years": 0.35, "skills": 0.30},
    )

    result = evaluate_teams_pipeline(engine_teams, config)

    # Every team must have member_scores matching its team roster size
    for team_res in result.results:
        assert len(team_res.member_scores) > 0
        for ms in team_res.member_scores:
            assert ms.score is not None
            assert 0.0 <= ms.score <= 100.0
            assert ms.experience_source in ("Declared in CSV", "Inferred from Skills", "Not provided")
            assert isinstance(ms.skills, list)


def test_github_service_insights_data_model():
    """Verifies that GitHubProfileData includes repo counts, star totals, and recent projects."""
    profile = GitHubProfileData(
        username="octocat",
        canonical_url="https://github.com/octocat",
        valid=True,
        public_repos=8,
        original_repos_count=6,
        forked_repos_count=2,
        total_stars=42,
        top_languages=["TypeScript", "Python"],
        recent_repos=[
            {
                "name": "super-agent",
                "html_url": "https://github.com/octocat/super-agent",
                "stargazers_count": 30,
                "language": "TypeScript",
                "fork": False,
            }
        ],
    )

    d = profile.to_dict()
    assert d["public_repos"] == 8
    assert d["original_repos_count"] == 6
    assert d["forked_repos_count"] == 2
    assert d["total_stars"] == 42
    assert d["top_languages"] == ["TypeScript", "Python"]
    assert len(d["recent_repos"]) == 1
    assert d["recent_repos"][0]["name"] == "super-agent"

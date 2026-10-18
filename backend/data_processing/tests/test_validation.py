"""Unit tests for Data Validation module."""

import unittest
from mapping.schema_mapper import SchemaMapper
from normalization.normalization_service import NormalizationService
from parsers.csv_parser import CSVParser
from schemas.config import ImportConfig, MissingDataStrategy
from schemas.member import MemberData
from schemas.team import TeamData
from validation import (
    ValidationService,
    is_secure_url,
    is_valid_email,
    is_valid_github_url,
    is_valid_linkedin_url,
    is_valid_portfolio_url,
)


class TestValidators(unittest.TestCase):
    """Test low-level syntax validators for emails and URLs."""

    def test_valid_emails(self):
        valid_emails = [
            "alice@example.com",
            "bob.smith@sub.domain.org",
            "user+tag@domain.co.uk",
            "first_last@tech.io",
        ]
        for email in valid_emails:
            self.assertTrue(is_valid_email(email), f"Expected valid for: {email}")

    def test_invalid_emails(self):
        invalid_emails = [
            "",
            "   ",
            None,
            "plainaddress",
            "@missingusername.com",
            "username@.com",
            "username@domain",
            "user name@domain.com",
            "user..name@domain.com",
            "user@domain..com",
            "user@domain.c",
        ]
        for email in invalid_emails:
            self.assertFalse(is_valid_email(email), f"Expected invalid for: {email}")

    def test_github_url_validation(self):
        self.assertTrue(is_valid_github_url("https://github.com/torvalds"))
        self.assertTrue(is_valid_github_url("http://github.com/alice-dev"))
        self.assertTrue(is_valid_github_url("https://www.github.com/bob123"))

        # Invalid GitHub URLs
        self.assertFalse(is_valid_github_url("not-a-url"))
        self.assertFalse(is_valid_github_url("https://gitlab.com/torvalds"))
        self.assertFalse(is_valid_github_url("https://github.com/"))
        self.assertFalse(is_valid_github_url("https://github.com/-invalid-handle"))

    def test_linkedin_url_validation(self):
        self.assertTrue(is_valid_linkedin_url("https://www.linkedin.com/in/ada-lovelace"))
        self.assertTrue(is_valid_linkedin_url("https://linkedin.com/in/john-doe-123"))

        # Invalid LinkedIn URLs
        self.assertFalse(is_valid_linkedin_url("not-a-url"))
        self.assertFalse(is_valid_linkedin_url("https://twitter.com/ada"))
        self.assertFalse(is_valid_linkedin_url("https://linkedin.com/"))

    def test_portfolio_url_validation(self):
        self.assertTrue(is_valid_portfolio_url("https://alice.dev"))
        self.assertTrue(is_valid_portfolio_url("http://portfolio.example.org/projects"))

        self.assertFalse(is_valid_portfolio_url("not-a-url"))
        self.assertFalse(is_valid_portfolio_url("ftp://example.com"))
        self.assertFalse(is_valid_portfolio_url("http://nodomain"))

    def test_url_security_warning(self):
        self.assertTrue(is_secure_url("https://github.com/alice"))
        self.assertFalse(is_secure_url("http://github.com/alice"))


class TestValidationService(unittest.TestCase):
    """Test ValidationService rules, boundaries, and configuration handling."""

    def setUp(self):
        self.service = ValidationService()

    def test_valid_member_and_team(self):
        member = MemberData(
            id="m-1",
            name="Alice Smith",
            email="alice@example.com",
            github_url="https://github.com/alice",
            skills=["python", "fastapi"],
            experience_years=2.0,
        )
        team = TeamData(
            id="t-1",
            team_name="Alpha",
            members=[member],
            lead_email="alice@example.com",
        )

        validated_team = self.service.validate_team(team)
        self.assertTrue(validated_team.is_valid)
        self.assertEqual(len(validated_team.validation_errors), 0)
        self.assertTrue(member.is_valid)
        self.assertEqual(len(member.validation_errors), 0)

    # --- 1. Required Fields ---

    def test_missing_required_member_name(self):
        member = MemberData(id="m-1", name="", email="alice@example.com")
        team = TeamData(id="t-1", team_name="Alpha", members=[member])

        self.service.validate_team(team)
        self.assertFalse(member.is_valid)
        self.assertFalse(team.is_valid)
        self.assertTrue(any("Missing required member field: 'name'" in e for e in member.validation_errors))

    def test_whitespace_required_member_name(self):
        member = MemberData(id="m-1", name="   ", email="alice@example.com")
        team = TeamData(id="t-1", team_name="Alpha", members=[member])

        self.service.validate_team(team)
        self.assertFalse(member.is_valid)
        self.assertFalse(team.is_valid)

    def test_missing_required_team_name(self):
        member = MemberData(id="m-1", name="Alice", email="alice@example.com")
        team = TeamData(id="t-1", team_name="", members=[member])

        self.service.validate_team(team)
        self.assertFalse(team.is_valid)
        self.assertTrue(any("Missing required team field: 'team_name'" in e for e in team.validation_errors))

    def test_custom_required_member_fields(self):
        config = ImportConfig(required_member_fields=["name", "email", "skills"])
        service = ValidationService(config)

        # Alice has name and email, but empty skills
        member = MemberData(id="m-1", name="Alice", email="alice@example.com", skills=[])
        service.validate_member(member)

        self.assertFalse(member.is_valid)
        self.assertTrue(any("Missing required member field: 'skills'" in e for e in member.validation_errors))

    # --- 2. Team Size Checks ---

    def test_team_size_below_minimum(self):
        config = ImportConfig(min_team_size=2, max_team_size=4)
        service = ValidationService(config)

        m1 = MemberData(id="m-1", name="Alice")
        team = TeamData(id="t-1", team_name="Solo", members=[m1])

        service.validate_team(team)
        self.assertFalse(team.is_valid)
        self.assertTrue(any("below minimum allowed size" in e for e in team.validation_errors))

    def test_team_size_above_maximum(self):
        config = ImportConfig(min_team_size=1, max_team_size=3)
        service = ValidationService(config)

        members = [MemberData(id=f"m-{i}", name=f"Member {i}") for i in range(4)]
        team = TeamData(id="t-1", team_name="BigTeam", members=members)

        service.validate_team(team)
        self.assertFalse(team.is_valid)
        self.assertTrue(any("exceeds maximum allowed size" in e for e in team.validation_errors))

    def test_team_size_exact_boundaries(self):
        config = ImportConfig(min_team_size=2, max_team_size=3)
        service = ValidationService(config)

        m1 = MemberData(id="m-1", name="Alice")
        m2 = MemberData(id="m-2", name="Bob")
        team = TeamData(id="t-1", team_name="BoundaryTeam", members=[m1, m2])

        service.validate_team(team)
        self.assertTrue(team.is_valid)

    # --- 3. Email Validation ---

    def test_malformed_member_email(self):
        member = MemberData(id="m-1", name="Alice", email="not-an-email")
        team = TeamData(id="t-1", team_name="Alpha", members=[member])

        self.service.validate_team(team)
        self.assertFalse(member.is_valid)
        self.assertFalse(team.is_valid)
        self.assertTrue(any("Invalid email format" in e for e in member.validation_errors))

    def test_malformed_lead_email(self):
        member = MemberData(id="m-1", name="Alice", email="alice@example.com")
        team = TeamData(id="t-1", team_name="Alpha", members=[member], lead_email="bad-lead-email")

        self.service.validate_team(team)
        self.assertFalse(team.is_valid)
        self.assertTrue(any("Invalid lead email format" in e for e in team.validation_errors))

    def test_validate_emails_disabled(self):
        config = ImportConfig(validate_emails=False)
        service = ValidationService(config)

        member = MemberData(id="m-1", name="Alice", email="not-an-email")
        team = TeamData(id="t-1", team_name="Alpha", members=[member])

        service.validate_team(team)
        self.assertTrue(member.is_valid)
        self.assertTrue(team.is_valid)

    # --- 4. URL Validation & Insecure Warnings ---

    def test_malformed_github_url(self):
        member = MemberData(id="m-1", name="Alice", github_url="https://notgithub.com/alice")
        self.service.validate_member(member)

        self.assertFalse(member.is_valid)
        self.assertTrue(any("Invalid GitHub URL" in e for e in member.validation_errors))

    def test_insecure_url_generates_warning_not_error(self):
        member = MemberData(id="m-1", name="Alice", github_url="http://github.com/alice")
        self.service.validate_member(member)

        self.assertTrue(member.is_valid)
        self.assertEqual(len(member.validation_errors), 0)
        self.assertTrue(any("Insecure GitHub URL using HTTP" in w for w in member.validation_warnings))

    def test_validate_urls_disabled(self):
        config = ImportConfig(validate_urls=False)
        service = ValidationService(config)

        member = MemberData(id="m-1", name="Alice", github_url="invalid_url_text")
        service.validate_member(member)
        self.assertTrue(member.is_valid)

    # --- 5. Missing Data Strategies ---

    def test_neutral_strategy_preserves_none_and_zero(self):
        config = ImportConfig(missing_data_strategy=MissingDataStrategy.NEUTRAL)
        service = ValidationService(config)

        # Member with explicit 0.0 experience
        m_zero = MemberData(id="m-1", name="Alice", experience_years=0.0)
        service.validate_member(m_zero)
        self.assertEqual(m_zero.experience_years, 0.0)
        self.assertTrue(m_zero.is_valid)

        # Member with None experience
        m_none = MemberData(id="m-2", name="Bob", experience_years=None)
        service.validate_member(m_none)
        self.assertIsNone(m_none.experience_years, "NEUTRAL must preserve missing optional value as None")
        self.assertTrue(m_none.is_valid)
        self.assertEqual(len(m_none.validation_errors), 0)
        self.assertEqual(len(m_none.validation_warnings), 0)

    def test_impute_strategy_fills_configured_defaults(self):
        config = ImportConfig(
            missing_data_strategy=MissingDataStrategy.IMPUTE,
            impute_defaults={"experience_years": 0.0, "education": "Not specified"},
        )
        service = ValidationService(config)

        member = MemberData(id="m-1", name="Alice", experience_years=None, education=None)
        service.validate_member(member)

        self.assertEqual(member.experience_years, 0.0)
        self.assertEqual(member.education, "Not specified")
        self.assertTrue(member.is_valid)
        self.assertTrue(any("Imputed missing field 'experience_years'" in w for w in member.validation_warnings))
        self.assertTrue(any("Imputed missing field 'education'" in w for w in member.validation_warnings))

    def test_flag_for_review_strategy(self):
        config = ImportConfig(missing_data_strategy=MissingDataStrategy.FLAG_FOR_REVIEW)
        service = ValidationService(config)

        member = MemberData(id="m-1", name="Alice", experience_years=None)
        team = TeamData(id="t-1", team_name="Alpha", members=[member])

        service.validate_team(team)
        self.assertTrue(team.is_valid)
        self.assertTrue(team.requires_review, "FLAG_FOR_REVIEW strategy should mark requires_review = True")
        self.assertTrue(any("Missing optional field: 'experience_years'" in w for w in member.validation_warnings))

    def test_strict_strategy_rejects_missing_optional_data(self):
        config = ImportConfig(missing_data_strategy=MissingDataStrategy.STRICT)
        service = ValidationService(config)

        member = MemberData(id="m-1", name="Alice", experience_years=None)
        team = TeamData(id="t-1", team_name="Alpha", members=[member])

        service.validate_team(team)
        self.assertFalse(member.is_valid)
        self.assertFalse(team.is_valid)
        self.assertTrue(any("Missing optional field 'experience_years' rejected" in e for e in member.validation_errors))

    # --- 6. Duplicate Emails ---

    def test_intra_team_duplicate_email(self):
        m1 = MemberData(id="m-1", name="Alice", email="alice@example.com")
        m2 = MemberData(id="m-2", name="Alice Clone", email="ALICE@example.com")
        team = TeamData(id="t-1", team_name="Clones", members=[m1, m2])

        self.service.validate_team(team)
        self.assertFalse(team.is_valid)
        self.assertFalse(m1.is_valid)
        self.assertFalse(m2.is_valid)
        self.assertTrue(any("Duplicate email 'alice@example.com' found within team" in e for e in team.validation_errors))

    def test_cross_team_duplicate_email_disallowed(self):
        config = ImportConfig(allow_cross_team_duplicates=False)
        service = ValidationService(config)

        m1 = MemberData(id="m-1", name="Alice", email="alice@example.com")
        team1 = TeamData(id="t-1", team_name="Team One", members=[m1])

        m2 = MemberData(id="m-2", name="Alice Again", email="alice@example.com")
        team2 = TeamData(id="t-2", team_name="Team Two", members=[m2])

        result = service.validate_teams([team1, team2])

        self.assertFalse(team1.is_valid)
        self.assertFalse(team2.is_valid)
        self.assertFalse(m1.is_valid)
        self.assertFalse(m2.is_valid)
        self.assertEqual(result.valid_teams_count, 0)
        self.assertEqual(result.invalid_teams_count, 2)
        self.assertTrue(any("Cross-team duplicate email" in err for err in result.global_errors))

    def test_cross_team_duplicate_email_allowed(self):
        config = ImportConfig(allow_cross_team_duplicates=True)
        service = ValidationService(config)

        m1 = MemberData(id="m-1", name="Alice", email="alice@example.com")
        team1 = TeamData(id="t-1", team_name="Team One", members=[m1])

        m2 = MemberData(id="m-2", name="Alice Again", email="alice@example.com")
        team2 = TeamData(id="t-2", team_name="Team Two", members=[m2])

        result = service.validate_teams([team1, team2])

        self.assertTrue(team1.is_valid)
        self.assertTrue(team2.is_valid)
        self.assertTrue(m1.is_valid)
        self.assertTrue(m2.is_valid)
        self.assertEqual(result.valid_teams_count, 2)
        self.assertEqual(result.invalid_teams_count, 0)

    # --- 7. ImportResult Summary Stats ---

    def test_validate_teams_import_result_summary(self):
        m1 = MemberData(id="m-1", name="Alice", email="alice@example.com")
        t1 = TeamData(id="t-1", team_name="Team A", members=[m1])

        # Team B has invalid size (0 members)
        t2 = TeamData(id="t-2", team_name="Team B", members=[])

        result = self.service.validate_teams([t1, t2])

        self.assertEqual(result.total_teams, 2)
        self.assertEqual(result.valid_teams_count, 1)
        self.assertEqual(result.invalid_teams_count, 1)
        self.assertEqual(result.summary["total_teams"], 2)
        self.assertEqual(result.summary["valid_teams"], 1)
        self.assertEqual(result.summary["invalid_teams"], 1)
    def test_none_or_blank_emails_not_treated_as_duplicates(self):
        m1 = MemberData(id="m-1", name="Alice", email=None)
        m2 = MemberData(id="m-2", name="Bob", email="")
        m3 = MemberData(id="m-3", name="Charlie", email="   ")
        team = TeamData(id="t-1", team_name="NoEmailsTeam", members=[m1, m2, m3])

        self.service.validate_team(team)
        self.assertTrue(team.is_valid)
        self.assertFalse(any("Duplicate email" in e for e in team.validation_errors))

    def test_validation_idempotence(self):
        member = MemberData(id="m-1", name="", email="not-an-email")
        team = TeamData(id="t-1", team_name="", members=[member])

        # Validate once
        self.service.validate_team(team)
        first_errors = list(team.validation_errors)

        # Validate second time
        self.service.validate_team(team)
        second_errors = list(team.validation_errors)

        self.assertEqual(first_errors, second_errors)

    def test_cross_team_duplicate_email_case_insensitive(self):
        config = ImportConfig(allow_cross_team_duplicates=False)
        service = ValidationService(config)

        m1 = MemberData(id="m-1", name="Alice", email="Alice@Example.COM")
        team1 = TeamData(id="t-1", team_name="Team One", members=[m1])

        m2 = MemberData(id="m-2", name="Alice Again", email="alice@example.com")
        team2 = TeamData(id="t-2", team_name="Team Two", members=[m2])

        result = service.validate_teams([team1, team2])
        self.assertFalse(team1.is_valid)
        self.assertFalse(team2.is_valid)
        self.assertEqual(result.valid_teams_count, 0)

    def test_validate_dict_input(self):
        # ValidationService should seamlessly accept dictionaries
        member_dict = {
            "name": "Alice",
            "email": "alice@example.com",
            "experience_years": 2.5,
        }
        team_dict = {
            "team_name": "DictTeam",
            "members": [member_dict],
        }
        validated_team = self.service.validate_team(team_dict)
        self.assertIsInstance(validated_team, TeamData)
        self.assertTrue(validated_team.is_valid)
        self.assertEqual(validated_team.team_size, 1)

    def test_full_pipeline_csv_to_validation(self):
        # End-to-end integration: CSV -> SchemaMapper -> Normalization -> Validation
        csv_data = (
            "team_name,student_name,email,github,yoe\n"
            "CyberKnights,Alice Smith,alice@example.com,https://github.com/alice,2.0\n"
            "CyberKnights,Bob Jones,bob@example.com,https://github.com/bob,0\n"
            "SoloTeam,Charlie Brown,bad-email,https://github.com/charlie,1.0\n"
        )
        parser = CSVParser()
        raw_teams = parser.parse_string(csv_data)

        mapper = SchemaMapper()
        mapped_teams = mapper.map_teams(raw_teams)

        normalizer = NormalizationService()
        normalized_teams = normalizer.normalize_teams(mapped_teams)

        result = self.service.validate_teams(normalized_teams)

        self.assertEqual(result.total_teams, 2)
        # CyberKnights is valid (size 2, valid emails, valid github, yoe=0 is preserved)
        # SoloTeam is invalid because Charlie's email is 'bad-email'
        self.assertEqual(result.valid_teams_count, 1)
        self.assertEqual(result.invalid_teams_count, 1)

        valid_team = result.get_valid_teams()[0]
        self.assertEqual(valid_team.team_name, "CyberKnights")
        self.assertEqual(valid_team.team_size, 2)
        # Verify 0 yoe is preserved as 0.0
        bob = [m for m in valid_team.members if "Bob" in m.name][0]
        self.assertEqual(bob.experience_years, 0.0)

        invalid_team = result.get_invalid_teams()[0]
        self.assertEqual(invalid_team.team_name, "SoloTeam")
        self.assertFalse(invalid_team.is_valid)


if __name__ == "__main__":
    unittest.main()


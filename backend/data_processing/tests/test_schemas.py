"""Unit tests for Phase 1 schemas."""

import unittest
from schemas import (
    MemberData,
    TeamData,
    ImportConfig,
    MissingDataStrategy,
    ImportResult,
)


class TestSchemas(unittest.TestCase):
    def test_member_data_creation_and_defaults(self):
        member = MemberData(
            id="m-1",
            name="Alice Smith",
            email="alice@example.com",
            github_url="https://github.com/alice",
            github_username="alice",
            skills=["python", "fastapi"],
            experience_years=2.5,
        )
        self.assertEqual(member.name, "Alice Smith")
        self.assertEqual(member.github_username, "alice")
        self.assertTrue(member.is_valid)
        self.assertEqual(len(member.validation_errors), 0)
        self.assertFalse(member.is_lead)
        d = member.to_dict()
        self.assertEqual(d["name"], "Alice Smith")

    def test_team_data_creation(self):
        m1 = MemberData(id="m-1", name="Alice", email="alice@example.com", is_lead=True)
        m2 = MemberData(id="m-2", name="Bob", email="bob@example.com")
        team = TeamData(
            id="t-1",
            team_name="CyberKnights",
            members=[m1, m2],
            lead_email="alice@example.com",
        )
        team.sync_team_size()
        self.assertEqual(team.team_size, 2)
        self.assertEqual(team.get_lead().name, "Alice")
        self.assertTrue(team.is_valid)

    def test_team_size_auto_sync(self):
        m1 = MemberData(id="m-1", name="Alice", email="alice@example.com")
        m2 = MemberData(id="m-2", name="Bob", email="bob@example.com")
        m3 = MemberData(id="m-3", name="Charlie", email="charlie@example.com")
        # Intentionally do NOT call sync_team_size()
        team = TeamData(
            id="t-auto",
            team_name="AutoTeam",
            members=[m1, m2, m3],
        )
        self.assertEqual(team.team_size, 3)

    def test_import_config_defaults(self):
        config = ImportConfig()
        self.assertEqual(config.min_team_size, 1)
        self.assertEqual(config.max_team_size, 4)
        self.assertEqual(config.missing_data_strategy, MissingDataStrategy.NEUTRAL)
        self.assertTrue(config.validate_urls)

    def test_import_result(self):
        m = MemberData(id="m-1", name="Alice")
        t_valid = TeamData(id="t-1", team_name="T1", members=[m], team_size=1, is_valid=True)
        t_invalid = TeamData(id="t-2", team_name="T2", members=[], team_size=0, is_valid=False)
        result = ImportResult(
            total_records=2,
            total_teams=2,
            valid_teams_count=1,
            invalid_teams_count=1,
            teams=[t_valid, t_invalid],
        )
        self.assertEqual(len(result.get_valid_teams()), 1)
        self.assertEqual(len(result.get_invalid_teams()), 1)
        self.assertEqual(result.get_valid_teams()[0].team_name, "T1")


if __name__ == "__main__":
    unittest.main()

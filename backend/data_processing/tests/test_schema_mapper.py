"""Unit tests for SchemaMapper."""

import unittest
from mapping.schema_mapper import SchemaMapper
from schemas.config import ImportConfig


class TestSchemaMapper(unittest.TestCase):
    def test_alias_resolution(self):
        mapper = SchemaMapper()
        raw_team = {
            "group_name": "DataWizards",
            "members": [
                {
                    "candidate_name": "Maya Lin",
                    "mail": "maya@wizards.org",
                    "gh": "https://github.com/mayalin",
                    "tech_stack": "python, pytorch",
                    "yoe": 3,
                    "college": "Stanford",
                    "custom_track": "Fintech",
                }
            ],
        }

        mapped_teams = mapper.map_teams([raw_team])
        self.assertEqual(len(mapped_teams), 1)
        team = mapped_teams[0]
        self.assertEqual(team["team_name"], "DataWizards")

        member = team["members"][0]
        self.assertEqual(member["name"], "Maya Lin")
        self.assertEqual(member["email"], "maya@wizards.org")
        self.assertEqual(member["github_url"], "https://github.com/mayalin")
        self.assertEqual(member["skills"], "python, pytorch")
        self.assertEqual(member["experience_years"], 3)
        self.assertEqual(member["education"], "Stanford")
        # Check custom column preserved in extra_data
        self.assertEqual(member["extra_data"].get("custom_track"), "Fintech")

    def test_custom_column_mapping_override(self):
        config = ImportConfig(
            column_mapping={
                "codebase_repo": "github_url",
                "hacker_handle": "name",
            }
        )
        mapper = SchemaMapper(config=config)
        raw_team = {
            "team_name": "Pioneers",
            "members": [
                {
                    "hacker_handle": "Ada Lovelace",
                    "codebase_repo": "https://github.com/ada",
                }
            ],
        }

        mapped = mapper.map_teams([raw_team])[0]
        member = mapped["members"][0]
        self.assertEqual(member["name"], "Ada Lovelace")
        self.assertEqual(member["github_url"], "https://github.com/ada")

    def test_missing_fields_detection(self):
        mapper = SchemaMapper()
        raw_team = {
            "team_name": "SoloDev",
            "members": [
                {
                    "name": "Sam",
                    # Missing email, github, skills, experience, education
                }
            ],
        }
        mapped = mapper.map_teams([raw_team])[0]
        member = mapped["members"][0]
        self.assertIn("email", member["missing_fields"])
        self.assertIn("github_url", member["missing_fields"])
        self.assertIn("skills", member["missing_fields"])
        self.assertNotIn("name", member["missing_fields"])

    def test_custom_column_mapping_case_and_whitespace_tolerance(self):
        config = ImportConfig(
            column_mapping={
                "  Code Repo  ": "github_url",
                "HACKER_NAME": "name",
            }
        )
        mapper = SchemaMapper(config=config)
        raw_team = {
            "team_name": "OpenSource",
            "members": [
                {
                    "hacker_name": "Linus",
                    "code repo": "https://github.com/torvalds",
                }
            ],
        }
        mapped = mapper.map_teams([raw_team])[0]
        member = mapped["members"][0]
        self.assertEqual(member["name"], "Linus")
        self.assertEqual(member["github_url"], "https://github.com/torvalds")


if __name__ == "__main__":
    unittest.main()

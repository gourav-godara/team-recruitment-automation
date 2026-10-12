"""Unit tests for CSV and JSON parsers."""

import unittest
from parsers import CSVParser, JSONParser, ParsingError


class TestParsers(unittest.TestCase):
    def setUp(self):
        self.csv_parser = CSVParser()
        self.json_parser = JSONParser()

    def test_csv_flat_format(self):
        csv_text = """team_name,name,email,skills
Alpha,Alice,alice@example.com,Python
Alpha,Bob,bob@example.com,React
Beta,Charlie,charlie@example.com,Rust
"""
        teams = self.csv_parser.parse_string(csv_text)
        self.assertEqual(len(teams), 2)
        alpha = next(t for t in teams if t["team_name"] == "Alpha")
        self.assertEqual(len(alpha["members"]), 2)
        self.assertEqual(alpha["members"][0]["name"], "Alice")
        self.assertEqual(alpha["members"][1]["name"], "Bob")

        beta = next(t for t in teams if t["team_name"] == "Beta")
        self.assertEqual(len(beta["members"]), 1)
        self.assertEqual(beta["members"][0]["name"], "Charlie")

    def test_csv_wide_format(self):
        csv_text = """team_name,lead_name,lead_email,member_2_name,member_2_email
CodeStorm,Dave,dave@example.com,Eve,eve@example.com
SoloTeam,Frank,frank@example.com,,
"""
        teams = self.csv_parser.parse_string(csv_text)
        self.assertEqual(len(teams), 2)
        codestorm = next(t for t in teams if t["team_name"] == "CodeStorm")
        self.assertEqual(len(codestorm["members"]), 2)
        self.assertTrue(codestorm["members"][0].get("is_lead"))
        self.assertEqual(codestorm["members"][0]["name"], "Dave")

        soloteam = next(t for t in teams if t["team_name"] == "SoloTeam")
        self.assertEqual(len(soloteam["members"]), 1)

    def test_csv_semicolon_delimiter(self):
        csv_text = "team;name;email\nSquad1;Alice;alice@test.com\nSquad1;Bob;bob@test.com\n"
        teams = self.csv_parser.parse_string(csv_text)
        self.assertEqual(len(teams), 1)
        self.assertEqual(len(teams[0]["members"]), 2)

    def test_json_array_of_teams(self):
        json_text = """[
            {
                "team_name": "Nexus",
                "members": [
                    {"name": "Sarah", "email": "sarah@nexus.io"},
                    {"name": "Leo", "email": "leo@nexus.io"}
                ]
            }
        ]"""
        teams = self.json_parser.parse_string(json_text)
        self.assertEqual(len(teams), 1)
        self.assertEqual(teams[0]["team_name"], "Nexus")
        self.assertEqual(len(teams[0]["members"]), 2)

    def test_json_wrapped_dict(self):
        json_text = """{
            "hackathon": "AI Sprint 2026",
            "teams": [
                {
                    "team_name": "Visionary",
                    "members": [{"name": "Ken"}]
                }
            ]
        }"""
        teams = self.json_parser.parse_string(json_text)
        self.assertEqual(len(teams), 1)
        self.assertEqual(teams[0]["team_name"], "Visionary")

    def test_json_invalid_syntax_raises_parsing_error(self):
        with self.assertRaises(ParsingError):
            self.json_parser.parse_string("{invalid_json: 123")

    def test_csv_flat_distinct_team_id_and_team_name(self):
        csv_text = """team_id,team_name,name,email
T-999,CyberWarriors,Alice,alice@example.com
T-999,CyberWarriors,Bob,bob@example.com
"""
        teams = self.csv_parser.parse_string(csv_text)
        self.assertEqual(len(teams), 1)
        team = teams[0]
        self.assertEqual(team["team_id"], "T-999")
        self.assertEqual(team["team_name"], "CyberWarriors")
        self.assertEqual(len(team["members"]), 2)
        # Verify team_id and team_name are NOT leaked into member attributes
        for member in team["members"]:
            self.assertNotIn("team_id", member)
            self.assertNotIn("team_name", member)
            self.assertIn("name", member)
            self.assertIn("email", member)


if __name__ == "__main__":
    unittest.main()

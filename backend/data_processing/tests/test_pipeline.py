"""Unit and integration tests for Pipeline Orchestrator."""

import json
import tempfile
import unittest
from pathlib import Path

from pipeline import ImportPipeline, PipelineError, PipelineOrchestrator, PipelineStage
from schemas.config import ImportConfig, MissingDataStrategy
from schemas.import_result import ImportResult


class TestPipelineOrchestrator(unittest.TestCase):
    """Test end-to-end pipeline orchestration across parsing, mapping, normalization, and validation."""

    def setUp(self):
        self.orchestrator = PipelineOrchestrator()

    # --- 1. Valid CSV Input ---

    def test_valid_csv_file(self):
        csv_content = (
            "team_name,full_name,email,github,yoe,skills\n"
            "CodeWarriors,Alice Smith,alice@example.com,https://github.com/alice,3.5,Python; FastAPI\n"
            "CodeWarriors,Bob Jones,bob@example.com,https://github.com/bob,2.0,React; TypeScript\n"
        )
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8") as f:
            f.write(csv_content)
            temp_path = f.name

        try:
            result = self.orchestrator.process_file(temp_path)

            self.assertIsInstance(result, ImportResult)
            self.assertEqual(result.total_teams, 1)
            self.assertEqual(result.total_records, 2)
            self.assertEqual(result.valid_teams_count, 1)
            self.assertEqual(result.invalid_teams_count, 0)
            self.assertEqual(len(result.global_errors), 0)
            self.assertEqual(result.summary["pipeline_status"], "SUCCESS")

            team = result.teams[0]
            self.assertTrue(team.is_valid)
            self.assertEqual(team.team_name, "CodeWarriors")
            self.assertEqual(team.team_size, 2)

            alice = team.members[0]
            self.assertEqual(alice.name, "Alice Smith")
            self.assertEqual(alice.email, "alice@example.com")
            self.assertEqual(alice.github_username, "alice")
            self.assertEqual(alice.experience_years, 3.5)
            self.assertEqual(alice.skills, ["python", "fastapi"])
        finally:
            Path(temp_path).unlink(missing_ok=True)

    # --- 2. Valid JSON Input ---

    def test_valid_json_file(self):
        json_data = [
            {
                "team_name": "DevDynasty",
                "members": [
                    {
                        "name": "Charlie Day",
                        "email": "charlie@example.com",
                        "github_url": "https://github.com/charlie",
                        "skills": ["python", "docker"],
                        "experience_years": 1.5,
                    },
                    {
                        "name": "Dana Scully",
                        "email": "dana@example.com",
                        "github_url": "https://github.com/dana",
                        "skills": ["react", "node"],
                        "experience_years": 4.0,
                    },
                ],
            }
        ]
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
            json.dump(json_data, f)
            temp_path = f.name

        try:
            result = self.orchestrator.process_file(temp_path)

            self.assertEqual(result.total_teams, 1)
            self.assertEqual(result.total_records, 2)
            self.assertEqual(result.valid_teams_count, 1)
            self.assertEqual(result.summary["pipeline_status"], "SUCCESS")

            team = result.teams[0]
            self.assertTrue(team.is_valid)
            self.assertEqual(team.team_name, "DevDynasty")
            self.assertEqual(len(team.members), 2)
        finally:
            Path(temp_path).unlink(missing_ok=True)

    # --- 3. Missing or Unreadable Input Files & Unsupported Formats ---

    def test_missing_input_file_returns_failure_result(self):
        missing_path = "nonexistent_file_definitely_not_here_999.csv"
        result = self.orchestrator.process_file(missing_path, raise_on_error=False)

        self.assertEqual(result.total_teams, 0)
        self.assertEqual(result.total_records, 0)
        self.assertEqual(result.summary["pipeline_status"], "FAILED")
        self.assertEqual(result.summary["failed_stage"], "Parsing")
        self.assertTrue(any("File not found or unreadable" in err for err in result.global_errors))

    def test_missing_input_file_raises_pipeline_error(self):
        missing_path = "nonexistent_file_definitely_not_here_999.csv"
        with self.assertRaises(PipelineError) as ctx:
            self.orchestrator.process_file(missing_path, raise_on_error=True)

        self.assertEqual(ctx.exception.stage, PipelineStage.PARSING)
        self.assertIn("File not found", ctx.exception.message)

    def test_unsupported_file_format(self):
        with tempfile.NamedTemporaryFile("w", suffix=".xml", delete=False) as f:
            f.write("<teams></teams>")
            temp_path = f.name

        try:
            result = self.orchestrator.process_file(temp_path, raise_on_error=False)
            self.assertEqual(result.summary["pipeline_status"], "FAILED")
            self.assertEqual(result.summary["failed_stage"], "Parsing")
            self.assertTrue(any("Unsupported file format '.xml'" in err for err in result.global_errors))

            with self.assertRaises(PipelineError) as ctx:
                self.orchestrator.process_file(temp_path, raise_on_error=True)
            self.assertEqual(ctx.exception.stage, PipelineStage.PARSING)
        finally:
            Path(temp_path).unlink(missing_ok=True)

    def test_corrupted_json_syntax(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            f.write("{ invalid json [")
            temp_path = f.name

        try:
            result = self.orchestrator.process_file(temp_path, raise_on_error=False)
            self.assertEqual(result.summary["pipeline_status"], "FAILED")
            self.assertEqual(result.summary["failed_stage"], "Parsing")
            self.assertTrue(any("Failed to parse JSON file" in err for err in result.global_errors))
        finally:
            Path(temp_path).unlink(missing_ok=True)

    # --- 4. Invalid Registration Data Preserved Without Discarding ---

    def test_invalid_registration_data_preserved_with_errors(self):
        csv_content = (
            "team_name,name,email,github,yoe\n"
            "ValidTeam,Alice,alice@example.com,https://github.com/alice,2.0\n"
            "InvalidTeam,,bad-email,https://github.com/bad,1.0\n"
        )
        result = self.orchestrator.process_string(csv_content, file_format="csv")

        # Pipeline ran successfully to completion
        self.assertEqual(result.summary["pipeline_status"], "SUCCESS")
        # Both teams are preserved, nothing silently discarded
        self.assertEqual(result.total_teams, 2)
        self.assertEqual(result.total_records, 2)
        self.assertEqual(result.valid_teams_count, 1)
        self.assertEqual(result.invalid_teams_count, 1)

        valid_teams = result.get_valid_teams()
        invalid_teams = result.get_invalid_teams()
        self.assertEqual(len(valid_teams), 1)
        self.assertEqual(valid_teams[0].team_name, "ValidTeam")

        self.assertEqual(len(invalid_teams), 1)
        invalid_team = invalid_teams[0]
        self.assertEqual(invalid_team.team_name, "InvalidTeam")
        self.assertFalse(invalid_team.is_valid)
        self.assertTrue(len(invalid_team.validation_errors) > 0)

        # Check member-level errors
        invalid_member = invalid_team.members[0]
        self.assertFalse(invalid_member.is_valid)
        self.assertTrue(any("Missing required member field: 'name'" in e for e in invalid_member.validation_errors))
        self.assertTrue(any("Invalid email format" in e for e in invalid_member.validation_errors))

    # --- 5. Full Pipeline Integration Across Config, Mapping, Normalization & Validation ---

    def test_full_pipeline_with_custom_config(self):
        config = ImportConfig(
            min_team_size=2,
            max_team_size=3,
            missing_data_strategy=MissingDataStrategy.IMPUTE,
            impute_defaults={"experience_years": 0.0, "education": "Not specified"},
            column_mapping={"participant": "name", "contact": "email"},
            allow_cross_team_duplicates=False,
        )
        custom_orchestrator = PipelineOrchestrator(config=config)

        csv_content = (
            "team_name,participant,contact,github,experience_years,education\n"
            "TeamOne,Alice,alice@example.com,github.com/alice,,\n"
            "TeamOne,Bob,bob@example.com,github.com/bob,1.5,BS Computer Science\n"
        )
        result = custom_orchestrator.process_string(csv_content, file_format="csv")

        self.assertEqual(result.total_teams, 1)
        self.assertEqual(result.valid_teams_count, 1)

        team = result.teams[0]
        self.assertEqual(team.team_size, 2)
        self.assertTrue(team.is_valid)

        # Verify mapping worked (participant -> name, contact -> email)
        alice = team.members[0]
        self.assertEqual(alice.name, "Alice")
        self.assertEqual(alice.email, "alice@example.com")

        # Verify normalization worked (github.com/alice -> https://github.com/alice)
        self.assertEqual(alice.github_url, "https://github.com/alice")

        # Verify imputation worked (None -> 0.0 and 'Not specified')
        self.assertEqual(alice.experience_years, 0.0)
        self.assertEqual(alice.education, "Not specified")
        self.assertTrue(any("Imputed missing field" in w for w in alice.validation_warnings))

    def test_semantic_alias(self):
        # Ensure ImportPipeline is an exact alias of PipelineOrchestrator
        self.assertIs(ImportPipeline, PipelineOrchestrator)
        pipeline = ImportPipeline()
        self.assertIsInstance(pipeline, PipelineOrchestrator)

    # --- 6. Alternative Column Aliases Mapped and Normalized ---

    def test_alternative_column_aliases_mapped_and_normalized(self):
        csv_content = (
            "group_name,student_name,mail,work_experience,institution,technologies,captain\n"
            "CyberKnights,Alice Smith,alice@example.com,3,MIT,Python; Django,yes\n"
        )
        result = self.orchestrator.process_string(csv_content, file_format="csv")

        self.assertEqual(result.total_teams, 1)
        self.assertEqual(result.valid_teams_count, 1)

        team = result.teams[0]
        self.assertEqual(team.team_name, "CyberKnights")

        member = team.members[0]
        self.assertEqual(member.name, "Alice Smith")
        self.assertEqual(member.email, "alice@example.com")
        self.assertEqual(member.experience_years, 3.0)
        self.assertEqual(member.education, "MIT")
        self.assertEqual(member.skills, ["python", "django"])
        self.assertTrue(member.is_lead)

    # --- 7. Missing Optional Fields Preserved as None Under NEUTRAL ---

    def test_missing_optional_fields_preserved_as_none_under_neutral(self):
        config = ImportConfig(missing_data_strategy=MissingDataStrategy.NEUTRAL)
        orchestrator = PipelineOrchestrator(config=config)

        csv_content = (
            "team_name,name,email,experience_years,education\n"
            "SoloTeam,Alice,alice@example.com,,\n"
        )
        result = orchestrator.process_string(csv_content, file_format="csv")

        self.assertEqual(result.valid_teams_count, 1)
        member = result.teams[0].members[0]
        # Crucial requirement: None must NEVER be silently converted to 0.0 under NEUTRAL!
        self.assertIsNone(member.experience_years)
        self.assertIsNone(member.education)
        self.assertEqual(len(member.validation_errors), 0)
        self.assertEqual(len(member.validation_warnings), 0)

    # --- 8. Empty CSV and JSON Inputs ---

    def test_empty_csv_and_json_inputs(self):
        # Empty CSV string
        res_csv = self.orchestrator.process_string("", file_format="csv")
        self.assertEqual(res_csv.total_teams, 0)
        self.assertEqual(res_csv.total_records, 0)
        self.assertEqual(res_csv.valid_teams_count, 0)
        self.assertEqual(res_csv.summary["pipeline_status"], "SUCCESS")

        # Empty JSON array string
        res_json = self.orchestrator.process_string("[]", file_format="json")
        self.assertEqual(res_json.total_teams, 0)
        self.assertEqual(res_json.total_records, 0)
        self.assertEqual(res_json.valid_teams_count, 0)
        self.assertEqual(res_json.summary["pipeline_status"], "SUCCESS")

    # --- 9. Malformed CSV Syntax ---

    def test_malformed_csv_syntax(self):
        # Malformed CSV with null byte triggers ParsingError
        malformed_csv = "team_name,name\nTeamA,\x00Alice"
        result = self.orchestrator.process_string(malformed_csv, file_format="csv", raise_on_error=False)
        self.assertEqual(result.summary["pipeline_status"], "FAILED")
        self.assertEqual(result.summary["failed_stage"], "Parsing")
        self.assertTrue(any("Failed to parse CSV content" in err for err in result.global_errors))

    # --- 10. Duplicate Emails Across Teams ---

    def test_duplicate_email_addresses_across_teams_in_csv(self):
        config = ImportConfig(allow_cross_team_duplicates=False)
        orchestrator = PipelineOrchestrator(config=config)

        csv_content = (
            "team_name,name,email\n"
            "TeamAlpha,Alice Smith,alice@example.com\n"
            "TeamBeta,Alice Clone,alice@example.com\n"
        )
        result = orchestrator.process_string(csv_content, file_format="csv")

        self.assertEqual(result.total_teams, 2)
        self.assertEqual(result.valid_teams_count, 0)
        self.assertEqual(result.invalid_teams_count, 2)
        self.assertTrue(any("Cross-team duplicate email" in err for err in result.global_errors))
        self.assertFalse(result.teams[0].is_valid)
        self.assertFalse(result.teams[1].is_valid)

    # --- 11. Team Sizes Outside Limits ---

    def test_team_sizes_outside_limits(self):
        config = ImportConfig(min_team_size=2, max_team_size=2)
        orchestrator = PipelineOrchestrator(config=config)

        # Team with 3 members when max is 2
        csv_content = (
            "team_name,name,email\n"
            "BigTeam,Member 1,m1@example.com\n"
            "BigTeam,Member 2,m2@example.com\n"
            "BigTeam,Member 3,m3@example.com\n"
        )
        result = orchestrator.process_string(csv_content, file_format="csv")

        self.assertEqual(result.total_teams, 1)
        self.assertEqual(result.valid_teams_count, 0)
        self.assertEqual(result.invalid_teams_count, 1)
        team = result.teams[0]
        self.assertFalse(team.is_valid)
        self.assertTrue(any("exceeds maximum allowed size" in err for err in team.validation_errors))

    # --- 12. Empty GitHub Fields and Placeholder Values ---

    def test_empty_github_and_placeholders(self):
        csv_content = (
            "team_name,name,email,github\n"
            "PlaceholderTeam,Alice,alice@example.com,N/A\n"
            "PlaceholderTeam,Bob,bob@example.com,none\n"
            "PlaceholderTeam,Charlie,charlie@example.com,-\n"
        )
        result = self.orchestrator.process_string(csv_content, file_format="csv")

        self.assertEqual(result.valid_teams_count, 1)
        team = result.teams[0]
        self.assertTrue(team.is_valid)

        for member in team.members:
            self.assertIsNone(member.github_url)
            self.assertIsNone(member.github_username)
            self.assertTrue(member.is_valid)

    # --- 13. Multiple Teams and Multiple Members Batch ---

    def test_multiple_teams_and_multiple_members(self):
        csv_content = (
            "team_name,name,email,github,yoe\n"
            "TeamA,Alice,alice@example.com,https://github.com/alice,2.0\n"
            "TeamA,Bob,bob@example.com,https://github.com/bob,1.0\n"
            "TeamB,,bad-email,https://github.com/bad,3.0\n"
            "TeamC,Charlie,charlie@example.com,https://github.com/charlie,0.0\n"
        )
        result = self.orchestrator.process_string(csv_content, file_format="csv")

        self.assertEqual(result.total_teams, 3)
        self.assertEqual(result.total_records, 4)
        self.assertEqual(result.valid_teams_count, 2)  # TeamA and TeamC
        self.assertEqual(result.invalid_teams_count, 1)  # TeamB

        self.assertEqual(result.summary["valid_teams"], 2)
        self.assertEqual(result.summary["invalid_teams"], 1)
        self.assertEqual(result.summary["valid_members"], 3)
        self.assertEqual(result.summary["invalid_members"], 1)

    # --- 14. Consistent Output Between Equivalent CSV and JSON ---

    def test_csv_and_json_produce_consistent_outputs(self):
        csv_content = (
            "team_name,name,email,github,yoe\n"
            "Alpha,Alice,alice@example.com,https://github.com/alice,2.5\n"
        )
        json_content = json.dumps([
            {
                "team_name": "Alpha",
                "members": [
                    {
                        "name": "Alice",
                        "email": "alice@example.com",
                        "github_url": "https://github.com/alice",
                        "experience_years": 2.5,
                    }
                ],
            }
        ])

        result_csv = self.orchestrator.process_string(csv_content, file_format="csv")
        result_json = self.orchestrator.process_string(json_content, file_format="json")

        self.assertEqual(result_csv.total_teams, result_json.total_teams)
        self.assertEqual(result_csv.total_records, result_json.total_records)
        self.assertEqual(result_csv.valid_teams_count, result_json.valid_teams_count)

        m_csv = result_csv.teams[0].members[0]
        m_json = result_json.teams[0].members[0]

        self.assertEqual(m_csv.name, m_json.name)
        self.assertEqual(m_csv.email, m_json.email)
        self.assertEqual(m_csv.github_url, m_json.github_url)
        self.assertEqual(m_csv.experience_years, m_json.experience_years)
        self.assertEqual(m_csv.is_valid, m_json.is_valid)


if __name__ == "__main__":
    unittest.main()


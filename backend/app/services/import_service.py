"""Import service orchestrating parsing, schema mapping, normalization, and validation.

Produces a structured, validated ImportResult preserving missing, invalid, and zero-valued signals.
"""

from pathlib import Path
import re
import sys
from typing import Any, Dict, List, Optional, Set, Union

# Ensure data_processing is importable
_dp_path = str((Path(__file__).resolve().parent.parent.parent / "data_processing").resolve())
if _dp_path not in sys.path:
    sys.path.insert(0, _dp_path)

from mapping.schema_mapper import SchemaMapper
from normalization.normalization_service import NormalizationService
from parsers.base import ParsingError
from parsers.csv_parser import CSVParser
from parsers.json_parser import JSONParser
from schemas.config import ImportConfig, MissingDataStrategy
from schemas.import_result import ImportResult
from schemas.member import MemberData
from schemas.team import TeamData


class ImportService:
    """End-to-end import processor for registration files."""

    def __init__(self, config: Optional[ImportConfig] = None):
        self.config = config or ImportConfig(max_team_size=10)
        self.csv_parser = CSVParser()
        self.json_parser = JSONParser()
        self.schema_mapper = SchemaMapper(config=self.config)
        self.normalization_service = NormalizationService()

    def process_file_content(
        self,
        content: Union[str, bytes],
        filename: Optional[str] = None,
        format_hint: Optional[str] = None,
    ) -> ImportResult:
        """Parses, maps, normalizes, and validates registration data from raw content.

        Args:
            content: Raw text string or bytes of the CSV or JSON content.
            filename: Optional filename used for format detection and logging.
            format_hint: Optional explicit format ("csv" or "json").

        Returns:
            Structured ImportResult containing constructed teams, counts, and validation logs.
        """
        # 1. Decode bytes if necessary
        text_content = self._decode_content(content)
        if not text_content or not text_content.strip():
            return ImportResult(
                total_records=0,
                total_teams=0,
                valid_teams_count=0,
                invalid_teams_count=0,
                teams=[],
                global_warnings=["Uploaded content is empty."],
                summary={"status": "empty", "details": "No records found in upload."},
            )

        # 2. Determine format
        fmt = self._detect_format(text_content, filename=filename, format_hint=format_hint)
        if fmt not in ("csv", "json"):
            return ImportResult(
                total_records=0,
                total_teams=0,
                valid_teams_count=0,
                invalid_teams_count=0,
                teams=[],
                global_errors=[f"Unsupported file format: '{fmt}'. Expected CSV or JSON."],
                summary={"status": "error", "details": "Unsupported format"},
            )

        # 3. Parse raw records
        try:
            if fmt == "json":
                raw_teams = self.json_parser.parse_string(text_content)
            else:
                raw_teams = self.csv_parser.parse_string(text_content)
        except ParsingError as pe:
            return ImportResult(
                total_records=0,
                total_teams=0,
                valid_teams_count=0,
                invalid_teams_count=0,
                teams=[],
                global_errors=[f"File parsing error: {str(pe)}"],
                summary={"status": "error", "details": str(pe)},
            )
        except Exception as e:
            return ImportResult(
                total_records=0,
                total_teams=0,
                valid_teams_count=0,
                invalid_teams_count=0,
                teams=[],
                global_errors=[f"Unexpected syntax or file decoding error: {str(e)}"],
                summary={"status": "error", "details": str(e)},
            )

        if not raw_teams:
            return ImportResult(
                total_records=0,
                total_teams=0,
                valid_teams_count=0,
                invalid_teams_count=0,
                teams=[],
                global_warnings=["File contained headers or valid syntax but no data records."],
                summary={"status": "no_data"},
            )

        # Count total raw records (members across all teams)
        total_records = sum(len(t.get("members", [])) or 1 for t in raw_teams)

        # 4. Schema Mapping
        mapped_teams = self.schema_mapper.map_teams(raw_teams)

        # 5. Normalization
        normalized_teams = self.normalization_service.normalize_teams(mapped_teams)

        # 6. Validation and Construction of Pydantic models
        constructed_teams: List[TeamData] = []
        seen_emails: Dict[str, str] = {}  # email -> team_id for cross-team duplicate detection
        global_warnings: List[str] = []

        for raw_t in normalized_teams:
            team_id = str(raw_t.get("id") or raw_t.get("team_id"))
            team_name = str(raw_t.get("team_name") or "Unnamed Team")
            lead_email = raw_t.get("lead_email")
            metadata = raw_t.get("metadata", {})
            team_errors: List[str] = []
            team_warnings: List[str] = []
            team_requires_review = False

            # Validate required team fields
            for tf in self.config.required_team_fields:
                if tf == "team_name" and not raw_t.get("team_name"):
                    team_errors.append("Missing required team field: team_name")
                elif tf not in raw_t or raw_t.get(tf) is None:
                    team_errors.append(f"Missing required team field: {tf}")

            # Validate members
            member_models: List[MemberData] = []
            raw_members = raw_t.get("members", [])

            # Check team size limits
            if len(raw_members) < self.config.min_team_size:
                team_errors.append(
                    f"Team size {len(raw_members)} is below minimum allowed size ({self.config.min_team_size})"
                )
            if len(raw_members) > self.config.max_team_size:
                team_errors.append(
                    f"Team size {len(raw_members)} exceeds maximum allowed size ({self.config.max_team_size})"
                )

            for raw_m in raw_members:
                m_errors: List[str] = []
                m_warnings: List[str] = []
                m_missing: List[str] = list(raw_m.get("missing_fields", []))

                # Check required member fields
                for rf in self.config.required_member_fields:
                    val = raw_m.get(rf)
                    if val is None or val == "" or val == []:
                        m_errors.append(f"Missing required member field: {rf}")

                # Validate email format
                m_email = raw_m.get("email")
                if m_email and self.config.validate_emails:
                    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", m_email):
                        m_warnings.append(f"Invalid email format: '{m_email}'")
                        team_requires_review = True

                # Cross-team email duplication check
                if m_email and not self.config.allow_cross_team_duplicates:
                    if m_email in seen_emails and seen_emails[m_email] != team_id:
                        msg = f"Member email '{m_email}' is registered in multiple teams ({seen_emails[m_email]}, {team_id})"
                        if self.config.missing_data_strategy == MissingDataStrategy.STRICT:
                            m_errors.append(msg)
                        else:
                            m_warnings.append(msg)
                            team_requires_review = True
                    else:
                        seen_emails[m_email] = team_id

                # Handle missing-data strategy
                if self.config.missing_data_strategy == MissingDataStrategy.IMPUTE:
                    for field, default_val in self.config.impute_defaults.items():
                        if field in m_missing or raw_m.get(field) is None:
                            raw_m[field] = default_val
                            if field in m_missing:
                                m_missing.remove(field)
                elif self.config.missing_data_strategy == MissingDataStrategy.FLAG_FOR_REVIEW:
                    if m_missing:
                        m_warnings.append(f"Missing fields flagged for review: {', '.join(m_missing)}")
                        team_requires_review = True
                elif self.config.missing_data_strategy == MissingDataStrategy.STRICT:
                    if m_missing:
                        m_errors.append(f"Strict validation rejected missing fields: {', '.join(m_missing)}")

                member_is_valid = len(m_errors) == 0

                member = MemberData(
                    id=str(raw_m.get("id")),
                    name=str(raw_m.get("name") or ""),
                    email=raw_m.get("email"),
                    is_lead=bool(raw_m.get("is_lead", False)),
                    github_url=raw_m.get("github_url"),
                    github_username=raw_m.get("github_username"),
                    linkedin_url=raw_m.get("linkedin_url"),
                    portfolio_url=raw_m.get("portfolio_url"),
                    skills=raw_m.get("skills", []),
                    experience_years=raw_m.get("experience_years"),
                    education=raw_m.get("education"),
                    missing_fields=m_missing,
                    extra_data=raw_m.get("extra_data", {}),
                    is_valid=member_is_valid,
                    validation_errors=m_errors,
                    validation_warnings=m_warnings,
                )
                member_models.append(member)

            # Team is valid only if all members are valid and team has no errors
            any_member_invalid = any(not m.is_valid for m in member_models)
            team_is_valid = len(team_errors) == 0 and not any_member_invalid
            if any_member_invalid:
                team_errors.append("One or more team members failed validation.")

            team = TeamData(
                id=team_id,
                team_name=team_name,
                members=member_models,
                team_size=len(member_models),
                lead_email=lead_email,
                is_valid=team_is_valid,
                requires_review=team_requires_review or len(team_warnings) > 0,
                validation_errors=team_errors,
                validation_warnings=team_warnings,
                metadata=metadata,
            )
            constructed_teams.append(team)

        valid_count = sum(1 for t in constructed_teams if t.is_valid)
        invalid_count = len(constructed_teams) - valid_count

        return ImportResult(
            total_records=total_records,
            total_teams=len(constructed_teams),
            valid_teams_count=valid_count,
            invalid_teams_count=invalid_count,
            teams=constructed_teams,
            global_errors=[],
            global_warnings=global_warnings,
            summary={
                "status": "success",
                "valid_teams": valid_count,
                "invalid_teams": invalid_count,
                "teams_requiring_review": sum(1 for t in constructed_teams if t.requires_review),
                "total_members": sum(t.team_size for t in constructed_teams),
            },
        )

    def _decode_content(self, content: Union[str, bytes]) -> str:
        """Safely decodes string or bytes input with multiple encodings."""
        if isinstance(content, str):
            return content
        if isinstance(content, (bytes, bytearray)):
            for enc in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
                try:
                    return content.decode(enc)
                except UnicodeDecodeError:
                    continue
            return content.decode("utf-8", errors="replace")
        return str(content)

    def _detect_format(
        self,
        content: str,
        filename: Optional[str] = None,
        format_hint: Optional[str] = None,
    ) -> str:
        """Determines whether content represents CSV or JSON."""
        if format_hint:
            hint = format_hint.lower().strip()
            if hint in ("csv", "json"):
                return hint

        if filename:
            ext = Path(filename).suffix.lower()
            if ext == ".csv":
                return "csv"
            elif ext == ".json":
                return "json"

        # Heuristic content inspection
        stripped = content.strip()
        if (stripped.startswith("{") and stripped.endswith("}")) or (
            stripped.startswith("[") and stripped.endswith("]")
        ):
            return "json"

        return "csv"

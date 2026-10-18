"""Validation service enforcing integrity, sizing, links, emails, and missing data rules."""

from collections import defaultdict
from typing import Any, Dict, List, Optional, Set, Union
import uuid

from schemas.config import ImportConfig, MissingDataStrategy
from schemas.import_result import ImportResult
from schemas.member import MemberData
from schemas.team import TeamData
from validation.validators import (
    is_secure_url,
    is_valid_email,
    is_valid_github_url,
    is_valid_linkedin_url,
    is_valid_portfolio_url,
)

STANDARD_OPTIONAL_MEMBER_FIELDS = [
    "email",
    "github_url",
    "linkedin_url",
    "portfolio_url",
    "skills",
    "experience_years",
    "education",
]


class ValidationService:
    """Orchestrates comprehensive validation according to organizer configuration."""

    def __init__(self, config: Optional[ImportConfig] = None):
        self.config = config or ImportConfig()

    def _to_member_data(self, member: Union[MemberData, Dict[str, Any]]) -> MemberData:
        """Ensure input is an instance of MemberData, converting dicts seamlessly."""
        if isinstance(member, MemberData):
            return member
        if isinstance(member, dict):
            d = dict(member)
            d.pop("_source_line", None)
            if "id" not in d or not d["id"]:
                d["id"] = f"m_{uuid.uuid4().hex[:8]}"
            if "name" not in d:
                d["name"] = ""
            return MemberData(**d)
        raise TypeError(f"Expected MemberData or dict, got {type(member).__name__}")

    def _to_team_data(self, team: Union[TeamData, Dict[str, Any]]) -> TeamData:
        """Ensure input is an instance of TeamData, converting dicts seamlessly."""
        if isinstance(team, TeamData):
            return team
        if isinstance(team, dict):
            d = dict(team)
            d.pop("_source_line", None)
            if "id" not in d or not d["id"]:
                d["id"] = f"team_{uuid.uuid4().hex[:8]}"
            if "team_name" not in d:
                d["team_name"] = ""
            if "members" in d and isinstance(d["members"], list):
                d["members"] = [self._to_member_data(m) for m in d["members"]]
            return TeamData(**d)
        raise TypeError(f"Expected TeamData or dict, got {type(team).__name__}")

    def _is_empty_or_whitespace(self, val: Any) -> bool:
        """Check if a value is absent, None, empty string, or whitespace-only."""
        if val is None:
            return True
        if isinstance(val, str) and not val.strip():
            return True
        if isinstance(val, (list, tuple, set, dict)) and len(val) == 0:
            return True
        return False

    def validate_member(
        self,
        member: Union[MemberData, Dict[str, Any]],
        team_context: Optional[TeamData] = None,
    ) -> MemberData:
        """Validate an individual member record according to the configuration.

        Checks required fields, emails, URLs, and handles missing data according
        to the configured MissingDataStrategy.
        """
        member = self._to_member_data(member)
        # Ensure fresh validation state if run repeatedly
        errors: List[str] = []
        warnings: List[str] = []

        # 1. Required member fields
        for field in self.config.required_member_fields:
            val = getattr(member, field, None)
            if val is None and field in member.extra_data:
                val = member.extra_data[field]

            if self._is_empty_or_whitespace(val):
                errors.append(f"Missing required member field: '{field}'")

        # 2. Email format validation (when enabled)
        if self.config.validate_emails and member.email and member.email.strip():
            if not is_valid_email(member.email):
                errors.append(f"Invalid email format: '{member.email}'")

        # 3. URL format validations (when enabled)
        if self.config.validate_urls:
            # GitHub URL
            if member.github_url and member.github_url.strip():
                if not is_valid_github_url(member.github_url):
                    errors.append(f"Invalid GitHub URL: '{member.github_url}'")
                elif not is_secure_url(member.github_url):
                    warnings.append(
                        f"Insecure GitHub URL using HTTP: '{member.github_url}'. HTTPS is recommended."
                    )

            # LinkedIn URL
            if member.linkedin_url and member.linkedin_url.strip():
                if not is_valid_linkedin_url(member.linkedin_url):
                    errors.append(f"Invalid LinkedIn URL: '{member.linkedin_url}'")
                elif not is_secure_url(member.linkedin_url):
                    warnings.append(
                        f"Insecure LinkedIn URL using HTTP: '{member.linkedin_url}'. HTTPS is recommended."
                    )

            # Portfolio URL
            if member.portfolio_url and member.portfolio_url.strip():
                if not is_valid_portfolio_url(member.portfolio_url):
                    errors.append(f"Invalid portfolio URL: '{member.portfolio_url}'")
                elif not is_secure_url(member.portfolio_url):
                    warnings.append(
                        f"Insecure portfolio URL using HTTP: '{member.portfolio_url}'. HTTPS is recommended."
                    )

        # 4. Missing data handling according to MissingDataStrategy
        # Only evaluate standard fields that are NOT already in required_member_fields
        optional_fields_to_check = [
            f
            for f in STANDARD_OPTIONAL_MEMBER_FIELDS
            if f not in self.config.required_member_fields
        ]

        strategy = self.config.missing_data_strategy

        for field in optional_fields_to_check:
            val = getattr(member, field, None)
            is_field_missing = val is None or (isinstance(val, str) and not val.strip()) or (isinstance(val, list) and len(val) == 0)

            if is_field_missing:
                if strategy == MissingDataStrategy.NEUTRAL:
                    # Explicit requirement: Preserve missing optional values as None;
                    # never silently convert missing data to zero or defaults.
                    pass

                elif strategy == MissingDataStrategy.IMPUTE:
                    # Impute default if present in impute_defaults
                    if field in self.config.impute_defaults:
                        imputed_val = self.config.impute_defaults[field]
                        setattr(member, field, imputed_val)
                        warnings.append(
                            f"Imputed missing field '{field}' with default: {imputed_val}"
                        )

                elif strategy == MissingDataStrategy.FLAG_FOR_REVIEW:
                    warnings.append(f"Missing optional field: '{field}'")
                    if team_context is not None:
                        team_context.requires_review = True

                elif strategy == MissingDataStrategy.STRICT:
                    errors.append(
                        f"Missing optional field '{field}' rejected under STRICT strategy"
                    )

        # Update member fields
        member.validation_errors = errors
        member.validation_warnings = warnings
        member.is_valid = len(errors) == 0

        return member

    def validate_team(self, team: Union[TeamData, Dict[str, Any]]) -> TeamData:
        """Validate an individual team, its members, and team-level constraints."""
        team = self._to_team_data(team)
        team.sync_team_size()
        team_errors: List[str] = []
        team_warnings: List[str] = []

        # 1. Required team fields
        for field in self.config.required_team_fields:
            val = getattr(team, field, None)
            if val is None and field in team.metadata:
                val = team.metadata[field]

            if self._is_empty_or_whitespace(val):
                team_errors.append(f"Missing required team field: '{field}'")

        # 2. Team size checks
        if team.team_size < self.config.min_team_size:
            team_errors.append(
                f"Team size ({team.team_size}) is below minimum allowed size of {self.config.min_team_size}"
            )
        elif team.team_size > self.config.max_team_size:
            team_errors.append(
                f"Team size ({team.team_size}) exceeds maximum allowed size of {self.config.max_team_size}"
            )

        # 3. Lead email format check
        if self.config.validate_emails and team.lead_email and team.lead_email.strip():
            if not is_valid_email(team.lead_email):
                team_errors.append(f"Invalid lead email format: '{team.lead_email}'")

        # 4. Intra-team duplicate email check
        seen_emails: Dict[str, str] = {}
        intra_duplicates: Set[str] = set()
        for member in team.members:
            if member.email and member.email.strip():
                clean_email = member.email.strip().lower()
                if clean_email in seen_emails:
                    intra_duplicates.add(clean_email)
                else:
                    seen_emails[clean_email] = member.name or member.id

        if intra_duplicates:
            for dup_email in sorted(intra_duplicates):
                team_errors.append(
                    f"Duplicate email '{dup_email}' found within team '{team.team_name}'"
                )

        # 5. Validate each member
        for member in team.members:
            self.validate_member(member, team_context=team)

            # Invalidate member if they are part of intra-team duplicate
            if member.email and member.email.strip() and member.email.strip().lower() in intra_duplicates:
                member.is_valid = False
                member.validation_errors.append(
                    f"Duplicate email '{member.email.strip()}' found within the same team"
                )

            # Propagate member errors to team
            if not member.is_valid:
                team_errors.append(
                    f"Member '{member.name or member.id}' failed validation: {'; '.join(member.validation_errors)}"
                )

        # 6. Flag for review if strategy is FLAG_FOR_REVIEW and any member has warnings
        if self.config.missing_data_strategy == MissingDataStrategy.FLAG_FOR_REVIEW:
            for member in team.members:
                if any("Missing optional field" in w for w in member.validation_warnings):
                    team.requires_review = True
                    break

        team.validation_errors = team_errors
        team.validation_warnings = team_warnings
        team.is_valid = len(team_errors) == 0

        return team

    def validate_teams(
        self,
        teams: List[Union[TeamData, Dict[str, Any]]],
    ) -> ImportResult:
        """Validate a collection of teams and enforce cross-team constraints.

        Returns an ImportResult summarizing valid and invalid teams along with
        dataset-wide errors and statistics.
        """
        # Step 1: Ensure all items are TeamData and validate individual teams
        team_objects: List[TeamData] = [self._to_team_data(t) for t in teams]
        for team in team_objects:
            self.validate_team(team)

        global_errors: List[str] = []
        global_warnings: List[str] = []

        # Step 2: Cross-team duplicate email validation (when duplicates not allowed)
        if not self.config.allow_cross_team_duplicates:
            # Map email -> list of (team, member)
            email_occurrences: Dict[str, List[tuple[TeamData, MemberData]]] = defaultdict(list)

            for team in team_objects:
                for member in team.members:
                    if member.email and member.email.strip():
                        email_occurrences[member.email.strip().lower()].append((team, member))

            for email, occurrences in email_occurrences.items():
                distinct_teams = {t.id for t, _ in occurrences}
                if len(distinct_teams) > 1:
                    team_names = sorted(list({t.team_name for t, _ in occurrences}))
                    error_msg = (
                        f"Cross-team duplicate email '{email}' detected across teams: "
                        f"{', '.join(team_names)}"
                    )
                    global_errors.append(error_msg)

                    for team, member in occurrences:
                        member.is_valid = False
                        dup_member_err = (
                            f"Duplicate email '{email}' registered in multiple teams: "
                            f"{', '.join(team_names)}"
                        )
                        if dup_member_err not in member.validation_errors:
                            member.validation_errors.append(dup_member_err)

                        team.is_valid = False
                        dup_team_err = (
                            f"Team contains member with cross-team duplicate email: '{email}'"
                        )
                        if dup_team_err not in team.validation_errors:
                            team.validation_errors.append(dup_team_err)

        # Step 3: Compute final statistics
        total_records = sum(len(t.members) for t in team_objects)
        valid_teams_count = sum(1 for t in team_objects if t.is_valid)
        invalid_teams_count = sum(1 for t in team_objects if not t.is_valid)
        review_count = sum(1 for t in team_objects if t.requires_review)

        total_members = total_records
        valid_members_count = sum(
            1 for t in team_objects for m in t.members if m.is_valid
        )
        invalid_members_count = total_members - valid_members_count

        summary: Dict[str, Any] = {
            "total_teams": len(team_objects),
            "valid_teams": valid_teams_count,
            "invalid_teams": invalid_teams_count,
            "total_members": total_members,
            "valid_members": valid_members_count,
            "invalid_members": invalid_members_count,
            "teams_requiring_review": review_count,
        }

        return ImportResult(
            total_records=total_records,
            total_teams=len(team_objects),
            valid_teams_count=valid_teams_count,
            invalid_teams_count=invalid_teams_count,
            teams=team_objects,
            global_errors=global_errors,
            global_warnings=global_warnings,
            summary=summary,
        )

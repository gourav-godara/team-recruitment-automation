"""Configuration schema for data import and processing."""

from enum import Enum
from typing import Any, Dict, List
from pydantic import BaseModel, Field


class MissingDataStrategy(str, Enum):
    """Configurable handling strategies for missing data."""

    NEUTRAL = "neutral"
    IMPUTE = "impute"
    FLAG_FOR_REVIEW = "flag_for_review"
    STRICT = "strict"


class ImportConfig(BaseModel):
    """Configuration passed by organizers for parsing, mapping, and validation."""

    min_team_size: int = Field(default=1, description="Minimum allowed team size")
    max_team_size: int = Field(default=4, description="Maximum allowed team size")
    required_member_fields: List[str] = Field(
        default_factory=lambda: ["name"],
        description="Fields strictly required for a member record",
    )
    required_team_fields: List[str] = Field(
        default_factory=lambda: ["team_name"],
        description="Fields strictly required for a team record",
    )
    missing_data_strategy: MissingDataStrategy = Field(
        default=MissingDataStrategy.NEUTRAL,
        description="How missing optional fields are handled",
    )
    column_mapping: Dict[str, str] = Field(
        default_factory=dict,
        description="Custom header mappings provided by the organizer",
    )
    impute_defaults: Dict[str, Any] = Field(
        default_factory=lambda: {
            "experience_years": 0.0,
            "skills": [],
            "education": "Not specified",
        },
        description="Default values used when strategy is IMPUTE",
    )
    allow_cross_team_duplicates: bool = Field(
        default=False,
        description="Whether the same email can appear in multiple teams",
    )
    validate_urls: bool = Field(
        default=True,
        description="Whether to validate format of GitHub/LinkedIn/portfolio URLs",
    )
    validate_emails: bool = Field(
        default=True,
        description="Whether to validate email addresses format",
    )

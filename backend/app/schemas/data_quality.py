"""Schemas for recruitment dataset and evaluation Data Quality Reporting."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FieldQualitySummary(BaseModel):
    """Quality metrics for a specific signal or column."""
    field_name: str
    total_expected: int
    present_count: int
    missing_count: int
    invalid_count: int
    completeness_percentage: float  # [0.0, 100.0]


class MalformedUrlDetail(BaseModel):
    team_id: str
    member_email: Optional[str] = None
    field_name: str
    invalid_url: str
    reason: str


class DataQualityReport(BaseModel):
    """Comprehensive data-quality assessment for a recruitment dataset or evaluation run."""
    dataset_id: Optional[str] = None
    total_teams: int
    total_members: int
    average_team_size: float
    completeness_score: float  # Standard [0, 100] scale
    field_summaries: List[FieldQualitySummary] = Field(default_factory=list)
    missing_fields_summary: Dict[str, int] = Field(default_factory=dict)
    invalid_fields_summary: Dict[str, int] = Field(default_factory=dict)
    duplicate_emails: List[str] = Field(default_factory=list)
    duplicate_github_urls: List[str] = Field(default_factory=list)
    malformed_urls: List[MalformedUrlDetail] = Field(default_factory=list)
    teams_with_missing_signals: List[str] = Field(default_factory=list)
    teams_with_size_anomalies: List[str] = Field(default_factory=list)
    review_flags: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

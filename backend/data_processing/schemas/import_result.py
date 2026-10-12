"""Import result schemas."""

from typing import Any, Dict, List
from pydantic import BaseModel, Field
from schemas.team import TeamData


class ImportResult(BaseModel):
    """Encapsulates the final structured outcome of the data processing pipeline."""

    total_records: int = Field(default=0, description="Total raw records parsed")
    total_teams: int = Field(default=0, description="Total constructed teams")
    valid_teams_count: int = Field(default=0, description="Number of teams passing validation")
    invalid_teams_count: int = Field(default=0, description="Number of invalid teams")
    teams: List[TeamData] = Field(default_factory=list, description="All processed teams")
    global_errors: List[str] = Field(default_factory=list, description="Dataset-wide error messages")
    global_warnings: List[str] = Field(default_factory=list, description="Dataset-wide warnings")
    summary: Dict[str, Any] = Field(default_factory=dict, description="Summary statistics")

    def get_valid_teams(self) -> List[TeamData]:
        """Return only teams that passed validation."""
        return [t for t in self.teams if t.is_valid]

    def get_invalid_teams(self) -> List[TeamData]:
        """Return teams that failed validation."""
        return [t for t in self.teams if not t.is_valid]

    def get_teams_requiring_review(self) -> List[TeamData]:
        """Return valid teams flagged for organizer review."""
        return [t for t in self.teams if t.is_valid and t.requires_review]

    def to_dict(self) -> Dict[str, Any]:
        """Convert entire import result to dictionary."""
        return self.model_dump()

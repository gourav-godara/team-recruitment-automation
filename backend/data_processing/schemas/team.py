"""Team data schemas for the Team Recruitment Automation Tool."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator
from schemas.member import MemberData


class TeamData(BaseModel):
    """Canonical representation of a candidate team."""

    id: str = Field(description="Unique identifier for the team")
    team_name: str = Field(description="Name of the team")
    members: List[MemberData] = Field(default_factory=list, description="List of team members")
    team_size: int = Field(default=0, description="Total number of members in the team")
    lead_email: Optional[str] = Field(default=None, description="Email of team leader or contact person")
    is_valid: bool = Field(default=True, description="Whether the team meets validity standards")
    requires_review: bool = Field(default=False, description="Flag indicating organizer review needed")
    validation_errors: List[str] = Field(default_factory=list, description="Team-level validation errors")
    validation_warnings: List[str] = Field(default_factory=list, description="Team-level validation warnings")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional team attributes")

    @model_validator(mode="after")
    def _auto_sync_team_size(self) -> "TeamData":
        """Automatically keep team_size synchronized with member count."""
        if self.team_size == 0 or self.team_size != len(self.members):
            self.team_size = len(self.members)
        return self

    def sync_team_size(self) -> None:
        """Update team_size based on members list (manual fallback)."""
        self.team_size = len(self.members)

    def get_lead(self) -> Optional[MemberData]:
        """Return the designated team lead if one exists, otherwise first member."""
        for m in self.members:
            if m.is_lead:
                return m
        return self.members[0] if self.members else None

    def to_dict(self) -> Dict[str, Any]:
        """Convert team model to dictionary."""
        return self.model_dump()

"""Member data schemas for the Team Recruitment Automation Tool."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MemberData(BaseModel):
    """Canonical representation of an individual team member."""

    id: str = Field(description="Unique identifier for the member")
    name: str = Field(description="Full name of the member")
    email: Optional[str] = Field(default=None, description="Email address")
    is_lead: bool = Field(default=False, description="Flag indicating if the member is the team lead")
    github_url: Optional[str] = Field(default=None, description="Canonical GitHub profile URL")
    github_username: Optional[str] = Field(default=None, description="Sanitized GitHub handle for integrations")
    linkedin_url: Optional[str] = Field(default=None, description="LinkedIn profile URL")
    portfolio_url: Optional[str] = Field(default=None, description="Portfolio or website link")
    skills: List[str] = Field(default_factory=list, description="Normalized list of skills/technologies")
    experience_years: Optional[float] = Field(default=None, description="Years of relevant experience")
    education: Optional[str] = Field(default=None, description="Education, degree, or university")
    missing_fields: List[str] = Field(default_factory=list, description="Standard fields missing in the input")
    extra_data: Dict[str, Any] = Field(default_factory=dict, description="Custom or unmapped fields")
    is_valid: bool = Field(default=True, description="Whether this member record passed validation")
    validation_errors: List[str] = Field(default_factory=list, description="Validation error messages")
    validation_warnings: List[str] = Field(default_factory=list, description="Validation warning messages")

    def to_dict(self) -> Dict[str, Any]:
        """Convert member model to dictionary."""
        return self.model_dump()

"""Configurable Eligibility Rule schemas for the Team Recruitment Automation Tool.

Defines the declarative rule specification, rule types, evaluation outcomes (PASS, FAIL,
UNKNOWN, ERROR), and validation schemas.
"""

from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator, model_validator


class RuleType(str, Enum):
    """Enumeration of all supported declarative rule types."""
    COUNT_AT_LEAST = "COUNT_AT_LEAST"
    COUNT_AT_MOST = "COUNT_AT_MOST"
    FIELD_EQUALS = "FIELD_EQUALS"
    FIELD_IN = "FIELD_IN"
    FIELD_EXISTS = "FIELD_EXISTS"
    NUMBER_GTE = "NUMBER_GTE"
    NUMBER_LTE = "NUMBER_LTE"
    TEAM_SIZE_BETWEEN = "TEAM_SIZE_BETWEEN"
    REQUIRED_SKILL = "REQUIRED_SKILL"
    REQUIRED_ROLE_COVERAGE = "REQUIRED_ROLE_COVERAGE"
    DISTINCT_COUNT_AT_LEAST = "DISTINCT_COUNT_AT_LEAST"
    DATA_COMPLETENESS_AT_LEAST = "DATA_COMPLETENESS_AT_LEAST"


class RuleCategory(str, Enum):
    """Broad categories for organizing rules in UI and audit reports."""
    TEAM_COMPOSITION = "team_composition"
    TECHNICAL_ELIGIBILITY = "technical_eligibility"
    REGISTRATION_VALIDATION = "registration_validation"
    DATA_QUALITY = "data_quality"
    GENERAL = "general"


class RuleScope(str, Enum):
    """Whether the rule inspects the entire team or individual members."""
    TEAM = "team"
    MEMBER = "member"


class RuleSeverity(str, Enum):
    """Mandatory rules affect qualification; advisory rules only flag for review."""
    MANDATORY = "mandatory"
    ADVISORY = "advisory"


class FailureAction(str, Enum):
    """Action taken when a team fails the requirement."""
    INELIGIBLE = "ineligible"
    FLAG = "flag"
    DISQUALIFY = "disqualify"


class MissingDataAction(str, Enum):
    """How the rule handles undisclosed, missing, or unknown evidence."""
    MANUAL_REVIEW = "manual_review"
    FAIL = "fail"
    PASS = "pass"
    UNKNOWN = "unknown"


class RuleOutcome(str, Enum):
    """Four-valued deterministic outcome for rule evaluations."""
    PASS = "PASS"
    FAIL = "FAIL"
    UNKNOWN = "UNKNOWN"
    ERROR = "ERROR"


# Field allowlists to prevent arbitrary code execution or invalid attribute lookups
ALLOWED_TEAM_FIELDS = {
    "team_size",
    "lead_email",
    "name",
    "external_id",
    "data_completeness",
    "distinct_skills",
    "distinct_departments",
    "requires_review",
    "team_valid",
}

ALLOWED_MEMBER_FIELDS = {
    "name",
    "email",
    "gender",
    "declared_gender",
    "skills",
    "experience_years",
    "github_url",
    "github_username",
    "linkedin_url",
    "portfolio_url",
    "education",
    "is_lead",
    "role",
    "department",
    "member_valid",
}


class ConfigurableRule(BaseModel):
    """Declarative specification of an eligibility requirement."""
    id: str = Field(description="Unique rule identifier (slug format)")
    name: str = Field(description="Human-readable rule title")
    category: RuleCategory = Field(default=RuleCategory.GENERAL, description="Rule category")
    scope: RuleScope = Field(default=RuleScope.TEAM, description="Scope of evaluation (team or member)")
    type: RuleType = Field(description="The operator/evaluation algorithm to apply")
    field: Optional[str] = Field(default=None, description="Target signal/attribute to inspect")
    target_value: Optional[Any] = Field(default=None, description="Expected value for equality, membership, or count")
    threshold: Optional[float] = Field(default=None, description="Numerical threshold or count limit")
    min_value: Optional[float] = Field(default=None, description="Minimum boundary for range checks")
    max_value: Optional[float] = Field(default=None, description="Maximum boundary for range checks")
    required_values: List[str] = Field(default_factory=list, description="Collection of required skills, roles, or tokens")
    severity: RuleSeverity = Field(default=RuleSeverity.MANDATORY, description="Mandatory vs advisory")
    failure_action: FailureAction = Field(default=FailureAction.INELIGIBLE, description="Action if rule fails")
    missing_data_action: MissingDataAction = Field(default=MissingDataAction.MANUAL_REVIEW, description="Action if data is unknown")
    enabled: bool = Field(default=True, description="Whether rule is active")
    description: Optional[str] = Field(default=None, description="Detailed explanation of the rule rationale")

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        clean = v.strip().lower()
        if not clean or any(c.isspace() for c in clean):
            raise ValueError(f"Rule ID '{v}' must be a non-empty slug without whitespace.")
        return clean

    @model_validator(mode="after")
    def validate_rule_parameters(self) -> "ConfigurableRule":
        # 1. Team size between validation
        if self.type == RuleType.TEAM_SIZE_BETWEEN:
            if self.min_value is None or self.max_value is None:
                raise ValueError(f"Rule '{self.name}' (TEAM_SIZE_BETWEEN) requires both 'min_value' and 'max_value'.")
            if self.min_value <= 0 or self.max_value <= 0:
                raise ValueError(f"Rule '{self.name}' min_value and max_value must be positive integers > 0.")
            if self.min_value > self.max_value:
                raise ValueError(f"Rule '{self.name}' min_value ({self.min_value}) cannot exceed max_value ({self.max_value}).")

        # 2. Count at least / most validation
        elif self.type in (RuleType.COUNT_AT_LEAST, RuleType.COUNT_AT_MOST):
            if self.threshold is None or self.threshold < 0:
                raise ValueError(f"Rule '{self.name}' ({self.type.value}) requires a non-negative 'threshold'.")
            if not self.field:
                raise ValueError(f"Rule '{self.name}' requires a 'field' to evaluate counts upon.")

        # 3. Numeric range validations
        elif self.type in (RuleType.NUMBER_GTE, RuleType.NUMBER_LTE):
            if self.threshold is None:
                raise ValueError(f"Rule '{self.name}' ({self.type.value}) requires a numeric 'threshold'.")
            if not self.field:
                raise ValueError(f"Rule '{self.name}' requires a numeric target 'field'.")

        # 4. Required skill validation
        elif self.type == RuleType.REQUIRED_SKILL:
            if not self.required_values and not self.target_value:
                raise ValueError(f"Rule '{self.name}' (REQUIRED_SKILL) requires at least one skill in 'required_values' or 'target_value'.")

        # 5. Required role coverage validation
        elif self.type == RuleType.REQUIRED_ROLE_COVERAGE:
            if not self.required_values:
                raise ValueError(f"Rule '{self.name}' (REQUIRED_ROLE_COVERAGE) requires a non-empty list of 'required_values'.")

        # 6. Distinct count validation
        elif self.type == RuleType.DISTINCT_COUNT_AT_LEAST:
            if self.threshold is None or self.threshold <= 0:
                raise ValueError(f"Rule '{self.name}' (DISTINCT_COUNT_AT_LEAST) requires a positive 'threshold' > 0.")
            if not self.field:
                raise ValueError(f"Rule '{self.name}' requires a 'field' to count distinct values on.")

        # 7. Data completeness validation
        elif self.type == RuleType.DATA_COMPLETENESS_AT_LEAST:
            if self.threshold is None or not (0.0 <= self.threshold <= 1.0):
                raise ValueError(f"Rule '{self.name}' (DATA_COMPLETENESS_AT_LEAST) threshold must be between 0.0 and 1.0.")

        return self


class RuleEvaluationDetail(BaseModel):
    """Evaluation result for an individual rule on a single team."""
    rule_id: str
    rule_name: str
    category: str
    outcome: RuleOutcome
    severity: str
    explanation: str
    evidence: Dict[str, Any] = Field(default_factory=dict)
    missing_data: bool = False
    requires_manual_review: bool = False


class TeamEligibilitySummary(BaseModel):
    """Consolidated eligibility outcome for a team across all configured rules."""
    status: RuleOutcome
    is_eligible: bool
    requires_manual_review: bool
    passed_rules: List[RuleEvaluationDetail] = Field(default_factory=list)
    failed_rules: List[RuleEvaluationDetail] = Field(default_factory=list)
    unknown_rules: List[RuleEvaluationDetail] = Field(default_factory=list)
    error_rules: List[RuleEvaluationDetail] = Field(default_factory=list)
    summary: str


class RuleTypeMetadata(BaseModel):
    """Metadata describing a supported rule type for UI builders."""
    type: RuleType
    category: RuleCategory
    name: str
    description: str
    example: Dict[str, Any]
    required_parameters: List[str]

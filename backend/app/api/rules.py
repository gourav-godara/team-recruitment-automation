"""API routes for inspecting supported rule types and validating declarative rule configurations."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.schemas.rules import (
    ConfigurableRule,
    RuleCategory,
    RuleOutcome,
    RuleType,
    RuleTypeMetadata,
)

router = APIRouter()


RULE_METADATA_CATALOG: List[RuleTypeMetadata] = [
    RuleTypeMetadata(
        type=RuleType.COUNT_AT_LEAST,
        category=RuleCategory.TEAM_COMPOSITION,
        name="Minimum Count per Team",
        description="Requires at least N members to satisfy a given field condition (e.g. at least 1 self-reported female member).",
        example={
            "id": "min-one-female",
            "name": "At Least One Female Member",
            "type": "COUNT_AT_LEAST",
            "field": "declared_gender",
            "target_value": "female",
            "threshold": 1.0,
            "severity": "mandatory",
            "missing_data_action": "manual_review",
        },
        required_parameters=["field", "threshold"],
    ),
    RuleTypeMetadata(
        type=RuleType.COUNT_AT_MOST,
        category=RuleCategory.TEAM_COMPOSITION,
        name="Maximum Count per Team",
        description="Limits the number of members satisfying a condition to at most N.",
        example={
            "id": "max-beginners",
            "name": "At Most 2 Beginners",
            "type": "COUNT_AT_MOST",
            "field": "experience_years",
            "threshold": 2.0,
            "severity": "advisory",
        },
        required_parameters=["field", "threshold"],
    ),
    RuleTypeMetadata(
        type=RuleType.TEAM_SIZE_BETWEEN,
        category=RuleCategory.REGISTRATION_VALIDATION,
        name="Team Size Range",
        description="Requires team size to be within [min_value, max_value] inclusive (e.g., 2 to 4 members).",
        example={
            "id": "hackathon-team-size",
            "name": "Team Size 2 to 4",
            "type": "TEAM_SIZE_BETWEEN",
            "min_value": 2.0,
            "max_value": 4.0,
            "severity": "mandatory",
        },
        required_parameters=["min_value", "max_value"],
    ),
    RuleTypeMetadata(
        type=RuleType.REQUIRED_SKILL,
        category=RuleCategory.TECHNICAL_ELIGIBILITY,
        name="Mandatory Skill Coverage",
        description="Requires the team as a whole to possess specified mandatory skills.",
        example={
            "id": "must-have-python",
            "name": "Team Has Python Skill",
            "type": "REQUIRED_SKILL",
            "required_values": ["python"],
            "severity": "mandatory",
        },
        required_parameters=["required_values"],
    ),
    RuleTypeMetadata(
        type=RuleType.REQUIRED_ROLE_COVERAGE,
        category=RuleCategory.TEAM_COMPOSITION,
        name="Required Role Coverage",
        description="Requires the team to cover designated roles (e.g., frontend, backend).",
        example={
            "id": "roles-full-stack",
            "name": "Full Stack Team Coverage",
            "type": "REQUIRED_ROLE_COVERAGE",
            "required_values": ["frontend", "backend"],
            "severity": "advisory",
        },
        required_parameters=["required_values"],
    ),
    RuleTypeMetadata(
        type=RuleType.DISTINCT_COUNT_AT_LEAST,
        category=RuleCategory.TEAM_COMPOSITION,
        name="Distinct Diversity Count",
        description="Requires at least N unique values across team members for a given field (e.g. multidisciplinary departments).",
        example={
            "id": "multidisciplinary",
            "name": "At Least 2 Distinct Departments",
            "type": "DISTINCT_COUNT_AT_LEAST",
            "field": "department",
            "threshold": 2.0,
            "severity": "advisory",
        },
        required_parameters=["field", "threshold"],
    ),
    RuleTypeMetadata(
        type=RuleType.FIELD_EQUALS,
        category=RuleCategory.GENERAL,
        name="Field Exact Match",
        description="Requires team or member field to equal target_value.",
        example={
            "id": "team-verified",
            "name": "Team Validated",
            "type": "FIELD_EQUALS",
            "field": "team_valid",
            "target_value": True,
            "severity": "mandatory",
        },
        required_parameters=["field", "target_value"],
    ),
    RuleTypeMetadata(
        type=RuleType.FIELD_IN,
        category=RuleCategory.GENERAL,
        name="Field Set Membership",
        description="Requires field to match one of the allowed target values.",
        example={
            "id": "track-selection",
            "name": "Allowed Hackathon Track",
            "type": "FIELD_IN",
            "field": "track",
            "required_values": ["ai", "fintech", "health"],
            "severity": "mandatory",
        },
        required_parameters=["field", "required_values"],
    ),
    RuleTypeMetadata(
        type=RuleType.FIELD_EXISTS,
        category=RuleCategory.DATA_QUALITY,
        name="Field Presence",
        description="Requires team or member field to be non-empty and present.",
        example={
            "id": "lead-email-present",
            "name": "Lead Email Present",
            "type": "FIELD_EXISTS",
            "field": "lead_email",
            "severity": "mandatory",
        },
        required_parameters=["field"],
    ),
    RuleTypeMetadata(
        type=RuleType.NUMBER_GTE,
        category=RuleCategory.TECHNICAL_ELIGIBILITY,
        name="Number Greater Than Or Equal",
        description="Requires numeric attribute to be >= threshold.",
        example={
            "id": "min-exp",
            "name": "Minimum Experience",
            "type": "NUMBER_GTE",
            "field": "experience_years",
            "threshold": 1.0,
            "severity": "mandatory",
        },
        required_parameters=["field", "threshold"],
    ),
    RuleTypeMetadata(
        type=RuleType.NUMBER_LTE,
        category=RuleCategory.TECHNICAL_ELIGIBILITY,
        name="Number Less Than Or Equal",
        description="Requires numeric attribute to be <= threshold.",
        example={
            "id": "max-cost",
            "name": "Maximum Budget",
            "type": "NUMBER_LTE",
            "field": "budget",
            "threshold": 5000.0,
            "severity": "advisory",
        },
        required_parameters=["field", "threshold"],
    ),
    RuleTypeMetadata(
        type=RuleType.DATA_COMPLETENESS_AT_LEAST,
        category=RuleCategory.DATA_QUALITY,
        name="Minimum Data Completeness",
        description="Requires data completeness ratio to be >= threshold (e.g. 0.8 for 80%).",
        example={
            "id": "data-completeness-70",
            "name": "70% Data Completeness",
            "type": "DATA_COMPLETENESS_AT_LEAST",
            "threshold": 0.7,
            "severity": "mandatory",
        },
        required_parameters=["threshold"],
    ),
]


class RuleValidationRequest(BaseModel):
    rules: List[ConfigurableRule]


class RuleValidationResponse(BaseModel):
    valid: bool
    rules_count: int
    errors: List[str] = Field(default_factory=list)


@router.get(
    "/types",
    response_model=List[RuleTypeMetadata],
    status_code=status.HTTP_200_OK,
    summary="List all supported declarative rule types and schema definitions",
)
def list_rule_types() -> List[RuleTypeMetadata]:
    """Returns catalog of supported rule templates for building recruitment eligibility policies."""
    return RULE_METADATA_CATALOG


@router.post(
    "/validate",
    response_model=RuleValidationResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate a collection of declarative rules before applying to evaluations",
)
def validate_rules(request: RuleValidationRequest) -> RuleValidationResponse:
    """Validates rule configurations against structural, type, and semantic constraints."""
    errors = []
    seen_ids = set()

    for idx, rule in enumerate(request.rules):
        # 1. Unique rule IDs
        if rule.id in seen_ids:
            errors.append(f"Rule at index {idx} has duplicate ID '{rule.id}'. Rule IDs must be unique.")
        seen_ids.add(rule.id)

    if errors:
        return RuleValidationResponse(valid=False, rules_count=len(request.rules), errors=errors)

    return RuleValidationResponse(valid=True, rules_count=len(request.rules), errors=[])


class SelectionPreset(BaseModel):
    id: str
    name: str
    description: str
    weights: Dict[str, float]
    criteria_aggregation: Dict[str, str]
    rules: List[Dict[str, Any]] = Field(default_factory=list)


STRATEGY_PRESETS: List[SelectionPreset] = [
    SelectionPreset(
        id="balanced_hackathon",
        name="Balanced Hackathon Standard",
        description="Fair, well-rounded recruitment weighing GitHub, experience, and skills evenly with team-size normalization.",
        weights={"github_score": 0.40, "experience_score": 0.35, "skills_score": 0.25},
        criteria_aggregation={"github_score": "AVERAGE", "experience_score": "AVERAGE", "skills_score": "AVERAGE"},
        rules=[
            {
                "id": "team_size",
                "name": "Permitted Team Size (1-5)",
                "type": "TEAM_SIZE_BETWEEN",
                "min_value": 1.0,
                "max_value": 5.0,
                "severity": "mandatory",
            }
        ],
    ),
    SelectionPreset(
        id="dev_heavy",
        name="Developer & Code Heavy Track",
        description="Prioritizes deep technical competence and open-source contributions. Rewards star coders with MAX aggregation.",
        weights={"github_score": 0.55, "skills_score": 0.30, "experience_score": 0.15},
        criteria_aggregation={"github_score": "MAX", "skills_score": "AVERAGE", "experience_score": "AVERAGE"},
        rules=[],
    ),
    SelectionPreset(
        id="experience_centric",
        name="Senior & Enterprise Track",
        description="Focuses primarily on work history, industry maturity, and domain experience.",
        weights={"experience_score": 0.50, "github_score": 0.30, "skills_score": 0.20},
        criteria_aggregation={"experience_score": "AVERAGE", "github_score": "AVERAGE", "skills_score": "AVERAGE"},
        rules=[],
    ),
    SelectionPreset(
        id="full_stack_challenge",
        name="Full-Stack Web & Cloud Track",
        description="Mandates comprehensive role coverage across frontend and backend engineering.",
        weights={"github_score": 0.40, "experience_score": 0.35, "skills_score": 0.25},
        criteria_aggregation={"github_score": "AVERAGE", "experience_score": "AVERAGE", "skills_score": "AVERAGE"},
        rules=[
            {
                "id": "full_stack_coverage",
                "name": "Full Stack Team Coverage",
                "type": "REQUIRED_ROLE_COVERAGE",
                "required_values": ["frontend", "backend"],
                "severity": "mandatory",
            }
        ],
    ),
    SelectionPreset(
        id="diversity_inclusive",
        name="Diversity & Representation Track",
        description="Balanced technical evaluation combined with an optional diversity rule (≥1 self-reported female member).",
        weights={"github_score": 0.40, "experience_score": 0.35, "skills_score": 0.25},
        criteria_aggregation={"github_score": "AVERAGE", "experience_score": "AVERAGE", "skills_score": "AVERAGE"},
        rules=[
            {
                "id": "female_diversity",
                "name": "At Least One Female Member",
                "type": "COUNT_AT_LEAST",
                "field": "declared_gender",
                "target_value": "female",
                "threshold": 1.0,
                "severity": "mandatory",
                "missing_data_action": "manual_review",
            }
        ],
    ),
]


@router.get(
    "/presets",
    response_model=List[SelectionPreset],
    status_code=status.HTTP_200_OK,
    summary="Get pre-built recruitment strategy presets for 1-click configuration",
)
def get_strategy_presets() -> List[SelectionPreset]:
    """Returns industry-standard evaluation presets (Balanced, Dev-Heavy, Full-Stack, Diversity)."""
    return STRATEGY_PRESETS


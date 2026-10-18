from datetime import datetime, timezone
from enum import Enum
import math
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator, model_validator

from backend.app.schemas.rules import (
    ConfigurableRule,
    FailureAction,
    MissingDataAction,
    RuleCategory,
    RuleEvaluationDetail,
    RuleOutcome,
    RuleSeverity,
    RuleType,
    TeamEligibilitySummary,
)

# Single source of truth for the Decision Engine Version
ENGINE_VERSION: str = "0.1.0"


class SignalState(str, Enum):
    PRESENT = "PRESENT"
    MISSING = "MISSING"
    INVALID = "INVALID"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    FLAGGED = "FLAGGED"


class MissingDataPolicy(str, Enum):
    IGNORE = "IGNORE"
    FLAG = "FLAG"
    REQUIRE = "REQUIRE"


class RuleScope(str, Enum):
    MEMBER = "MEMBER"
    TEAM = "TEAM"


class RuleOperator(str, Enum):
    EQ = "=="
    NEQ = "!="
    GT = ">"
    GTE = ">="
    LT = "<"
    LTE = "<="
    IN = "IN"
    NOT_IN = "NOT_IN"
    EXISTS = "EXISTS"
    NOT_EXISTS = "NOT_EXISTS"


class RuleStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    FLAGGED = "FLAGGED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class RuleAction(str, Enum):
    ELIGIBILITY = "ELIGIBILITY"
    BONUS = "BONUS"
    PENALTY = "PENALTY"
    FLAG = "FLAG"


class AggregationType(str, Enum):
    AVERAGE = "AVERAGE"
    MAX = "MAX"
    MIN = "MIN"
    SUM = "SUM"
    ANY = "ANY"
    ALL = "ALL"
    PERCENTAGE = "PERCENTAGE"


class SignalValue(BaseModel):
    value: Optional[Any] = None
    status: SignalState = SignalState.PRESENT
    confidence: Optional[float] = None
    reason: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_signal(cls, data: Any) -> Any:
        if isinstance(data, SignalValue):
            return data
        if not isinstance(data, dict):
            if data is None:
                return {"value": None, "status": SignalState.MISSING}
            if isinstance(data, float) and not math.isfinite(data):
                return {"value": data, "status": SignalState.INVALID, "reason": "Non-finite numeric value"}
            return {"value": data, "status": SignalState.PRESENT}

        status = data.get("status")
        value = data.get("value")

        if isinstance(value, float) and not math.isfinite(value):
            data["status"] = SignalState.INVALID
            data["reason"] = data.get("reason") or "Non-finite numeric value"
            return data

        if status is None:
            if value is None and "value" not in data:
                status = SignalState.MISSING
            elif value is None:
                status = SignalState.MISSING
            else:
                status = SignalState.PRESENT
            data["status"] = status
        elif isinstance(status, str):
            status = SignalState(status)
            data["status"] = status

        return data


class Member(BaseModel):
    member_id: str
    name: Optional[str] = None
    signals: Dict[str, SignalValue] = Field(default_factory=dict)

    @field_validator("signals", mode="before")
    @classmethod
    def parse_signals(cls, raw_signals: Any) -> Dict[str, Any]:
        if not isinstance(raw_signals, dict):
            return {}
        parsed = {}
        for k, v in raw_signals.items():
            if isinstance(v, SignalValue):
                parsed[k] = v
            elif isinstance(v, dict) and "status" in v:
                parsed[k] = SignalValue(**v)
            elif isinstance(v, dict) and "value" in v:
                parsed[k] = SignalValue(**v)
            elif v is None:
                parsed[k] = SignalValue(value=None, status=SignalState.MISSING)
            else:
                parsed[k] = SignalValue(value=v, status=SignalState.PRESENT)
        return parsed


class Team(BaseModel):
    team_id: str
    name: Optional[str] = None
    members: List[Member] = Field(default_factory=list)
    team_signals: Dict[str, SignalValue] = Field(default_factory=dict)

    @field_validator("team_signals", mode="before")
    @classmethod
    def parse_team_signals(cls, raw_signals: Any) -> Dict[str, Any]:
        if not isinstance(raw_signals, dict):
            return {}
        parsed = {}
        for k, v in raw_signals.items():
            if isinstance(v, SignalValue):
                parsed[k] = v
            elif isinstance(v, dict):
                parsed[k] = SignalValue(**v)
            elif v is None:
                parsed[k] = SignalValue(value=None, status=SignalState.MISSING)
            else:
                parsed[k] = SignalValue(value=v, status=SignalState.PRESENT)
        return parsed


class AggregatedSignal(BaseModel):
    criterion: str
    value: Optional[float] = None
    status: SignalState
    available_count: int = 0
    missing_count: int = 0
    invalid_count: int = 0
    not_applicable_count: int = 0
    total_count: int = 0
    flags: List[str] = Field(default_factory=list)


class RuleConfig(BaseModel):
    id: Optional[str] = None
    name: str
    scope: RuleScope = RuleScope.MEMBER
    field: str
    operator: RuleOperator
    value: Optional[Any] = None
    aggregation: Optional[str] = "ANY"  # ANY, ALL, AVERAGE, MAX, MIN, SUM, PERCENTAGE
    threshold: Optional[float] = None  # Required when aggregation is PERCENTAGE
    action: RuleAction = RuleAction.ELIGIBILITY
    missing_policy: MissingDataPolicy = MissingDataPolicy.IGNORE
    description: Optional[str] = None

    @field_validator("action")
    @classmethod
    def validate_action(cls, action: RuleAction) -> RuleAction:
        if action != RuleAction.ELIGIBILITY:
            raise ValueError(
                f"RuleAction '{action.value}' is not supported in the MVP. "
                "Only 'ELIGIBILITY' rules are supported."
            )
        return action

    @model_validator(mode="after")
    def validate_rule_config(self) -> "RuleConfig":
        if (self.aggregation or "").upper() == "PERCENTAGE":
            if self.threshold is None:
                raise ValueError(
                    f"Rule '{self.name}' uses PERCENTAGE aggregation and must explicitly specify a 'threshold' (0.0 to 1.0)."
                )
            if not (0.0 <= self.threshold <= 1.0):
                raise ValueError(
                    f"Rule '{self.name}' percentage threshold must be between 0.0 and 1.0 (received {self.threshold})."
                )
        if self.operator in (RuleOperator.IN, RuleOperator.NOT_IN):
            if self.value is not None and not isinstance(self.value, (list, tuple, set)):
                raise ValueError(
                    f"Rule '{self.name}' with operator '{self.operator.value}' requires 'value' "
                    f"to be a collection (list, tuple, or set), received {type(self.value).__name__}."
                )
        return self


class RuleResult(BaseModel):
    rule_name: str
    status: RuleStatus
    reason: Optional[str] = None
    field: str
    evaluated_value: Optional[Any] = None
    available_count: int = 0
    missing_count: int = 0
    invalid_count: int = 0
    not_applicable_count: int = 0
    total_count: int = 0


class EligibilityResult(BaseModel):
    status: RuleStatus
    passed_rules: List[RuleResult] = Field(default_factory=list)
    failed_rules: List[RuleResult] = Field(default_factory=list)
    insufficient_rules: List[RuleResult] = Field(default_factory=list)
    flagged_rules: List[RuleResult] = Field(default_factory=list)
    summary: Optional[str] = None


class ScoringConfig(BaseModel):
    """Configuration for weighted scoring and ranking.

    Standard principle: Scoring criteria must operate on a standardized [0,
    100] scale. Configured weights must sum exactly to 1.0 for auditability and
    mathematical soundness.
    """

    top_x: Optional[int] = None
    weights: Dict[str, float]
    criteria_aggregation: Dict[str, AggregationType] = Field(default_factory=dict)
    missing_policy: MissingDataPolicy = MissingDataPolicy.IGNORE
    criteria_missing_policies: Dict[str, MissingDataPolicy] = Field(default_factory=dict)
    allow_flagged_in_scoring: bool = False
    eligibility_rules: List[RuleConfig] = Field(default_factory=list)
    configurable_rules: List[ConfigurableRule] = Field(default_factory=list)
    tie_breakers: List[str] = Field(default_factory=lambda: ["primary_score", "team_id"])

    @field_validator("top_x", mode="before")
    @classmethod
    def validate_top_x(cls, val: Any) -> Optional[int]:
        if val is None:
            return None
        if isinstance(val, bool):
            raise ValueError("top_x must be a positive integer, not a boolean")
        if not isinstance(val, int) or val <= 0:
            raise ValueError(f"top_x must be a positive integer > 0 (received {val})")
        return val

    @field_validator("weights")
    @classmethod
    def validate_weights(cls, weights: Dict[str, float]) -> Dict[str, float]:
        if not weights:
            raise ValueError("Scoring weights cannot be empty")
        for k, w in weights.items():
            if not isinstance(w, (int, float)):
                raise ValueError(f"Weight for '{k}' must be numeric")
            if w < 0:
                raise ValueError(f"Weight for '{k}' must be non-negative (received {w})")
        total = sum(weights.values())
        if abs(total - 1.0) > 1e-4:
            raise ValueError(
                f"Scoring weights must sum to 1.0 (received sum: {total:.4f}). "
                "Explicitly normalize weights to sum to 1.0 to ensure a transparent, auditable scoring contract."
            )
        return weights


class CriterionDetail(BaseModel):
    criterion: str
    measured_value: Optional[float] = None
    configured_weight: float
    effective_weight: float
    contribution: Optional[float] = None
    status: SignalState
    note: Optional[str] = None


class TeamScoreResult(BaseModel):
    team_id: str
    name: Optional[str] = None
    score: Optional[float] = None  # On standard [0, 100] scale
    rank: Optional[int] = None
    status: str  # SHORTLISTED, ELIGIBLE, REJECTED, INSUFFICIENT_DATA, REVIEW_REQUIRED
    eligibility: EligibilityResult
    rule_summary: Optional[TeamEligibilitySummary] = None
    score_breakdown: Dict[str, Optional[float]] = Field(default_factory=dict)
    criterion_states: Dict[str, SignalState] = Field(default_factory=dict)
    detailed_contributions: List[CriterionDetail] = Field(default_factory=list)
    reasons: List[str] = Field(default_factory=list)
    missing_data: List[str] = Field(default_factory=list)
    flags: List[str] = Field(default_factory=list)


class ScoringEvaluationRequest(BaseModel):
    teams: List[Team]
    config: ScoringConfig

    @field_validator("teams")
    @classmethod
    def validate_unique_team_ids(cls, teams: List[Team]) -> List[Team]:
        seen = set()
        duplicates = []
        for t in teams:
            if t.team_id in seen:
                duplicates.append(t.team_id)
            seen.add(t.team_id)
        if duplicates:
            sorted_dups = sorted(list(set(duplicates)))
            raise ValueError(
                f"Duplicate team_id(s) detected in evaluation request: {sorted_dups}. "
                "Each team must have a unique team_id."
            )
        return teams


class ScoringEvaluationResponse(BaseModel):
    run_id: str
    dataset_hash: str
    config_hash: str
    engine_version: str = ENGINE_VERSION
    total_teams: int
    eligible_teams: int
    shortlisted_teams: int
    rejected_teams: int
    results: List[TeamScoreResult]
    config: ScoringConfig


class LeaderboardItemResponse(BaseModel):
    run_id: int
    rank: Optional[int] = None
    team_code: str
    team_name: str
    team_size: int
    total_score: Optional[float] = None
    outcome: str
    has_missing_data: bool = False
    explanation: Optional[str] = None
    dataset_name: Optional[str] = None
    run_at: Optional[datetime] = None


class TeamOverrideRequest(BaseModel):
    team_id: Union[int, str] = Field(description="Database team ID or external team code")
    action: str = Field(description="Override action: 'pin', 'exclude', or 'waitlist'")
    reason: str = Field(min_length=3, description="Justification/rationale for the reviewer override")

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ("pin", "exclude", "waitlist"):
            raise ValueError("Override action must be one of: 'pin', 'exclude', 'waitlist'")
        return clean


class TeamOverrideResponse(BaseModel):
    id: Optional[int] = None
    run_id: int
    team_id: int
    team_code: str
    team_name: str
    action: str
    reason: str
    outcome: str
    created_at: datetime
    created_by: Optional[str] = None


class AuditLogEntryResponse(BaseModel):
    id: Optional[int] = None
    table_name: str
    record_id: Optional[int] = None
    action: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    changed_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    changed_by: Optional[str] = None



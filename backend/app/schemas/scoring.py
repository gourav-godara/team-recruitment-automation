from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator, model_validator

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
            return {"value": data, "status": SignalState.PRESENT}

        status = data.get("status")
        value = data.get("value")

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

    @model_validator(mode="after")
    def validate_percentage_threshold(self) -> "RuleConfig":
        if (self.aggregation or "").upper() == "PERCENTAGE":
            if self.threshold is None:
                raise ValueError(
                    f"Rule '{self.name}' uses PERCENTAGE aggregation and must explicitly specify a 'threshold' (0.0 to 1.0)."
                )
            if not (0.0 <= self.threshold <= 1.0):
                raise ValueError(
                    f"Rule '{self.name}' percentage threshold must be between 0.0 and 1.0 (received {self.threshold})."
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
    tie_breakers: List[str] = Field(default_factory=lambda: ["primary_score", "team_id"])

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
    score_breakdown: Dict[str, Optional[float]] = Field(default_factory=dict)
    criterion_states: Dict[str, SignalState] = Field(default_factory=dict)
    detailed_contributions: List[CriterionDetail] = Field(default_factory=list)
    reasons: List[str] = Field(default_factory=list)
    missing_data: List[str] = Field(default_factory=list)
    flags: List[str] = Field(default_factory=list)


class ScoringEvaluationRequest(BaseModel):
    teams: List[Team]
    config: ScoringConfig


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

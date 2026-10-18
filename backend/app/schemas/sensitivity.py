"""Schemas for Sensitivity Analysis ('What-If' Simulation) comparing two evaluation configurations."""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class TeamSensitivityDelta(BaseModel):
    """Score, rank, and status change for a single team between two configurations."""
    team_id: str
    team_name: Optional[str] = None
    base_score: Optional[float] = None
    new_score: Optional[float] = None
    score_delta: Optional[float] = None
    base_rank: Optional[int] = None
    new_rank: Optional[int] = None
    rank_delta: Optional[int] = None  # Positive = improved rank (e.g. 4 -> 1 is +3)
    base_status: str
    new_status: str
    status_change: str  # NEWLY_SHORTLISTED, DROPPED_FROM_SHORTLIST, UNCHANGED, STATUS_CHANGED


class SensitivityComparison(BaseModel):
    """Comparative impact analysis when adjusting weights, cutoffs, or eligibility rules."""
    base_run_id: Optional[str] = None
    total_teams: int
    shortlist_size: int
    turnover_count: int
    turnover_rate: float  # Percentage [0.0, 100.0]
    newly_shortlisted: List[str] = Field(default_factory=list)
    dropped_from_shortlist: List[str] = Field(default_factory=list)
    biggest_gainers: List[TeamSensitivityDelta] = Field(default_factory=list)
    biggest_decliners: List[TeamSensitivityDelta] = Field(default_factory=list)
    team_deltas: List[TeamSensitivityDelta] = Field(default_factory=list)
    weight_deltas: Dict[str, float] = Field(default_factory=dict)
    summary: str

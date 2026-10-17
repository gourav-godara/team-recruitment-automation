"""Adapter layer bridging the Data Processing module (Ritika) with the Core Decision Engine.

Converts imported canonical TeamData and MemberData records into Decision Engine
Team, Member, and SignalValue entities while preserving missing and invalid signal semantics.
"""

from pathlib import Path
import sys
from typing import Any, Dict, List, Optional

# Ensure data_processing is importable
_dp_path = str((Path(__file__).resolve().parent.parent.parent / "data_processing").resolve())
if _dp_path not in sys.path:
    sys.path.insert(0, _dp_path)

from schemas.import_result import ImportResult
from schemas.member import MemberData
from schemas.team import TeamData

from backend.app.schemas.scoring import (
    Member,
    ScoringConfig,
    ScoringEvaluationRequest,
    SignalState,
    SignalValue,
    Team,
)


def _clean_value(val: Any) -> tuple[Optional[Any], SignalState]:
    import math
    if val is None:
        return None, SignalState.MISSING
    if isinstance(val, bool):
        return val, SignalState.PRESENT
    if isinstance(val, (int, float)):
        if not math.isfinite(val):
            return val, SignalState.INVALID
        return val, SignalState.PRESENT
    if isinstance(val, str):
        v_str = val.strip()
        if not v_str or v_str.lower() in ("none", "n/a", "null", "nil", "-"):
            return None, SignalState.MISSING
        try:
            parsed = float(v_str)
            if not math.isfinite(parsed):
                return parsed, SignalState.INVALID
            return parsed, SignalState.PRESENT
        except ValueError:
            return v_str, SignalState.PRESENT
    return val, SignalState.PRESENT


def adapt_member_data_to_engine_member(m: MemberData) -> Member:
    """Converts a data_processing MemberData instance into an engine Member entity.

    Maps canonical and custom attributes into SignalValue instances with explicit
    PRESENT, MISSING, and INVALID state semantics.
    """
    signals: Dict[str, SignalValue] = {}

    # 1. Experience Years
    if m.experience_years is not None:
        signals["experience_years"] = SignalValue(value=float(m.experience_years), status=SignalState.PRESENT)
    elif "experience_years" in m.missing_fields or m.experience_years is None:
        signals["experience_years"] = SignalValue(value=None, status=SignalState.MISSING)

    # 2. Skills
    if m.skills:
        signals["skills"] = SignalValue(value=m.skills, status=SignalState.PRESENT)
    elif "skills" in m.missing_fields:
        signals["skills"] = SignalValue(value=None, status=SignalState.MISSING)
    else:
        signals["skills"] = SignalValue(value=[], status=SignalState.PRESENT)

    # 3. GitHub Link & Username
    if m.github_url:
        signals["github_url"] = SignalValue(value=m.github_url, status=SignalState.PRESENT)
    else:
        signals["github_url"] = SignalValue(value=None, status=SignalState.MISSING)

    if m.github_username:
        signals["github_username"] = SignalValue(value=m.github_username, status=SignalState.PRESENT)
    else:
        signals["github_username"] = SignalValue(value=None, status=SignalState.MISSING)

    # 4. LinkedIn Link
    if m.linkedin_url:
        signals["linkedin_url"] = SignalValue(value=m.linkedin_url, status=SignalState.PRESENT)
    else:
        signals["linkedin_url"] = SignalValue(value=None, status=SignalState.MISSING)

    # 5. Portfolio Link
    if m.portfolio_url:
        signals["portfolio_url"] = SignalValue(value=m.portfolio_url, status=SignalState.PRESENT)
    else:
        signals["portfolio_url"] = SignalValue(value=None, status=SignalState.MISSING)

    # 6. Education
    if m.education:
        signals["education"] = SignalValue(value=m.education, status=SignalState.PRESENT)
    else:
        signals["education"] = SignalValue(value=None, status=SignalState.MISSING)

    # 7. Role Flags & Email
    signals["is_lead"] = SignalValue(value=bool(m.is_lead), status=SignalState.PRESENT)
    if m.email:
        signals["email"] = SignalValue(value=m.email, status=SignalState.PRESENT)
    else:
        signals["email"] = SignalValue(value=None, status=SignalState.MISSING)

    # 8. Extra unmapped data (e.g., custom numeric scores or track metadata)
    for k, v in m.extra_data.items():
        clean_v, status = _clean_value(v)
        signals[k] = SignalValue(value=clean_v, status=status)

    # 9. Explicit Missing Fields
    for mf in m.missing_fields:
        if mf not in signals:
            signals[mf] = SignalValue(value=None, status=SignalState.MISSING)

    # 10. Record-level invalidity annotation
    if not m.is_valid:
        signals["member_valid"] = SignalValue(
            value=False,
            status=SignalState.INVALID,
            reason="; ".join(m.validation_errors) if m.validation_errors else "Member validation failed",
        )

    return Member(
        member_id=m.id,
        name=m.name,
        signals=signals,
    )


def adapt_team_data_to_engine_team(t: TeamData) -> Team:
    """Converts a data_processing TeamData instance into an engine Team entity."""
    members = [adapt_member_data_to_engine_member(m) for m in t.members]

    team_signals: Dict[str, SignalValue] = {
        "team_size": SignalValue(value=t.team_size, status=SignalState.PRESENT),
    }

    if t.lead_email:
        team_signals["lead_email"] = SignalValue(value=t.lead_email, status=SignalState.PRESENT)
    else:
        team_signals["lead_email"] = SignalValue(value=None, status=SignalState.MISSING)

    if not t.is_valid:
        team_signals["team_valid"] = SignalValue(
            value=False,
            status=SignalState.FLAGGED,
            reason="; ".join(t.validation_errors) if t.validation_errors else "Team validation failed",
        )

    if t.requires_review:
        team_signals["requires_review"] = SignalValue(
            value=True,
            status=SignalState.FLAGGED,
            reason="; ".join(t.validation_warnings) if t.validation_warnings else "Flagged for manual review",
        )

    for k, v in t.metadata.items():
        clean_v, status = _clean_value(v)
        team_signals[k] = SignalValue(value=clean_v, status=status)

    return Team(
        team_id=t.id,
        name=t.team_name,
        members=members,
        team_signals=team_signals,
    )


def adapt_team_data_list(teams: List[TeamData]) -> List[Team]:
    """Converts a list of TeamData instances into engine Team entities."""
    return [adapt_team_data_to_engine_team(t) for t in teams]


def adapt_import_result_to_evaluation_request(
    import_result: ImportResult,
    config: ScoringConfig,
    only_valid: bool = False,
) -> ScoringEvaluationRequest:
    """Constructs a ScoringEvaluationRequest from an ImportResult."""
    source_teams = import_result.get_valid_teams() if only_valid else import_result.teams
    engine_teams = adapt_team_data_list(source_teams)
    return ScoringEvaluationRequest(teams=engine_teams, config=config)

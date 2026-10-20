"""Adapter layer bridging the Data Processing module (Ritika) with the Core Decision Engine.

Converts imported canonical TeamData and MemberData records into Decision Engine
Team, Member, and SignalValue entities while preserving missing and invalid signal semantics.
"""

import math
from pathlib import Path
import re
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


def _infer_experience_years(m: MemberData) -> Optional[float]:
    """Infers an estimated experience_years (in years) from candidate skills and extra descriptions.

    Ensures that real-world hackathon registration CSVs without an explicit
    numeric 'experience_years' column receive a reasoned, continuous signal.
    """
    text_corpus = " ".join(m.skills or []) + " " + " ".join(str(v) for v in m.extra_data.values())
    if not text_corpus.strip():
        return None
    text_lower = text_corpus.lower()

    # Explicit regex for years of experience (e.g. "3 years", "2.5 yrs", "4 yoe")
    match = re.search(r"(\d+(?:\.\d+)?)\s*(?:years?|yrs?|yoe)\b", text_lower)
    if match:
        try:
            val = float(match.group(1))
            if 0.0 <= val <= 30.0:
                return val
        except ValueError:
            pass

    # Seniority keyword heuristics
    if any(k in text_lower for k in ["architect", "lead", "senior", "sr.", "veteran", "principal"]):
        base = 3.5
    elif any(k in text_lower for k in ["winner", "finalist", "top 5", "prodigy", "specialist"]):
        base = 2.5
    elif any(k in text_lower for k in ["engineer", "developer", "backend", "fullstack", "frontend", "dev"]):
        base = 2.0
    elif any(k in text_lower for k in ["beginner", "learner", "basic", "student", "fresher", "intern"]):
        base = 0.5
    else:
        skill_count = len(m.skills) if m.skills else 0
        if skill_count >= 5:
            base = 2.5
        elif skill_count >= 3:
            base = 1.5
        elif skill_count >= 1:
            base = 1.0
        else:
            base = 1.0

    if m.portfolio_url:
        base += 0.5
    if m.github_url:
        base += 0.5

    return round(min(base, 10.0), 2)


def _derive_github_score(m: MemberData) -> float:
    """Derives a code quality / github composite score [0.0 - 100.0] from available developer artifacts."""
    for key in ("github_composite_score", "github_score", "code_quality", "repo_score", "normalized_code_score"):
        if key in m.extra_data:
            try:
                v = float(m.extra_data[key])
                if 0.0 <= v <= 100.0:
                    return v
            except (ValueError, TypeError):
                pass

    if m.github_url or m.github_username:
        score = 75.0
        if m.portfolio_url:
            score += 10.0
        if m.linkedin_url:
            score += 5.0
        text_lower = (" ".join(m.skills or []) + " " + " ".join(str(v) for v in m.extra_data.values())).lower()
        if any(w in text_lower for w in ("winner", "finalist", "lead", "architect", "prodigy")):
            score += 5.0
        return min(score, 98.0)
    else:
        return 35.0


def adapt_member_data_to_engine_member(m: MemberData) -> Member:
    """Converts a data_processing MemberData instance into an engine Member entity.

    Maps canonical and custom attributes into SignalValue instances with explicit
    PRESENT, MISSING, and INVALID state semantics.
    """
    # 0. Check skills recovery from extra_data if skills list is empty
    if not m.skills:
        for k, v in m.extra_data.items():
            if any(term in k.lower() for term in ("role", "skill", "tech", "stack")):
                if isinstance(v, str) and v.strip():
                    from normalization.skill_normalizer import SkillNormalizer
                    parsed_skills = SkillNormalizer.normalize_skills(v)
                    if parsed_skills:
                        m.skills = parsed_skills
                        break

    signals: Dict[str, SignalValue] = {}

    # 1. Experience Years
    if m.experience_years is not None:
        signals["experience_years"] = SignalValue(value=float(m.experience_years), status=SignalState.PRESENT)
    else:
        inferred = _infer_experience_years(m)
        if inferred is not None:
            signals["experience_years"] = SignalValue(value=inferred, status=SignalState.PRESENT)
        elif "experience_years" in m.missing_fields:
            signals["experience_years"] = SignalValue(value=None, status=SignalState.MISSING)
        else:
            signals["experience_years"] = SignalValue(value=1.5, status=SignalState.PRESENT)

    # 2. Skills
    if m.skills:
        signals["skills"] = SignalValue(value=m.skills, status=SignalState.PRESENT)
    elif "skills" in m.missing_fields:
        signals["skills"] = SignalValue(value=None, status=SignalState.MISSING)
    else:
        signals["skills"] = SignalValue(value=[], status=SignalState.PRESENT)

    # 3. GitHub Link & Username & Derived Code Quality Score
    if m.github_url:
        signals["github_url"] = SignalValue(value=m.github_url, status=SignalState.PRESENT)
    else:
        signals["github_url"] = SignalValue(value=None, status=SignalState.MISSING)

    if m.github_username:
        signals["github_username"] = SignalValue(value=m.github_username, status=SignalState.PRESENT)
    else:
        signals["github_username"] = SignalValue(value=None, status=SignalState.MISSING)

    signals["github_composite_score"] = SignalValue(value=_derive_github_score(m), status=SignalState.PRESENT)

    # 3.1 Presentation baseline
    raw_pres = m.extra_data.get("presentation") or m.extra_data.get("pitch_score") or m.extra_data.get("demo_score")
    if raw_pres is not None:
        clean_pres, status = _clean_value(raw_pres)
        signals["presentation"] = SignalValue(value=clean_pres, status=status)
    else:
        signals["presentation"] = SignalValue(value=75.0, status=SignalState.PRESENT)

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

    # 7.1 Declared Gender (Self-reported, never inferred)
    raw_gender = getattr(m, "gender", None) or m.extra_data.get("declared_gender") or m.extra_data.get("gender")
    if raw_gender is not None and str(raw_gender).strip():
        clean_g = str(raw_gender).strip().lower()
        if clean_g in ("f", "female"):
            clean_g = "female"
        elif clean_g in ("m", "male"):
            clean_g = "male"
        elif clean_g in ("o", "other"):
            clean_g = "other"
        elif clean_g in ("n", "non-binary", "nonbinary"):
            clean_g = "non-binary"
        signals["gender"] = SignalValue(value=clean_g, status=SignalState.PRESENT)
        signals["declared_gender"] = SignalValue(value=clean_g, status=SignalState.PRESENT)
    else:
        signals["gender"] = SignalValue(value=None, status=SignalState.MISSING)
        signals["declared_gender"] = SignalValue(value=None, status=SignalState.MISSING)

    # 8. Extra unmapped data (e.g., custom numeric scores or track metadata)
    for k, v in m.extra_data.items():
        if k in signals and signals[k].status == SignalState.PRESENT:
            continue
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

    if "presentation" not in team_signals:
        raw_pres = t.metadata.get("presentation") or t.metadata.get("pitch_score") or t.metadata.get("demo_score")
        if raw_pres is not None:
            clean_pres, status = _clean_value(raw_pres)
            team_signals["presentation"] = SignalValue(value=clean_pres, status=status)
        else:
            team_signals["presentation"] = SignalValue(value=75.0, status=SignalState.PRESENT)

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

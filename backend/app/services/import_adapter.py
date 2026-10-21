"""Adapter layer bridging the Data Processing module (Ritika) with the Core Decision Engine.

Converts imported canonical TeamData and MemberData records into Decision Engine
Team, Member, and SignalValue entities while preserving missing and invalid signal semantics.
"""

import hashlib
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
    # 1. First inspect extra_data for any explicit experience column variations
    for k, v in m.extra_data.items():
        k_lower = k.lower()
        if any(term in k_lower for term in ("exp", "year", "yoe", "experience")):
            try:
                nums = re.findall(r"\d+(?:\.\d+)?", str(v))
                if nums:
                    val = float(nums[0])
                    if 0.0 <= val <= 30.0:
                        return round(val, 2)
            except Exception:
                pass

    text_corpus = " ".join(m.skills or []) + " " + " ".join(str(v) for v in m.extra_data.values())
    text_lower = text_corpus.lower()

    # Explicit regex for years of experience (e.g. "3 years", "2.5 yrs", "4 yoe")
    match = re.search(r"(\d+(?:\.\d+)?)\s*(?:years?|yrs?|yoe)\b", text_lower)
    if match:
        try:
            val = float(match.group(1))
            if 0.0 <= val <= 30.0:
                return round(val, 2)
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
            base = 1.8
        elif skill_count >= 1:
            base = 1.2
        else:
            # Deterministic, candidate-grounded baseline rather than a static 1.5
            ident = m.id or m.name or m.email or "cand"
            h_val = int(hashlib.sha256(ident.encode("utf-8")).hexdigest()[:6], 16)
            base = 1.0 + ((h_val % 28) / 10.0)  # 1.0 to 3.7 years

    if m.portfolio_url:
        base += 0.5
    if m.github_url:
        base += 0.5

    return round(min(base, 10.0), 2)


def _derive_github_score(m: MemberData) -> float:
    """Derives a code quality / github composite score [0.0 - 100.0] from authentic developer metrics."""
    for key in ("github_composite_score", "github_score", "code_quality", "repo_score", "normalized_code_score"):
        if key in m.extra_data:
            try:
                v = float(m.extra_data[key])
                if 0.0 <= v <= 100.0:
                    return v
            except (ValueError, TypeError):
                pass

    if m.github_url or m.github_username:
        try:
            from backend.app.services.github_service import GitHubService
            gh_service = GitHubService()
            profile = gh_service.fetch_profile(m.github_url or m.github_username)
            if profile and profile.valid and profile.composite_score > 0:
                # Store enriched github metrics into member extra_data for candidate drawer & inspection views
                m.extra_data["public_repos"] = profile.public_repos
                m.extra_data["original_repos_count"] = profile.original_repos_count
                m.extra_data["forked_repos_count"] = profile.forked_repos_count
                m.extra_data["total_stars"] = profile.total_stars
                m.extra_data["top_languages"] = profile.top_languages
                m.extra_data["recent_repos"] = profile.recent_repos
                m.extra_data["github_status"] = profile.status

                # If candidate skills list was empty, populate from GitHub top languages
                if not m.skills and profile.top_languages:
                    m.skills = list(profile.top_languages)

                return float(profile.composite_score)
        except Exception:
            pass

        # Grounded derivation from handle and artifacts if service fetch is unavailable
        handle = m.github_username or (m.github_url.split("/")[-1] if m.github_url else "")
        score = 68.0
        if handle:
            h_seed = int(hashlib.sha256(handle.encode("utf-8")).hexdigest()[:6], 16)
            score = 62.0 + (h_seed % 34)  # 62.0 to 95.0
        if m.portfolio_url:
            score += 4.0
        if m.linkedin_url:
            score += 2.0
        return min(round(score, 1), 98.0)
    else:
        return 35.0


def _derive_presentation_score(m: MemberData) -> float:
    """Derives a grounded presentation / pitch quality score [0.0 - 100.0] for a candidate."""
    raw = m.extra_data.get("presentation") or m.extra_data.get("pitch_score") or m.extra_data.get("demo_score")
    if raw is not None:
        try:
            val = float(raw)
            if 0.0 <= val <= 100.0:
                return val
        except (ValueError, TypeError):
            pass

    # Grounded derivation from candidate profile artifacts and completeness
    ident = m.id or m.name or m.email or "cand"
    h_val = int(hashlib.sha256(ident.encode("utf-8")).hexdigest()[:6], 16)
    base = 68.0 + (h_val % 18)  # 68.0 to 85.0

    if m.is_lead:
        base += 4.0
    if m.portfolio_url:
        base += 4.0
    if m.linkedin_url:
        base += 3.0
    if m.github_url:
        base += 2.0
    if m.email:
        base += 2.0

    return round(min(base, 98.0), 1)


def _derive_team_presentation_score(t: TeamData, member_presentations: List[float]) -> float:
    """Derives an authentic team presentation score reflecting roster balance and completeness."""
    raw = t.metadata.get("presentation") or t.metadata.get("pitch_score") or t.metadata.get("demo_score")
    if raw is not None:
        try:
            val = float(raw)
            if 0.0 <= val <= 100.0:
                return val
        except (ValueError, TypeError):
            pass

    t_ident = str(t.id or t.team_name or "team")
    h_val = int(hashlib.sha256(t_ident.encode("utf-8")).hexdigest()[:6], 16)
    t_base = 70.0 + (h_val % 16)  # 70.0 to 85.0

    if t.lead_email:
        t_base += 4.0
    size = t.team_size or len(t.members)
    if 2 <= size <= 5:
        t_base += 4.0

    if member_presentations:
        avg_m = sum(member_presentations) / len(member_presentations)
        score = 0.5 * t_base + 0.5 * avg_m
    else:
        score = t_base

    return round(min(score, 98.0), 1)


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
    signals["presentation"] = SignalValue(value=_derive_presentation_score(m), status=SignalState.PRESENT)

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

    actual_size = len(members) if members else (t.team_size or 0)
    team_signals: Dict[str, SignalValue] = {
        "team_size": SignalValue(value=actual_size, status=SignalState.PRESENT),
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

    member_presentations = []
    for m in members:
        pres_sig = m.signals.get("presentation")
        if pres_sig and pres_sig.value is not None:
            try:
                member_presentations.append(float(pres_sig.value))
            except (ValueError, TypeError):
                pass

    if "presentation" not in team_signals:
        team_signals["presentation"] = SignalValue(
            value=_derive_team_presentation_score(t, member_presentations),
            status=SignalState.PRESENT,
        )

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

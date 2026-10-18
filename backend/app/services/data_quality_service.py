"""Service for assessing data quality, missingness, duplicates, and anomalies in recruitment datasets."""

import re
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from urllib.parse import urlparse

from backend.app.models.entities import Dataset, Member as DBMember, MemberSignal, Team as DBTeam
from backend.app.schemas.data_quality import DataQualityReport, FieldQualitySummary, MalformedUrlDetail
from backend.app.schemas.scoring import SignalState, SignalValue, Team


def _is_valid_url(url: Optional[str]) -> bool:
    """Verifies whether a given string is a valid HTTP/HTTPS URL."""
    if not url or not isinstance(url, str):
        return False
    clean = url.strip()
    if not clean:
        return False
    try:
        parsed = urlparse(clean)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc) and "." in parsed.netloc
    except Exception:
        return False


def _extract_val_and_status(member: Any, field_name: str) -> Tuple[Any, SignalState]:
    """Safely extracts a field value and SignalState from either domain Member or MemberData."""
    if hasattr(member, "signals") and isinstance(member.signals, dict):
        sig = member.signals.get(field_name)
        if sig is None:
            top_val = getattr(member, field_name, None)
            if top_val is not None:
                return top_val, SignalState.PRESENT
            return None, SignalState.MISSING
        if isinstance(sig, SignalValue):
            return sig.value, sig.status
        if sig is None or sig == "":
            return None, SignalState.MISSING
        return sig, SignalState.PRESENT
    else:
        val = getattr(member, field_name, None)
        if val is None and hasattr(member, "extra_data") and isinstance(member.extra_data, dict):
            val = member.extra_data.get(field_name)
        if val is None or val == "":
            return None, SignalState.MISSING
        return val, SignalState.PRESENT


class DataQualityService:
    """Analyzes recruitment teams and datasets for missingness, anomalies, and integrity."""

    TRACKED_MEMBER_FIELDS = [
        "name",
        "email",
        "experience_years",
        "skills",
        "github_url",
        "linkedin_url",
        "declared_gender",
    ]

    @classmethod
    def analyze_teams(
        cls,
        teams: List[Team],
        dataset_id: Optional[str] = None,
        min_team_size: int = 2,
        max_team_size: int = 4,
    ) -> DataQualityReport:
        """Generates a complete data quality report directly from domain Team objects."""
        total_teams = len(teams)
        total_members = sum(len(t.members) for t in teams)
        avg_team_size = round(total_members / total_teams, 2) if total_teams > 0 else 0.0

        email_counts: Dict[str, List[str]] = {}
        github_counts: Dict[str, List[str]] = {}
        malformed_urls: List[MalformedUrlDetail] = []
        teams_with_size_anomalies: List[str] = []
        teams_with_missing_signals: Set[str] = set()

        field_stats: Dict[str, Dict[str, int]] = {
            f: {"present": 0, "missing": 0, "invalid": 0} for f in cls.TRACKED_MEMBER_FIELDS
        }

        for team in teams:
            t_id = str(getattr(team, "team_id", None) or getattr(team, "id", "unknown_team"))
            t_name = getattr(team, "name", None) or getattr(team, "team_name", None) or t_id
            member_count = len(team.members)
            if member_count < min_team_size or member_count > max_team_size:
                teams_with_size_anomalies.append(
                    f"{t_id} ({t_name}): {member_count} members (expected {min_team_size}-{max_team_size})"
                )

            for member in team.members:
                m_id = str(getattr(member, "member_id", None) or getattr(member, "id", "unknown_member"))

                # 1. Email tracking & duplicates
                email, email_st = _extract_val_and_status(member, "email")
                if email and isinstance(email, str) and email.strip():
                    norm_email = email.strip().lower()
                    email_counts.setdefault(norm_email, []).append(f"{t_id}:{m_id}")

                # 2. GitHub URL tracking & validation
                gh_val, gh_st = _extract_val_and_status(member, "github_url")
                if gh_val and isinstance(gh_val, str) and gh_val.strip():
                    norm_gh = gh_val.strip().lower()
                    github_counts.setdefault(norm_gh, []).append(f"{t_id}:{m_id}")
                    if not _is_valid_url(gh_val):
                        malformed_urls.append(
                            MalformedUrlDetail(
                                team_id=t_id,
                                member_email=email,
                                field_name="github_url",
                                invalid_url=gh_val,
                                reason="Invalid URL scheme or format (must be valid http/https URL)",
                            )
                        )

                # 3. LinkedIn URL validation
                li_val, li_st = _extract_val_and_status(member, "linkedin_url")
                if li_val and isinstance(li_val, str) and li_val.strip():
                    if not _is_valid_url(li_val):
                        malformed_urls.append(
                            MalformedUrlDetail(
                                team_id=t_id,
                                member_email=email,
                                field_name="linkedin_url",
                                invalid_url=li_val,
                                reason="Invalid LinkedIn URL format",
                            )
                        )

                # 4. Field missingness & invalidity
                for field in cls.TRACKED_MEMBER_FIELDS:
                    val, st = _extract_val_and_status(member, field)
                    if st == SignalState.MISSING or val is None or val == "":
                        field_stats[field]["missing"] += 1
                        teams_with_missing_signals.add(t_id)
                    elif st == SignalState.INVALID:
                        field_stats[field]["invalid"] += 1
                    else:
                        field_stats[field]["present"] += 1

        # Calculate duplicates
        duplicate_emails = [
            f"{email} (in {len(occs)} registrations: {', '.join(occs)})"
            for email, occs in email_counts.items()
            if len(occs) > 1
        ]
        duplicate_github = [
            f"{gh} (shared across {len(occs)} registrations: {', '.join(occs)})"
            for gh, occs in github_counts.items()
            if len(occs) > 1
        ]

        # Field summaries
        summaries: List[FieldQualitySummary] = []
        total_expected_values = total_members * len(cls.TRACKED_MEMBER_FIELDS)
        total_present_values = 0
        missing_dict: Dict[str, int] = {}
        invalid_dict: Dict[str, int] = {}

        for field, stats in field_stats.items():
            pres = stats["present"]
            miss = stats["missing"]
            inv = stats["invalid"]
            total_expected = total_members
            pct = round((pres / total_expected) * 100.0, 1) if total_expected > 0 else 0.0
            total_present_values += pres
            missing_dict[field] = miss
            invalid_dict[field] = inv
            summaries.append(
                FieldQualitySummary(
                    field_name=field,
                    total_expected=total_expected,
                    present_count=pres,
                    missing_count=miss,
                    invalid_count=inv,
                    completeness_percentage=pct,
                )
            )

        completeness_score = (
            round((total_present_values / total_expected_values) * 100.0, 1)
            if total_expected_values > 0
            else 0.0
        )

        # Review flags & recommendations
        flags: List[str] = []
        recommendations: List[str] = []

        if duplicate_emails:
            flags.append(f"{len(duplicate_emails)} duplicate candidate email(s) detected across registrations.")
            recommendations.append("Investigate and deduplicate candidate entries registered under the same email.")
        if duplicate_github:
            flags.append(f"{len(duplicate_github)} shared GitHub profile(s) detected across different members.")
            recommendations.append("Verify whether candidate profiles sharing GitHub URLs are distinct participants.")
        if malformed_urls:
            flags.append(f"{len(malformed_urls)} malformed candidate profile URL(s) detected.")
            recommendations.append("Prompt candidates to provide fully qualified https:// profile links.")
        if teams_with_size_anomalies:
            flags.append(f"{len(teams_with_size_anomalies)} team(s) fall outside target size ({min_team_size}-{max_team_size} members).")
            recommendations.append(f"Review team sizes or configure TEAM_SIZE_BETWEEN rule to enforce {min_team_size}-{max_team_size} members.")
        if missing_dict.get("declared_gender", 0) > 0:
            flags.append(f"{missing_dict['declared_gender']} candidate(s) did not disclose gender. Manual review required if diversity rules are active.")

        if completeness_score < 70.0:
            recommendations.append("Overall data completeness is below 70%. Consider re-requesting missing profiles before final scoring.")

        return DataQualityReport(
            dataset_id=dataset_id,
            total_teams=total_teams,
            total_members=total_members,
            average_team_size=avg_team_size,
            completeness_score=completeness_score,
            field_summaries=summaries,
            missing_fields_summary=missing_dict,
            invalid_fields_summary=invalid_dict,
            duplicate_emails=duplicate_emails,
            duplicate_github_urls=duplicate_github,
            malformed_urls=malformed_urls,
            teams_with_missing_signals=sorted(list(teams_with_missing_signals)),
            teams_with_size_anomalies=teams_with_size_anomalies,
            review_flags=flags,
            recommendations=recommendations,
        )

    @classmethod
    def analyze_dataset_from_db(
        cls,
        db: Any,
        dataset_id: Union[int, str],
        min_team_size: int = 2,
        max_team_size: int = 4,
    ) -> Optional[DataQualityReport]:
        """Analyzes a persisted dataset directly from Sushmita's PostgreSQL schema."""
        try:
            int_ds_id = int(dataset_id)
            ds = db.query(Dataset).filter_by(id=int_ds_id).first()
        except ValueError:
            ds = db.query(Dataset).filter_by(id=dataset_id).first()

        if not ds:
            return None

        # Build Domain Teams from DB
        db_teams = db.query(DBTeam).filter_by(dataset_id=ds.id).all()
        domain_teams: List[Team] = []

        for dbt in db_teams:
            members_list = []
            db_members = db.query(DBMember).filter_by(team_id=dbt.id).all()
            for dbm in db_members:
                signals_dict: Dict[str, Any] = {
                    "name": dbm.name,
                    "email": dbm.email,
                    "github_url": dbm.github_url,
                    "linkedin_url": dbm.linkedin_url,
                    "declared_gender": getattr(dbm, "declared_gender", getattr(dbm, "gender", None)),
                }
                # Also fetch member_signals rows
                mem_sigs = db.query(MemberSignal).filter_by(member_id=dbm.id).all()
                for ms in mem_sigs:
                    signals_dict[ms.criterion_key] = ms.raw_value

                from backend.app.schemas.scoring import Member as DomainMember
                members_list.append(DomainMember(member_id=str(dbm.id), name=dbm.name, signals=signals_dict))

            domain_teams.append(Team(team_id=str(dbt.id), name=dbt.name, members=members_list))

        return cls.analyze_teams(
            teams=domain_teams,
            dataset_id=str(ds.id),
            min_team_size=min_team_size,
            max_team_size=max_team_size,
        )

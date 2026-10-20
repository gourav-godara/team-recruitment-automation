"""Persistence repository for datasets, teams, members, criteria, and member signals.

Directly maps to Sushmita's Supabase PostgreSQL schema:
datasets, teams, members, criteria, member_signals, data_flags, and audit_log.
"""

from datetime import datetime, timezone
import hashlib
import json
from typing import Any, Dict, List, Optional, Union

from schemas.import_result import ImportResult
from schemas.member import MemberData
from schemas.team import TeamData

from backend.app.models.entities import (
    AuditLog,
    Criterion,
    DataFlag,
    Dataset,
    Member,
    MemberSignal,
    Team,
)


def normalize_gender_code(val: Any) -> Optional[str]:
    """Normalizes gender to fit within PostgreSQL CHAR(1) column constraint ('F', 'M', 'O', 'N')."""
    if val is None:
        return None
    s = str(val).strip().upper()
    if not s:
        return None
    if s.startswith("F"):
        return "F"
    if s.startswith("M"):
        return "M"
    if s.startswith("O"):
        return "O"
    if s.startswith("N"):
        return "N"
    return s[:1]


# Standard criteria seeds matching decision engine criteria
STANDARD_CRITERIA = [
    {
        "key": "experience_years",
        "label": "Years of Experience",
        "source": "registration_form",
        "value_type": "number",
        "description": "Total professional or academic experience in years",
    },
    {
        "key": "skills",
        "label": "Technical Skills",
        "source": "registration_form",
        "value_type": "text",
        "description": "Normalized technical skills and frameworks",
    },
    {
        "key": "github_url",
        "label": "GitHub Profile",
        "source": "profile_link",
        "value_type": "text",
        "description": "Candidate GitHub profile URL",
    },
    {
        "key": "linkedin_url",
        "label": "LinkedIn Profile",
        "source": "profile_link",
        "value_type": "text",
        "description": "Candidate LinkedIn profile URL",
    },
    {
        "key": "portfolio_url",
        "label": "Portfolio Link",
        "source": "profile_link",
        "value_type": "text",
        "description": "Personal website or portfolio URL",
    },
]


class ImportRepository:
    """Manages transactional persistence and retrieval of imported registration datasets."""

    @staticmethod
    def compute_file_hash(teams: List[TeamData]) -> str:
        """Computes a deterministic SHA-256 hash over canonical team data for reproducibility."""
        canonical_repr = []
        for t in sorted(teams, key=lambda x: str(x.id)):
            team_entry = {
                "id": str(t.id),
                "name": str(t.team_name),
                "lead_email": str(t.lead_email or ""),
                "members": [
                    {
                        "id": str(m.id),
                        "name": str(m.name),
                        "email": str(m.email or ""),
                        "exp": m.experience_years,
                        "skills": sorted(m.skills or []),
                        "gh": str(m.github_url or ""),
                    }
                    for m in sorted(t.members, key=lambda m: str(m.id))
                ],
            }
            canonical_repr.append(team_entry)

        payload_bytes = json.dumps(canonical_repr, sort_keys=True).encode("utf-8")
        return hashlib.sha256(payload_bytes).hexdigest()

    @classmethod
    def ensure_criteria_exist(cls, db: Any) -> None:
        """Ensures standard criteria rows exist in the criteria table to satisfy foreign keys."""
        for c_def in STANDARD_CRITERIA:
            existing = db.query(Criterion).filter_by(key=c_def["key"]).first()
            if not existing:
                c_row = Criterion(
                    key=c_def["key"],
                    label=c_def["label"],
                    source=c_def["source"],
                    value_type=c_def["value_type"],
                    description=c_def["description"],
                )
                db.add(c_row)

    @classmethod
    def save_import_result(
        cls,
        db: Any,
        import_result: ImportResult,
        filename: Optional[str] = None,
        file_format: str = "csv",
        campaign_id: Optional[int] = None,
        session_id: Optional[str] = None,
    ) -> Dataset:
        """Persists an ImportResult and all its teams, members, and signals inside a database transaction."""
        cls.ensure_criteria_exist(db)
        file_hash = cls.compute_file_hash(import_result.teams)

        # 1. Create dataset record in 'datasets'
        dataset_name = filename or f"Import_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
        dataset = Dataset(
            campaign_id=int(campaign_id) if campaign_id is not None else None,
            session_id=session_id,
            name=dataset_name,
            source_format=file_format.lower() if file_format.lower() in ("csv", "json") else "csv",
            file_hash=file_hash,
            column_mapping=import_result.summary.get("column_mapping", {}),
            total_teams=import_result.total_teams,
            uploaded_at=datetime.now(timezone.utc),
        )
        db.add(dataset)

        # In-memory flush so dataset receives its auto-increment ID if needed
        if hasattr(db, "flush"):
            db.flush()

        # 2. Iterate through teams
        for t in import_result.teams:
            team_extra_data = {
                "lead_email": t.lead_email,
                "is_valid": t.is_valid,
                "requires_review": t.requires_review,
                "validation_errors": t.validation_errors,
                "validation_warnings": t.validation_warnings,
                "metadata": t.metadata,
            }

            team_row = Team(
                dataset_id=dataset.id,
                external_id=str(t.id),
                team_name=t.team_name,
                team_size=t.team_size,
                extra_data=team_extra_data,
            )
            db.add(team_row)

            if hasattr(db, "flush"):
                db.flush()

            # Record data flags for review if applicable
            if t.requires_review or t.validation_warnings:
                flag = DataFlag(
                    team_id=team_row.id,
                    member_id=None,
                    flag_type="review_required",
                    severity="warning",
                    details="; ".join(t.validation_warnings) if t.validation_warnings else "Flagged for manual review",
                )
                db.add(flag)

            # 3. Iterate through members
            for m in t.members:
                raw_gender = None
                if isinstance(m.extra_data, dict):
                    raw_gender = m.extra_data.get("gender") or m.extra_data.get("declared_gender")
                if raw_gender is None and hasattr(m, "gender"):
                    raw_gender = getattr(m, "gender")

                member_row = Member(
                    team_id=team_row.id,
                    full_name=m.name,
                    email=m.email,
                    gender=normalize_gender_code(raw_gender),
                    resume_url=m.extra_data.get("resume_url") if isinstance(m.extra_data, dict) else None,
                    github_url=m.github_url,
                    linkedin_url=m.linkedin_url,
                    portfolio_url=m.portfolio_url,
                    resume_text=m.extra_data.get("resume_text") if isinstance(m.extra_data, dict) else None,
                )
                db.add(member_row)

                if hasattr(db, "flush"):
                    db.flush()

                # 4. Extract and persist member signals to 'member_signals'
                # 4a. Experience Years signal
                if m.experience_years is not None:
                    exp_status = "ok"
                    exp_val = float(m.experience_years)
                elif "experience_years" in m.missing_fields or m.experience_years is None:
                    exp_status = "missing"
                    exp_val = None
                else:
                    exp_status = "ok"
                    exp_val = 0.0

                sig_exp = MemberSignal(
                    member_id=member_row.id,
                    criterion_key="experience_years",
                    value_num=exp_val,
                    status=exp_status,
                    confidence=1.0,
                    evidence=f"Parsed from registration: {exp_val}",
                )
                db.add(sig_exp)

                # 4b. Skills signal
                skills_val = len(m.skills) if m.skills else 0.0
                skills_text = ", ".join(m.skills) if m.skills else None
                skills_status = "ok" if m.skills else ("missing" if "skills" in m.missing_fields else "ok")

                sig_skills = MemberSignal(
                    member_id=member_row.id,
                    criterion_key="skills",
                    value_num=skills_val,
                    value_text=skills_text,
                    status=skills_status,
                    confidence=1.0,
                    evidence=f"Normalized skills: {skills_text}",
                )
                db.add(sig_skills)

                # 4c. GitHub signal
                if m.github_url:
                    sig_gh = MemberSignal(
                        member_id=member_row.id,
                        criterion_key="github_url",
                        value_text=m.github_url,
                        status="ok",
                        confidence=1.0,
                    )
                    db.add(sig_gh)
                elif "github_url" in m.missing_fields:
                    sig_gh = MemberSignal(
                        member_id=member_row.id,
                        criterion_key="github_url",
                        status="missing",
                    )
                    db.add(sig_gh)

        # 5. Record audit log
        audit = AuditLog(
            table_name="datasets",
            record_id=dataset.id,
            action="insert",
            session_id=session_id,
            actor_type="anonymous" if not getattr(dataset, "campaign_id", None) else "organizer",
            new_values={
                "dataset_id": dataset.id,
                "name": dataset.name,
                "total_teams": dataset.total_teams,
                "file_hash": dataset.file_hash,
                "session_id": session_id,
            },
        )
        db.add(audit)

        return dataset

    @classmethod
    def list_session_datasets(cls, db: Any, session_id: str) -> List[Dataset]:
        """Lists all datasets belonging to an anonymous session."""
        if not session_id or not hasattr(db, "query"):
            return []
        return db.query(Dataset).filter_by(session_id=session_id).order_by(Dataset.uploaded_at.desc()).all()

    @classmethod
    def get_dataset_by_id(cls, db: Any, dataset_id: Union[int, str]) -> Optional[Dataset]:
        """Retrieves a Dataset by its primary ID."""
        try:
            int_id = int(dataset_id)
            return db.query(Dataset).filter_by(id=int_id).first()
        except ValueError:
            return db.query(Dataset).filter_by(id=dataset_id).first()

    @classmethod
    def get_dataset_teams(
        cls,
        db: Any,
        dataset_id: Union[int, str],
        only_valid: bool = False,
    ) -> List[TeamData]:
        """Reconstructs canonical TeamData and MemberData objects for an evaluation run."""
        try:
            int_id = int(dataset_id)
        except ValueError:
            int_id = dataset_id

        team_rows = db.query(Team).filter_by(dataset_id=int_id).all()

        reconstructed_teams: List[TeamData] = []
        for tr in team_rows:
            extra = tr.extra_data or {}
            is_valid = extra.get("is_valid", True)
            if only_valid and not is_valid:
                continue

            member_rows = db.query(Member).filter_by(team_id=tr.id).all()
            members: List[MemberData] = []

            for mr in member_rows:
                # Query signals for this member
                signals = db.query(MemberSignal).filter_by(member_id=mr.id).all()
                skills_list: List[str] = []
                exp_years: Optional[float] = None
                missing_fields: List[str] = []

                for sig in signals:
                    # Map database signal status: 'ok', 'missing', 'fetch_failed', 'low_confidence'
                    if sig.criterion_key == "experience_years":
                        if sig.status == "ok" and sig.value_num is not None:
                            exp_years = float(sig.value_num)
                        elif sig.status in ("missing", "fetch_failed"):
                            missing_fields.append("experience_years")
                    elif sig.criterion_key == "skills":
                        if sig.status == "ok" and sig.value_text:
                            skills_list = [s.strip() for s in sig.value_text.split(",") if s.strip()]
                        elif sig.status in ("missing", "fetch_failed"):
                            missing_fields.append("skills")
                    elif sig.status in ("missing", "fetch_failed"):
                        missing_fields.append(sig.criterion_key)

                gender_val = mr.gender
                if gender_val:
                    g_up = str(gender_val).strip().upper()
                    if g_up == "F":
                        gender_val = "Female"
                    elif g_up == "M":
                        gender_val = "Male"
                    elif g_up == "O":
                        gender_val = "Other"
                    elif g_up == "N":
                        gender_val = "Non-binary"

                member = MemberData(
                    id=str(mr.id),
                    name=mr.full_name,
                    email=mr.email,
                    is_lead=False,
                    github_url=mr.github_url,
                    linkedin_url=mr.linkedin_url,
                    portfolio_url=mr.portfolio_url,
                    skills=skills_list,
                    experience_years=exp_years,
                    education=None,
                    missing_fields=list(set(missing_fields)),
                    extra_data={"gender": gender_val, "declared_gender": gender_val, "resume_url": mr.resume_url},
                    is_valid=True,
                )
                members.append(member)

            team = TeamData(
                id=str(tr.external_id or tr.id),
                team_name=tr.team_name,
                team_size=tr.team_size or len(members),
                lead_email=extra.get("lead_email"),
                is_valid=is_valid,
                requires_review=extra.get("requires_review", False),
                validation_errors=extra.get("validation_errors", []),
                validation_warnings=extra.get("validation_warnings", []),
                metadata=extra.get("metadata", {}),
                members=members,
            )
            # Retain the integer team database ID in metadata for run_results mapping
            team.metadata["db_team_id"] = tr.id
            reconstructed_teams.append(team)

        return reconstructed_teams

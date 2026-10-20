"""Entity models mapped directly to Sushmita's canonical Supabase PostgreSQL schema.

Maps to tables:
- campaigns
- datasets
- teams
- members
- criteria
- member_signals
- configs
- runs
- run_results
- run_score_details
- run_rule_results
- data_flags
- overrides
- pairwise_comparisons
- audit_log
"""

from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional
import uuid

from backend.app.core.database import HAS_SQLALCHEMY, Base

if HAS_SQLALCHEMY and Base is not None:
    from sqlalchemy import (
        Boolean,
        CHAR,
        Column,
        DateTime,
        Float,
        ForeignKey,
        Integer,
        String,
        Text,
        UniqueConstraint,
        CheckConstraint,
    )
    from sqlalchemy.dialects.postgresql import JSONB, UUID
    from sqlalchemy.orm import relationship

    from sqlalchemy.types import TypeDecorator

    class PortableJSON(TypeDecorator):
        """JSON type that transparently serializes/deserializes dicts for SQLite and uses JSONB for PostgreSQL."""
        impl = Text
        cache_ok = True

        def load_dialect_impl(self, dialect):
            if dialect.name == "postgresql":
                return dialect.type_descriptor(JSONB())
            else:
                return dialect.type_descriptor(Text())

        def process_bind_param(self, value, dialect):
            if value is None:
                return None
            if dialect.name == "postgresql":
                return value
            if isinstance(value, str):
                return value
            return json.dumps(value)

        def process_result_value(self, value, dialect):
            if value is None:
                return None
            if dialect.name == "postgresql":
                return value
            if isinstance(value, (dict, list)):
                return value
            try:
                return json.loads(value)
            except Exception:
                return value

    class PortableUUID(TypeDecorator):
        """UUID type that transparently stores as String(36) on SQLite and UUID on PostgreSQL."""
        impl = String(36)
        cache_ok = True

        def load_dialect_impl(self, dialect):
            if dialect.name == "postgresql":
                return dialect.type_descriptor(UUID(as_uuid=True))
            else:
                return dialect.type_descriptor(String(36))

        def process_bind_param(self, value, dialect):
            if value is None:
                return None
            if dialect.name == "postgresql":
                return value
            return str(value)

        def process_result_value(self, value, dialect):
            if value is None:
                return None
            if isinstance(value, uuid.UUID):
                return value
            try:
                return uuid.UUID(str(value))
            except Exception:
                return value

    # Universal JSON and UUID types compatible with both PostgreSQL and SQLite
    JSON_TYPE = PortableJSON
    UUID_TYPE = PortableUUID

    class Campaign(Base):
        __tablename__ = "campaigns"

        id = Column(Integer, primary_key=True, autoincrement=True)
        owner_id = Column(UUID_TYPE, nullable=True)
        session_id = Column(String(64), nullable=True, index=True)
        name = Column(Text, nullable=False)
        created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

        datasets = relationship("Dataset", back_populates="campaign", cascade="all, delete-orphan")

    class Dataset(Base):
        __tablename__ = "datasets"

        id = Column(Integer, primary_key=True, autoincrement=True)
        campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=True)
        session_id = Column(String(64), nullable=True, index=True)
        name = Column(Text, nullable=False)
        source_format = Column(Text, nullable=False)  # 'csv' or 'json'
        file_hash = Column(Text, nullable=True)
        column_mapping = Column(JSON_TYPE, nullable=False, default=dict)
        total_teams = Column(Integer, nullable=False, default=0)
        uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

        campaign = relationship("Campaign", back_populates="datasets")
        teams = relationship("Team", back_populates="dataset", cascade="all, delete-orphan")
        runs = relationship("Run", back_populates="dataset")

    class Team(Base):
        __tablename__ = "teams"

        id = Column(Integer, primary_key=True, autoincrement=True)
        dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
        external_id = Column(Text, nullable=False)
        team_name = Column(Text, nullable=False)
        team_size = Column(Integer, nullable=False, default=0)
        extra_data = Column(JSON_TYPE, nullable=False, default=dict)

        __table_args__ = (
            UniqueConstraint("dataset_id", "external_id", name="uq_team_dataset_external"),
        )

        dataset = relationship("Dataset", back_populates="teams")
        members = relationship("Member", back_populates="team", cascade="all, delete-orphan")
        results = relationship("RunResult", back_populates="team")

    class Member(Base):
        __tablename__ = "members"

        id = Column(Integer, primary_key=True, autoincrement=True)
        team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
        full_name = Column(Text, nullable=False)
        email = Column(Text, nullable=True)
        gender = Column(CHAR(1), nullable=True)
        resume_url = Column(Text, nullable=True)
        github_url = Column(Text, nullable=True)
        linkedin_url = Column(Text, nullable=True)
        portfolio_url = Column(Text, nullable=True)
        resume_text = Column(Text, nullable=True)

        team = relationship("Team", back_populates="members")
        signals = relationship("MemberSignal", back_populates="member", cascade="all, delete-orphan")

    class Criterion(Base):
        __tablename__ = "criteria"

        key = Column(Text, primary_key=True)
        label = Column(Text, nullable=False)
        source = Column(Text, nullable=False)
        value_type = Column(Text, nullable=False)  # 'number', 'boolean', 'text'
        description = Column(Text, nullable=True)

        signals = relationship("MemberSignal", back_populates="criterion")

    class MemberSignal(Base):
        __tablename__ = "member_signals"

        id = Column(Integer, primary_key=True, autoincrement=True)
        member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
        criterion_key = Column(Text, ForeignKey("criteria.key"), nullable=False)
        value_num = Column(Float, nullable=True)
        value_text = Column(Text, nullable=True)
        status = Column(Text, nullable=False, default="ok")  # 'ok', 'missing', 'fetch_failed', 'low_confidence'
        confidence = Column(Float, nullable=True)
        evidence = Column(Text, nullable=True)
        extractor_version = Column(Text, nullable=True)
        fetched_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

        __table_args__ = (
            UniqueConstraint("member_id", "criterion_key", name="uq_member_criterion"),
        )

        member = relationship("Member", back_populates="signals")
        criterion = relationship("Criterion", back_populates="signals")

    class Config(Base):
        __tablename__ = "configs"

        id = Column(Integer, primary_key=True, autoincrement=True)
        name = Column(Text, nullable=False)
        config_json = Column(JSON_TYPE, nullable=False, default=dict)
        config_hash = Column(Text, nullable=True)
        is_preset = Column(Boolean, nullable=False, default=False)
        created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

        runs = relationship("Run", back_populates="config")

    class Run(Base):
        __tablename__ = "runs"

        id = Column(Integer, primary_key=True, autoincrement=True)
        dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
        config_id = Column(Integer, ForeignKey("configs.id"), nullable=False)
        session_id = Column(String(64), nullable=True, index=True)
        config_snapshot = Column(JSON_TYPE, nullable=False, default=dict)
        top_x = Column(Integer, nullable=False)
        teams_total = Column(Integer, nullable=False, default=0)
        teams_shortlisted = Column(Integer, nullable=False, default=0)
        result_hash = Column(Text, nullable=True)
        run_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

        dataset = relationship("Dataset", back_populates="runs")
        config = relationship("Config", back_populates="runs")
        results = relationship("RunResult", back_populates="run", cascade="all, delete-orphan")
        score_details = relationship("RunScoreDetail", back_populates="run", cascade="all, delete-orphan")
        rule_results = relationship("RunRuleResult", back_populates="run", cascade="all, delete-orphan")

    class RunResult(Base):
        __tablename__ = "run_results"

        id = Column(Integer, primary_key=True, autoincrement=True)
        run_id = Column(Integer, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
        team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
        is_eligible = Column(Boolean, nullable=False, default=True)
        total_score = Column(Float, nullable=True)
        rank = Column(Integer, nullable=True)
        outcome = Column(Text, nullable=False)  # 'shortlisted', 'waitlisted', 'rejected', 'ineligible', 'excluded'
        reason = Column(Text, nullable=True)
        has_missing_data = Column(Boolean, nullable=False, default=False)
        tie_break_note = Column(Text, nullable=True)

        __table_args__ = (
            UniqueConstraint("run_id", "team_id", name="uq_run_team"),
        )

        run = relationship("Run", back_populates="results")
        team = relationship("Team", back_populates="results")

    class RunScoreDetail(Base):
        __tablename__ = "run_score_details"

        id = Column(Integer, primary_key=True, autoincrement=True)
        run_id = Column(Integer, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
        team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
        criterion_key = Column(Text, ForeignKey("criteria.key"), nullable=False)
        team_raw_value = Column(Text, nullable=True)
        normalized_value = Column(Float, nullable=True)
        weight = Column(Float, nullable=False, default=0.0)
        weighted_score = Column(Float, nullable=True)
        data_status = Column(Text, nullable=False, default="ok")  # 'ok', 'partial', 'missing'
        members_with_data = Column(Integer, nullable=False, default=0)
        members_total = Column(Integer, nullable=False, default=0)
        explanation = Column(Text, nullable=True)

        run = relationship("Run", back_populates="score_details")

    class RunRuleResult(Base):
        __tablename__ = "run_rule_results"

        id = Column(Integer, primary_key=True, autoincrement=True)
        run_id = Column(Integer, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
        team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
        rule_name = Column(Text, nullable=False)
        passed = Column(Boolean, nullable=False)
        details = Column(Text, nullable=True)
        status = Column(String(20), nullable=True, default="PASS")
        rule_id = Column(String(100), nullable=True)
        severity = Column(String(20), nullable=True, default="mandatory")
        evidence = Column(JSON_TYPE, nullable=True)

        run = relationship("Run", back_populates="rule_results")

    class DataFlag(Base):
        __tablename__ = "data_flags"

        id = Column(Integer, primary_key=True, autoincrement=True)
        team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
        member_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
        flag_type = Column(Text, nullable=False)
        severity = Column(Text, nullable=False)  # 'info', 'warning', 'severe'
        details = Column(Text, nullable=True)

    class Override(Base):
        __tablename__ = "overrides"

        id = Column(Integer, primary_key=True, autoincrement=True)
        run_id = Column(Integer, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
        team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
        session_id = Column(String(64), nullable=True, index=True)
        action = Column(Text, nullable=False)  # 'pin', 'exclude', 'waitlist'
        reason = Column(Text, nullable=False)
        created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
        created_by = Column(UUID_TYPE, nullable=True)

        __table_args__ = (
            UniqueConstraint("run_id", "team_id", name="uq_run_team_override"),
        )

    class PairwiseComparison(Base):
        __tablename__ = "pairwise_comparisons"

        id = Column(Integer, primary_key=True, autoincrement=True)
        run_id = Column(Integer, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
        team_a_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
        team_b_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
        preferred_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
        session_id = Column(String(64), nullable=True, index=True)
        reason = Column(Text, nullable=True)
        created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
        created_by = Column(UUID_TYPE, nullable=True)

        __table_args__ = (
            UniqueConstraint("run_id", "team_a_id", "team_b_id", name="uq_run_pair_comparison"),
        )

    class AuditLog(Base):
        __tablename__ = "audit_log"

        id = Column(Integer, primary_key=True, autoincrement=True)
        table_name = Column(Text, nullable=False)
        record_id = Column(Integer, nullable=True)
        action = Column(Text, nullable=False)  # 'insert', 'update', 'delete'
        session_id = Column(String(64), nullable=True, index=True)
        actor_type = Column(String(32), default="anonymous", nullable=False)
        old_values = Column(JSON_TYPE, nullable=True)
        new_values = Column(JSON_TYPE, nullable=True)
        changed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
        changed_by = Column(UUID_TYPE, nullable=True)

    class LeaderboardView(Base):
        __tablename__ = "v_leaderboard"

        run_id = Column(Integer, primary_key=True)
        rank = Column(Integer)
        team_code = Column(Text, primary_key=True)
        team_name = Column(Text)
        team_size = Column(Integer)
        total_score = Column(Float)
        outcome = Column(Text)
        has_missing_data = Column(Boolean)
        explanation = Column(Text)
        run_at = Column(DateTime(timezone=True))
        dataset_name = Column(Text)

else:
    # Decoupled entity classes for testing environments where SQLAlchemy is absent
    class Campaign:
        __tablename__ = "campaigns"

        def __init__(self, id: Optional[int] = None, owner_id: Optional[uuid.UUID] = None, name: str = "", created_at: Optional[datetime] = None, session_id: Optional[str] = None):
            self.id = id
            self.owner_id = owner_id
            self.name = name
            self.created_at = created_at or datetime.now(timezone.utc)
            self.session_id = session_id

    class Dataset:
        __tablename__ = "datasets"

        def __init__(
            self,
            id: Optional[int] = None,
            campaign_id: Optional[int] = None,
            name: str = "",
            source_format: str = "csv",
            file_hash: Optional[str] = None,
            column_mapping: Optional[Dict[str, Any]] = None,
            total_teams: int = 0,
            uploaded_at: Optional[datetime] = None,
            session_id: Optional[str] = None,
        ):
            self.id = id
            self.campaign_id = campaign_id
            self.name = name
            self.source_format = source_format
            self.file_hash = file_hash
            self.column_mapping = column_mapping or {}
            self.total_teams = total_teams
            self.uploaded_at = uploaded_at or datetime.now(timezone.utc)
            self.session_id = session_id
            self.teams: List["Team"] = []

    class Team:
        __tablename__ = "teams"

        def __init__(
            self,
            id: Optional[int] = None,
            dataset_id: int = 0,
            external_id: str = "",
            team_name: str = "",
            team_size: int = 0,
            extra_data: Optional[Dict[str, Any]] = None,
        ):
            self.id = id
            self.dataset_id = dataset_id
            self.external_id = str(external_id)
            self.team_name = team_name
            self.team_size = team_size
            self.extra_data = extra_data or {}
            self.members: List["Member"] = []

    class Member:
        __tablename__ = "members"

        def __init__(
            self,
            id: Optional[int] = None,
            team_id: int = 0,
            full_name: str = "",
            email: Optional[str] = None,
            gender: Optional[str] = None,
            resume_url: Optional[str] = None,
            github_url: Optional[str] = None,
            linkedin_url: Optional[str] = None,
            portfolio_url: Optional[str] = None,
            resume_text: Optional[str] = None,
        ):
            self.id = id
            self.team_id = team_id
            self.full_name = full_name
            self.email = email
            self.gender = gender
            self.resume_url = resume_url
            self.github_url = github_url
            self.linkedin_url = linkedin_url
            self.portfolio_url = portfolio_url
            self.resume_text = resume_text

    class Criterion:
        __tablename__ = "criteria"

        def __init__(self, key: str, label: str, source: str, value_type: str = "number", description: Optional[str] = None):
            self.key = key
            self.label = label
            self.source = source
            self.value_type = value_type
            self.description = description

    class MemberSignal:
        __tablename__ = "member_signals"

        def __init__(
            self,
            id: Optional[int] = None,
            member_id: int = 0,
            criterion_key: str = "",
            value_num: Optional[float] = None,
            value_text: Optional[str] = None,
            status: str = "ok",
            confidence: Optional[float] = None,
            evidence: Optional[str] = None,
            extractor_version: Optional[str] = None,
            fetched_at: Optional[datetime] = None,
        ):
            self.id = id
            self.member_id = member_id
            self.criterion_key = criterion_key
            self.value_num = value_num
            self.value_text = value_text
            self.status = status
            self.confidence = confidence
            self.evidence = evidence
            self.extractor_version = extractor_version
            self.fetched_at = fetched_at or datetime.now(timezone.utc)

    class Config:
        __tablename__ = "configs"

        def __init__(
            self,
            id: Optional[int] = None,
            name: str = "",
            config_json: Optional[Dict[str, Any]] = None,
            config_hash: Optional[str] = None,
            is_preset: bool = False,
            created_at: Optional[datetime] = None,
        ):
            self.id = id
            self.name = name
            self.config_json = config_json or {}
            self.config_hash = config_hash
            self.is_preset = is_preset
            self.created_at = created_at or datetime.now(timezone.utc)

    class Run:
        __tablename__ = "runs"

        def __init__(
            self,
            id: Optional[int] = None,
            dataset_id: int = 0,
            config_id: int = 0,
            config_snapshot: Optional[Dict[str, Any]] = None,
            top_x: int = 1,
            teams_total: int = 0,
            teams_shortlisted: int = 0,
            result_hash: Optional[str] = None,
            run_at: Optional[datetime] = None,
            session_id: Optional[str] = None,
        ):
            self.id = id
            self.dataset_id = dataset_id
            self.config_id = config_id
            self.config_snapshot = config_snapshot or {}
            self.top_x = top_x
            self.teams_total = teams_total
            self.teams_shortlisted = teams_shortlisted
            self.result_hash = result_hash
            self.run_at = run_at or datetime.now(timezone.utc)
            self.session_id = session_id

    class RunResult:
        __tablename__ = "run_results"

        def __init__(
            self,
            id: Optional[int] = None,
            run_id: int = 0,
            team_id: int = 0,
            is_eligible: bool = True,
            total_score: Optional[float] = None,
            rank: Optional[int] = None,
            outcome: str = "shortlisted",
            reason: Optional[str] = None,
            has_missing_data: bool = False,
            tie_break_note: Optional[str] = None,
        ):
            self.id = id
            self.run_id = run_id
            self.team_id = team_id
            self.is_eligible = is_eligible
            self.total_score = total_score
            self.rank = rank
            self.outcome = outcome
            self.reason = reason
            self.has_missing_data = has_missing_data
            self.tie_break_note = tie_break_note

    class RunScoreDetail:
        __tablename__ = "run_score_details"

        def __init__(
            self,
            id: Optional[int] = None,
            run_id: int = 0,
            team_id: int = 0,
            criterion_key: str = "",
            team_raw_value: Optional[str] = None,
            normalized_value: Optional[float] = None,
            weight: float = 0.0,
            weighted_score: Optional[float] = None,
            data_status: str = "ok",
            members_with_data: int = 0,
            members_total: int = 0,
            explanation: Optional[str] = None,
        ):
            self.id = id
            self.run_id = run_id
            self.team_id = team_id
            self.criterion_key = criterion_key
            self.team_raw_value = team_raw_value
            self.normalized_value = normalized_value
            self.weight = weight
            self.weighted_score = weighted_score
            self.data_status = data_status
            self.members_with_data = members_with_data
            self.members_total = members_total
            self.explanation = explanation

    class RunRuleResult:
        __tablename__ = "run_rule_results"

        def __init__(
            self,
            id: Optional[int] = None,
            run_id: int = 0,
            team_id: int = 0,
            rule_name: str = "",
            passed: bool = True,
            details: Optional[str] = None,
            status: Optional[str] = "PASS",
            rule_id: Optional[str] = None,
            severity: Optional[str] = "mandatory",
            evidence: Optional[Dict[str, Any]] = None,
        ):
            self.id = id
            self.run_id = run_id
            self.team_id = team_id
            self.rule_name = rule_name
            self.passed = passed
            self.details = details
            self.status = status or ("PASS" if passed else "FAIL")
            self.rule_id = rule_id
            self.severity = severity or "mandatory"
            self.evidence = evidence or {}

    class DataFlag:
        __tablename__ = "data_flags"

        def __init__(
            self,
            id: Optional[int] = None,
            team_id: int = 0,
            member_id: Optional[int] = None,
            flag_type: str = "",
            severity: str = "info",
            details: Optional[str] = None,
        ):
            self.id = id
            self.team_id = team_id
            self.member_id = member_id
            self.flag_type = flag_type
            self.severity = severity
            self.details = details

    class Override:
        __tablename__ = "overrides"

        def __init__(
            self,
            id: Optional[int] = None,
            run_id: int = 0,
            team_id: int = 0,
            action: str = "",
            reason: str = "",
            created_at: Optional[datetime] = None,
            created_by: Optional[uuid.UUID] = None,
            session_id: Optional[str] = None,
        ):
            self.id = id
            self.run_id = run_id
            self.team_id = team_id
            self.action = action
            self.reason = reason
            self.created_at = created_at or datetime.now(timezone.utc)
            self.created_by = created_by
            self.session_id = session_id

    class PairwiseComparison:
        __tablename__ = "pairwise_comparisons"

        def __init__(
            self,
            id: Optional[int] = None,
            run_id: int = 0,
            team_a_id: int = 0,
            team_b_id: int = 0,
            preferred_team_id: Optional[int] = None,
            reason: Optional[str] = None,
            created_at: Optional[datetime] = None,
            created_by: Optional[uuid.UUID] = None,
            session_id: Optional[str] = None,
        ):
            self.id = id
            self.run_id = run_id
            self.team_a_id = team_a_id
            self.team_b_id = team_b_id
            self.preferred_team_id = preferred_team_id
            self.reason = reason
            self.created_at = created_at or datetime.now(timezone.utc)
            self.created_by = created_by
            self.session_id = session_id

    class AuditLog:
        __tablename__ = "audit_log"
        def __init__(
            self,
            id: Optional[int] = None,
            table_name: str = "",
            record_id: Optional[int] = None,
            action: str = "insert",
            old_values: Optional[Dict[str, Any]] = None,
            new_values: Optional[Dict[str, Any]] = None,
            changed_at: Optional[datetime] = None,
            changed_by: Optional[uuid.UUID] = None,
            session_id: Optional[str] = None,
            actor_type: str = "anonymous",
        ):
            self.id = id
            self.table_name = table_name
            self.record_id = record_id
            self.action = action
            self.old_values = old_values
            self.new_values = new_values
            self.changed_at = changed_at or datetime.now(timezone.utc)
            self.changed_by = changed_by
            self.session_id = session_id
            self.actor_type = actor_type

    class LeaderboardView:
        __tablename__ = "v_leaderboard"

        def __init__(
            self,
            run_id: int = 0,
            rank: Optional[int] = None,
            team_code: str = "",
            team_name: str = "",
            team_size: int = 0,
            total_score: Optional[float] = None,
            outcome: str = "shortlisted",
            has_missing_data: bool = False,
            explanation: Optional[str] = None,
            run_at: Optional[datetime] = None,
            dataset_name: str = "",
        ):
            self.run_id = run_id
            self.rank = rank
            self.team_code = team_code
            self.team_name = team_name
            self.team_size = team_size
            self.total_score = total_score
            self.outcome = outcome
            self.has_missing_data = has_missing_data
            self.explanation = explanation
            self.run_at = run_at or datetime.now(timezone.utc)
            self.dataset_name = dataset_name


# Backward-compatible model aliases
ImportDataset = Dataset
TeamModel = Team
MemberModel = Member
ScoringConfigModel = Config
EvaluationRunModel = Run
EvaluationResultModel = RunResult
AuditLogModel = AuditLog
LeaderboardViewModel = LeaderboardView

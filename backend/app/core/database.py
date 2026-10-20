"""Database session and connection management supporting Supabase PostgreSQL and isolated test persistence.

Provides session lifecycle management, transaction rollback on failure, connection pooling, and explicit mode verification.
"""

from contextlib import contextmanager
import logging
import os
from typing import Generator

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Check if SQLAlchemy is installed
try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import declarative_base, sessionmaker, Session
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False
    Base = None
    Session = None
    SessionLocal = None
    engine = None


class DatabaseConnectionError(RuntimeError):
    """Raised when an explicit database connection to PostgreSQL fails."""
    pass


# Mode determination
is_postgres_configured = (
    settings.DATABASE_URL.startswith("postgresql://")
    or settings.DATABASE_URL.startswith("postgres://")
)

if HAS_SQLALCHEMY:
    Base = declarative_base()
    connect_args = {}

    if settings.DATABASE_URL.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args=connect_args,
            echo=settings.DEBUG,
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    elif is_postgres_configured:
        try:
            pg_url = settings.DATABASE_URL
            if pg_url.startswith("postgres://"):
                pg_url = "postgresql+psycopg2://" + pg_url[len("postgres://"):]
            elif pg_url.startswith("postgresql://") and not pg_url.startswith("postgresql+"):
                pg_url = "postgresql+psycopg2://" + pg_url[len("postgresql://"):]

            engine = create_engine(
                pg_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                echo=settings.DEBUG,
            )
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        except Exception as e:
            logger.error(f"Failed to initialize PostgreSQL SQLAlchemy engine: {e}")
            engine = None
            SessionLocal = None
    else:
        # Default local engine
        engine = None
        SessionLocal = None


def init_db():
    """Initializes schema tables if not already present."""
    if HAS_SQLALCHEMY and engine is not None:
        try:
            from backend.app.models.entities import Base as EntityBase
            EntityBase.metadata.create_all(bind=engine)
        except Exception as e:
            logger.warning(f"Could not auto-create tables: {e}")


class InMemoryTransactionSession:
    """Explicit in-memory transactional persistence session for unit tests and offline development."""

    def __init__(self):
        self._pending_add = []
        self._pending_delete = []
        self.is_active = True

    def add(self, obj):
        self._pending_add.append(obj)

    def commit(self):
        from backend.app.models.store import global_store
        for obj in self._pending_add:
            global_store.save(obj)
        for obj in self._pending_delete:
            global_store.delete(obj)
        self._pending_add.clear()
        self._pending_delete.clear()

    def rollback(self):
        self._pending_add.clear()
        self._pending_delete.clear()

    def delete(self, obj):
        self._pending_delete.append(obj)

    def query(self, entity_cls):
        from backend.app.models.store import global_store
        return global_store.query(entity_cls)

    def flush(self):
        from backend.app.models.store import global_store
        for obj in self._pending_add:
            if getattr(obj, "id", None) is None:
                global_store.save(obj)

    def close(self):
        self.is_active = False


def get_db() -> Generator:
    """FastAPI dependency yielding a managed database session with transaction rollback on error.

    Raises DatabaseConnectionError if PostgreSQL is explicitly configured but connection cannot be established.
    """
    if is_postgres_configured:
        if not HAS_SQLALCHEMY or SessionLocal is None:
            raise DatabaseConnectionError(
                "PostgreSQL is configured via DATABASE_URL, but SQLAlchemy or psycopg2-binary driver is not available."
            )
        db = SessionLocal()
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
    elif HAS_SQLALCHEMY and SessionLocal is not None:
        db = SessionLocal()
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
    else:
        # In-memory test session
        db = InMemoryTransactionSession()
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()


@contextmanager
def get_db_context():
    """Context manager for standalone background tasks, scripts, and tests."""
    gen = get_db()
    db = next(gen)
    try:
        yield db
    finally:
        try:
            next(gen)
        except StopIteration:
            pass

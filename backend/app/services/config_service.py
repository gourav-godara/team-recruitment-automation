"""Service and repository for persisting, validating, and retrieving ScoringConfig configurations.

Maps to Sushmita's 'configs' PostgreSQL table with integer primary keys and config_hash.
"""

from typing import Any, List, Optional, Union

from backend.app.models.entities import Config
from backend.app.schemas.scoring import ScoringConfig
from backend.app.services.decision_engine import compute_canonical_hash


class ConfigService:
    """Manages scoring configurations with strict hash-based versioning for reproducibility."""

    @staticmethod
    def compute_config_hash(config: ScoringConfig) -> str:
        """Returns the canonical deterministic SHA-256 hash of a scoring configuration."""
        return compute_canonical_hash(config.model_dump(mode="json"))

    @classmethod
    def save_config(
        cls,
        db: Any,
        config: ScoringConfig,
        name: str = "Default Scoring Config",
        is_preset: bool = False,
    ) -> Config:
        """Persists a scoring configuration to 'configs', guaranteeing configuration immutability."""
        config_hash = cls.compute_config_hash(config)

        # Check if identical configuration already exists to prevent duplicate rows
        existing = db.query(Config).filter_by(config_hash=config_hash).first()
        if existing:
            return existing

        config_row = Config(
            name=name,
            config_json=config.model_dump(mode="json"),
            config_hash=config_hash,
            is_preset=is_preset,
        )
        db.add(config_row)
        return config_row

    @classmethod
    def get_config_by_id(cls, db: Any, config_id: Union[int, str]) -> Optional[ScoringConfig]:
        """Retrieves and deserializes a ScoringConfig by ID."""
        try:
            int_id = int(config_id)
            model = db.query(Config).filter_by(id=int_id).first()
        except ValueError:
            model = db.query(Config).filter_by(id=config_id).first()

        if not model:
            return None
        return ScoringConfig(**model.config_json)

    @classmethod
    def get_config_model_by_id(cls, db: Any, config_id: Union[int, str]) -> Optional[Config]:
        """Retrieves the database record for a configuration by ID."""
        try:
            int_id = int(config_id)
            return db.query(Config).filter_by(id=int_id).first()
        except ValueError:
            return db.query(Config).filter_by(id=config_id).first()

    @classmethod
    def list_configs(cls, db: Any) -> List[Config]:
        """Lists all registered scoring configurations."""
        return db.query(Config).all()

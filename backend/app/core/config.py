import os
from pathlib import Path
from typing import Optional


def _load_env_file():
    """Lightweight built-in .env loader without external dependencies."""
    search_dirs = [
        Path.cwd(),
        Path.cwd() / "backend",
        Path(__file__).resolve().parent.parent.parent,
        Path(__file__).resolve().parent.parent.parent.parent,
    ]
    for d in search_dirs:
        env_file = d / ".env"
        if env_file.is_file():
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip("'\"")
                        if key:
                            os.environ[key] = val
                break
            except Exception:
                pass


_load_env_file()


class Settings:
    """System configuration parameters."""

    PROJECT_NAME: str = "Team Recruitment Automation Tool"
    VERSION: str = "2.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # Database configuration: defaults to SQLite for local development/testing;
    # Can be configured to PostgreSQL/Supabase via environment variable DATABASE_URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{Path(__file__).resolve().parent.parent.parent / 'recruitment.db'}",
    )

    # Core Decision Engine version tag for reproducibility tracking
    ENGINE_VERSION: str = "2.0.0"

    # Default import limits
    DEFAULT_MIN_TEAM_SIZE: int = int(os.getenv("MIN_TEAM_SIZE", "1"))
    DEFAULT_MAX_TEAM_SIZE: int = int(os.getenv("MAX_TEAM_SIZE", "5"))

    # Debug flag
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    # GitHub API enrichment configuration
    GITHUB_TOKEN: Optional[str] = os.getenv("GITHUB_TOKEN", None)
    GITHUB_API_TIMEOUT: float = float(os.getenv("GITHUB_API_TIMEOUT", "8.0"))


settings = Settings()

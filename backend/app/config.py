"""
Unified configuration settings for Exec-Connect backend application.
"""
from pathlib import Path
from typing import List, Literal
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env from backend root so it's loaded regardless of CWD
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_ROOT / ".env"

# Model IDs/prefixes that support response_format={"type": "json_object"}
_JSON_OBJECT_SUPPORTED_PREFIXES = (
    "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4-1106", "gpt-4-0125",
    "gpt-3.5-turbo-1106", "gpt-3.5-turbo-0125", "gpt-3.5-turbo-16k",
)


def model_supports_json_object(model: str) -> bool:
    """Return True if the OpenAI model supports response_format json_object."""
    if not model:
        return False
    model = model.strip().lower()
    return any(model == p or model.startswith(p + "-") for p in _JSON_OBJECT_SUPPORTED_PREFIXES)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database (driver: psycopg2; URL normalized to postgresql+psycopg2://)
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/exec_connect"

    # OpenAI
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-5.1"  # Default model

    # RAG Configuration
    RAG_ENABLED: bool = True
    RAG_TOP_K: int = 4

    # STT: "openai" (Whisper) or "wispr" (Wispr Flow). Default openai to avoid Wispr dependency.
    STT_PROVIDER: Literal["openai", "wispr"] = "openai"
    STT_OPENAI_MODEL: str = "whisper-1"  # e.g. whisper-1, gpt-4o-transcribe

    # Wispr Flow (only used when STT_PROVIDER=wispr)
    WISPR_API_KEY: str = ""
    WISPR_API_URL: str = "https://platform-api.wisprflow.ai/api/v1/dash/api"

    # Application
    API_V1_PREFIX: str = "/api"
    APP_NAME: str = "Exec-Connect Unified AI Agents System"
    DEBUG: bool = False

    # CORS (comma-separated; must include frontend origin in production)
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3003,http://127.0.0.1:3003,https://www.clear-commons.com,https://clear-commons.com"

    # Auth (JWT + Zepto Mail)
    JWT_SECRET_KEY: str = "change-me-in-production-use-long-random-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_EXPIRE_DAYS: int = 7
    OTP_EXPIRE_MINUTES: int = 15
    MAGIC_LINK_EXPIRE_MINUTES: int = 15
    ZEPTO_MAIL_API_KEY: str = ""
    ZEPTO_MAIL_FROM_EMAIL: str = "noreply@example.com"
    ZEPTO_MAIL_FROM_NAME: str = "CLEAR"
    ZEPTO_MAIL_MAGIC_LINK_TEMPLATE_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:3003"

    # Optional: secret for cron-triggered activation reminders
    ACTIVATION_CRON_SECRET: str = ""

    # Admin: API key for POST /api/admin/snapshots/run-monthly
    ADMIN_API_KEY: str = ""

    # SLO targets (seconds)
    SLO_DIAGNOSTIC_RUN_P95_SEC: float = 90.0
    SLO_CHAT_MESSAGE_P95_SEC: float = 15.0

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        """Normalize postgres URLs to postgresql+psycopg2:// and fix concatenated URLs."""
        from urllib.parse import urlparse, urlunparse
        if not isinstance(v, str):
            return v
        if v.startswith("postgresql+psycopg://"):
            v = v.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
        elif v.startswith("postgresql://") and "+psycopg2" not in v:
            v = v.replace("postgresql://", "postgresql+psycopg2://", 1)
        elif v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+psycopg2://", 1)
        try:
            parsed = urlparse(v)
            path = (parsed.path or "").strip("/")
            if "://" in path:
                first_segment = path.split("postgresql")[0].split("postgres")[0].strip("/") or "railway"
                if not first_segment:
                    first_segment = "railway"
                v = urlunparse(parsed._replace(path="/" + first_segment))
        except Exception:
            pass
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS from comma-separated string to list."""
        if isinstance(self.CORS_ORIGINS, str):
            origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
            if not origins:
                origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3003", "http://127.0.0.1:3003"]
            return origins
        return self.CORS_ORIGINS if isinstance(self.CORS_ORIGINS, list) else []

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE if _ENV_FILE.exists() else ".env",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

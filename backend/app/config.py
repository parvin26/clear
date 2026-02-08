"""
Unified configuration settings for Exec-Connect backend application.
"""
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/exec_connect"
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-5.1"  # Default model
    
    # RAG Configuration
    RAG_ENABLED: bool = True
    RAG_TOP_K: int = 4
    
    # Application
    API_V1_PREFIX: str = "/api"
    APP_NAME: str = "Exec-Connect Unified AI Agents System"
    DEBUG: bool = False
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3003,http://127.0.0.1:3003"
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        """Convert postgresql:// URLs to postgresql+psycopg:// for psycopg3 compatibility."""
        if isinstance(v, str):
            # Convert postgresql:// to postgresql+psycopg:// if not already converted
            if v.startswith("postgresql://") and "+psycopg" not in v:
                v = v.replace("postgresql://", "postgresql+psycopg://", 1)
            # Also handle postgres:// format
            elif v.startswith("postgres://") and "+psycopg" not in v:
                v = v.replace("postgres://", "postgresql+psycopg://", 1)
        return v
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS from comma-separated string to list."""
        if isinstance(self.CORS_ORIGINS, str):
            origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
            # Always include localhost for development
            if not origins:
                origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3003", "http://127.0.0.1:3003"]
            return origins
        return self.CORS_ORIGINS if isinstance(self.CORS_ORIGINS, list) else []
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()


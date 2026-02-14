"""Database connection and session management."""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from typing import Generator
from sqlalchemy.orm import Session

from app.config import settings


def _normalize_db_url(url: str) -> str:
    """Ensure URL uses postgresql+psycopg:// (psycopg v3). Railway may give postgresql+psycopg2://."""
    if not url or not isinstance(url, str):
        return url
    if url.startswith("postgresql+psycopg2://"):
        return url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and "+psycopg" not in url:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url.startswith("postgres://") and "+psycopg" not in url:
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    return url


# Create SQLAlchemy engine with pgvector support (URL normalized for psycopg v3)
engine = create_engine(
    _normalize_db_url(settings.DATABASE_URL),
    pool_pre_ping=True,
    echo=False
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for FastAPI to get database session."""
    db = SessionLocal()
    try:
        # Ensure pgvector extension is enabled
        db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        db.commit()
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database (create tables)."""
    Base.metadata.create_all(bind=engine)


def init_pgvector_extension():
    """Initialize pgvector extension."""
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()


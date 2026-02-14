"""Database connection and session management."""
from urllib.parse import urlparse, urlunparse

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from typing import Generator
from sqlalchemy.orm import Session

from app.config import settings


def _normalize_db_url(url: str) -> str:
    """Ensure URL uses postgresql+psycopg2:// and fix concatenated URLs (e.g. two URLs in one)."""
    if not url or not isinstance(url, str):
        return url
    # Scheme normalization
    if url.startswith("postgresql+psycopg://"):
        url = url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://") and "+psycopg2" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    # Fix concatenated DATABASE_URL (e.g. internal + public pasted together): path must be a single segment
    try:
        parsed = urlparse(url)
        path = (parsed.path or "").strip("/")
        if "://" in path:
            # Path looks like "railwaypostgresql+psycopg://..."; use only the real db name (before "postgresql")
            first_segment = path.split("postgresql")[0].split("postgres")[0].strip("/") or "railway"
            if not first_segment:
                first_segment = "railway"
            url = urlunparse(parsed._replace(path="/" + first_segment))
    except Exception:
        pass
    return url


# Create SQLAlchemy engine with pgvector support (URL normalized for psycopg2)
try:
    engine = create_engine(
        _normalize_db_url(settings.DATABASE_URL),
        pool_pre_ping=True,
        echo=False
    )
except ModuleNotFoundError as e:
    if "psycopg2" in str(e):
        raise RuntimeError(
            "Missing Postgres driver. Install psycopg2-binary (add psycopg2-binary>=2.9 to requirements.txt). "
            "On Railway: ensure the backend service builds from the repo that includes psycopg2-binary. "
            f"Original: {e}"
        ) from e
    raise

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for FastAPI to get database session.
    pgvector extension is initialized at startup only (init_pgvector_extension in main.py).
    """
    db = SessionLocal()
    try:
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


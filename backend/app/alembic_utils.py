"""
Idempotency helpers for Alembic migrations (PostgreSQL).
Use in upgrade() so re-running a migration does not fail if the table or index already exists.
"""
import sqlalchemy as sa


def table_exists(conn, table_name: str) -> bool:
    """Return True if a table exists in the current schema."""
    result = conn.execute(
        sa.text("""
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = :name
            LIMIT 1
        """),
        {"name": table_name},
    )
    return result.first() is not None


def index_exists(conn, index_name: str) -> bool:
    """Return True if an index exists in the current schema."""
    result = conn.execute(
        sa.text("""
            SELECT 1
            FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname = :name
            LIMIT 1
        """),
        {"name": index_name},
    )
    return result.first() is not None

"""Enable pgvector extension (run before any schema that uses vector columns).

Revision ID: z0enablepgvec
Revises:
Create Date: 2026-02-13

Run first on fresh DBs so initial_unified_schema can create vector columns.
Idempotent: CREATE EXTENSION IF NOT EXISTS vector.
"""
from typing import Sequence, Union

from alembic import op

revision: str = "z0enablepgvec"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")


def downgrade() -> None:
    pass  # Do not DROP EXTENSION; other migrations depend on it.

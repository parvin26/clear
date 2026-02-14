"""Enable pgvector extension for RAG.

Revision ID: x2b3c4d5e6f7
Revises: w1a2b3c4d5e6
Create Date: 2026-02-13

Ensures the vector extension exists so RAG tables and searches work.
Idempotent: safe to run on DBs that already have the extension.
"""
from typing import Sequence, Union

from alembic import op

revision: str = "x2b3c4d5e6f7"
down_revision: Union[str, Sequence[str], None] = "w1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")


def downgrade() -> None:
    # Do not DROP EXTENSION vector; other tables depend on it.
    pass

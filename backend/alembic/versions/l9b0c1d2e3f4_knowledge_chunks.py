"""Knowledge chunks table for curated RAG (frameworks, case studies, articles).

Revision ID: l9b0c1d2e3f4
Revises: k8a9b0c1d2e3
Create Date: 2025-02-07

- knowledge_chunks: id, created_at, source_type, title, content, tags (JSONB), embedding (vector 1536)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import table_exists

revision: str = "l9b0c1d2e3f4"
down_revision: Union[str, Sequence[str], None] = "k8a9b0c1d2e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "knowledge_chunks"):
        op.create_table(
            "knowledge_chunks",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("source_type", sa.String(50), nullable=False),
            sa.Column("title", sa.String(500), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("tags", postgresql.JSONB(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_knowledge_chunks_id"), "knowledge_chunks", ["id"], unique=False)
        op.execute("ALTER TABLE knowledge_chunks ADD COLUMN embedding vector(1536) NULL")


def downgrade() -> None:
    conn = op.get_bind()
    if table_exists(conn, "knowledge_chunks"):
        op.drop_index(op.f("ix_knowledge_chunks_id"), table_name="knowledge_chunks")
        op.drop_table("knowledge_chunks")

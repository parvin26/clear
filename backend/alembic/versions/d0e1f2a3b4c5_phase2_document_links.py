"""Phase 2: document_links table for RAG doc traceability.

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "d0e1f2a3b4c5"
down_revision: Union[str, Sequence[str], None] = "c9d0e1f2a3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "document_links"):
        op.create_table(
            "document_links",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("doc_table", sa.String(100), nullable=False),
            sa.Column("doc_id", sa.Integer(), nullable=False),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
    if not index_exists(conn, "ix_document_links_enterprise_decision"):
        op.create_index("ix_document_links_enterprise_decision", "document_links", ["enterprise_id", "decision_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_document_links_enterprise_decision", table_name="document_links")
    op.drop_table("document_links")

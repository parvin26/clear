"""Phase 2: decision_context table — context payload at decision initiation.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "decision_context"):
        op.create_table(
            "decision_context",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True),
            sa.Column("context_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
    if not index_exists(conn, "ix_decision_context_decision_id"):
        op.create_index("ix_decision_context_decision_id", "decision_context", ["decision_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_decision_context_decision_id", table_name="decision_context")
    op.drop_table("decision_context")

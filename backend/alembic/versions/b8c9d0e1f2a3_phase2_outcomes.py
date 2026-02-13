"""Phase 2: outcomes table.

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "b8c9d0e1f2a3"
down_revision: Union[str, Sequence[str], None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "outcomes"):
        op.create_table(
            "outcomes",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True),
            sa.Column("outcome_type", sa.String(100), nullable=False),
            sa.Column("measured_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("metrics_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
        )
    if not index_exists(conn, "ix_outcomes_decision_id"):
        op.create_index("ix_outcomes_decision_id", "outcomes", ["decision_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_outcomes_decision_id", table_name="outcomes")
    op.drop_table("outcomes")

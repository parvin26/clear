"""Phase 3: capability_scores and financing_readiness tables.

Revision ID: c6d7e8f9a0b1
Revises: b5c6d7e8f9a0
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "c6d7e8f9a0b1"
down_revision: Union[str, Sequence[str], None] = "b5c6d7e8f9a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "capability_scores"):
        op.create_table(
            "capability_scores",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
            sa.Column("capability_id", sa.Integer(), sa.ForeignKey("capabilities.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("score", sa.Numeric(10, 4), nullable=False),
            sa.Column("confidence", sa.Numeric(5, 4), nullable=True),
            sa.Column("evidence_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("computed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
    if not index_exists(conn, "ix_capability_scores_enterprise_computed"):
        op.create_index("ix_capability_scores_enterprise_computed", "capability_scores", ["enterprise_id", "computed_at"], unique=False)

    if not table_exists(conn, "financing_readiness"):
        op.create_table(
            "financing_readiness",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
            sa.Column("readiness_score", sa.Numeric(10, 4), nullable=False),
            sa.Column("flags_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("rationale_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("computed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
    if not index_exists(conn, "ix_financing_readiness_enterprise_computed"):
        op.create_index("ix_financing_readiness_enterprise_computed", "financing_readiness", ["enterprise_id", "computed_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_financing_readiness_enterprise_computed", table_name="financing_readiness")
    op.drop_table("financing_readiness")
    op.drop_index("ix_capability_scores_enterprise_computed", table_name="capability_scores")
    op.drop_table("capability_scores")

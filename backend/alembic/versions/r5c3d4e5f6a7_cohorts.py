"""Cohorts and cohort_enterprises for institutional rollout.

Revision ID: r5c3d4e5f6a7
Revises: q4b2c3d4e5f6
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import table_exists

revision: str = "r5c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "q4b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "cohorts"):
        op.create_table(
            "cohorts",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("partner_org_id", sa.Integer(), nullable=True, index=True),
            sa.Column("start_date", sa.Date(), nullable=True),
            sa.Column("activation_window_days", sa.Integer(), nullable=False, server_default="14"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
    if not table_exists(conn, "cohort_enterprises"):
        op.create_table(
            "cohort_enterprises",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("cohort_id", sa.Integer(), sa.ForeignKey("cohorts.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("activation_progress", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.UniqueConstraint("cohort_id", "enterprise_id", name="uq_cohort_enterprise"),
        )


def downgrade() -> None:
    op.drop_table("cohort_enterprises")
    op.drop_table("cohorts")

"""Execution Capital Readiness Index (ECRI) snapshots.

Revision ID: s6d7e8f9a0b1
Revises: r5c3d4e5f6a7
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.alembic_utils import table_exists

revision: str = "s6d7e8f9a0b1"
down_revision: Union[str, Sequence[str], None] = "r5c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "enterprise_readiness_snapshots"):
        op.create_table(
            "enterprise_readiness_snapshots",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("readiness_index", sa.Integer(), nullable=False),
            sa.Column("snapshot_date", sa.Date(), nullable=False, index=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("activation_component", sa.Numeric(5, 2), nullable=True),
            sa.Column("health_component", sa.Numeric(5, 2), nullable=True),
            sa.Column("velocity_component", sa.Numeric(5, 2), nullable=True),
            sa.Column("governance_component", sa.Numeric(5, 2), nullable=True),
            sa.Column("readiness_band", sa.String(50), nullable=True),
        )


def downgrade() -> None:
    op.drop_table("enterprise_readiness_snapshots")

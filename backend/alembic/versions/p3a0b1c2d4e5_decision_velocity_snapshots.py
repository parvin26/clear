"""Decision velocity snapshots table for trend and portfolio signals.

Revision ID: p3a0b1c2d4e5
Revises: n1e8f9a0b1c2
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "p3a0b1c2d4e5"
down_revision: Union[str, Sequence[str], None] = "n1e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "decision_velocity_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("avg_cycle_days", sa.Numeric(10, 2), nullable=True),
        sa.Column("snapshot_date", sa.Date(), nullable=False, index=True),
        sa.Column("avg_time_to_decision", sa.Numeric(10, 2), nullable=True),
        sa.Column("avg_time_to_execution", sa.Numeric(10, 2), nullable=True),
        sa.Column("avg_time_to_review", sa.Numeric(10, 2), nullable=True),
        sa.Column("velocity_band", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("decision_velocity_snapshots")

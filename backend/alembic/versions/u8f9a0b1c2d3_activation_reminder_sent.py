"""Activation reminder sent tracking for CLEAR activation email reminders.

Revision ID: u8f9a0b1c2d3
Revises: t7e8f9a0b1c2
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.alembic_utils import table_exists

revision: str = "u8f9a0b1c2d3"
down_revision: Union[str, Sequence[str], None] = "t7e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "activation_reminder_sent"):
        op.create_table(
            "activation_reminder_sent",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("nudge_day", sa.Integer(), nullable=False),
            sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index(
            "ix_activation_reminder_sent_enterprise_day",
            "activation_reminder_sent",
            ["enterprise_id", "nudge_day"],
            unique=True,
        )


def downgrade() -> None:
    op.drop_index("ix_activation_reminder_sent_enterprise_day", table_name="activation_reminder_sent")
    op.drop_table("activation_reminder_sent")

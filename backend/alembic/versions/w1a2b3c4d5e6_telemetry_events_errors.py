"""Launch instrumentation: telemetry_events, telemetry_errors.

Revision ID: w1a2b3c4d5e6
Revises: v9a0b1c2d3e4
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import table_exists

revision: str = "w1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "v9a0b1c2d3e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    if not table_exists(conn, "telemetry_events"):
        op.create_table(
            "telemetry_events",
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column("event_name", sa.String(120), nullable=False, index=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("properties", postgresql.JSONB(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )

    if not table_exists(conn, "telemetry_errors"):
        op.create_table(
            "telemetry_errors",
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column("source", sa.String(20), nullable=False, index=True),
            sa.Column("message", sa.Text(), nullable=True),
            sa.Column("stack", sa.Text(), nullable=True),
            sa.Column("path", sa.String(500), nullable=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )


def downgrade() -> None:
    op.drop_table("telemetry_errors")
    op.drop_table("telemetry_events")

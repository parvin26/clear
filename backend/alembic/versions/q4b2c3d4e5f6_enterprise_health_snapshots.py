"""Enterprise health score monthly snapshots.

Revision ID: q4b2c3d4e5f6
Revises: p3a0b1c2d4e5
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.alembic_utils import table_exists

revision: str = "q4b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "p3a0b1c2d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "enterprise_health_snapshots"):
        op.create_table(
            "enterprise_health_snapshots",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("score", sa.Integer(), nullable=True),
            sa.Column("execution_score", sa.Integer(), nullable=True),
            sa.Column("governance_score", sa.Integer(), nullable=True),
            sa.Column("learning_score", sa.Integer(), nullable=True),
            sa.Column("snapshot_date", sa.Date(), nullable=False, index=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )


def downgrade() -> None:
    op.drop_table("enterprise_health_snapshots")

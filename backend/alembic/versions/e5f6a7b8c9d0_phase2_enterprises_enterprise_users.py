"""Phase 2: Add settings_json to enterprises; create enterprise_users.

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("enterprises", sa.Column("settings_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    conn = op.get_bind()
    if not table_exists(conn, "enterprise_users"):
        op.create_table(
            "enterprise_users",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("role", sa.String(50), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
    if not index_exists(conn, "ix_enterprise_users_enterprise_id"):
        op.create_index("ix_enterprise_users_enterprise_id", "enterprise_users", ["enterprise_id"], unique=False)
    if not index_exists(conn, "ix_enterprise_users_user_id"):
        op.create_index("ix_enterprise_users_user_id", "enterprise_users", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_enterprise_users_user_id", table_name="enterprise_users")
    op.drop_index("ix_enterprise_users_enterprise_id", table_name="enterprise_users")
    op.drop_table("enterprise_users")
    op.drop_column("enterprises", "settings_json")

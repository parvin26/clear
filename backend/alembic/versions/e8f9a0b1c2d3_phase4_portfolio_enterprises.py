"""Phase 4: portfolio_enterprises junction table.

Revision ID: e8f9a0b1c2d3
Revises: d7e8f9a0b1c2
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.alembic_utils import index_exists, table_exists

revision: str = "e8f9a0b1c2d3"
down_revision: Union[str, Sequence[str], None] = "d7e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "portfolio_enterprises"):
        op.create_table(
            "portfolio_enterprises",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("portfolio_id", sa.Integer(), sa.ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
    if not index_exists(conn, "ix_portfolio_enterprises_portfolio_enterprise"):
        op.create_index("ix_portfolio_enterprises_portfolio_enterprise", "portfolio_enterprises", ["portfolio_id", "enterprise_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_portfolio_enterprises_portfolio_enterprise", table_name="portfolio_enterprises")
    op.drop_table("portfolio_enterprises")

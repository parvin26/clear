"""Idea-stage leads table (off-ramp when user selects idea/validation stage).

Revision ID: k8a9b0c1d2e3
Revises: j7f8a9b0c1d2
Create Date: 2025-02-07

- idea_stage_leads: id, created_at, email, short_text
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.alembic_utils import table_exists

revision: str = "k8a9b0c1d2e3"
down_revision: Union[str, Sequence[str], None] = "j7f8a9b0c1d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "idea_stage_leads"):
        op.create_table(
            "idea_stage_leads",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("email", sa.String(255), nullable=True),
            sa.Column("short_text", sa.Text(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_idea_stage_leads_id"), "idea_stage_leads", ["id"], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    if table_exists(conn, "idea_stage_leads"):
        op.drop_index(op.f("ix_idea_stage_leads_id"), table_name="idea_stage_leads")
        op.drop_table("idea_stage_leads")

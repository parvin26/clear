"""Advisor workspace: review requests and structured advisor reviews.

Revision ID: o2f9a0b1c2d3
Revises: n1e8f9a0b1c2
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "o2f9a0b1c2d3"
down_revision: Union[str, Sequence[str], None] = "n1e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "advisor_review_requests",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("decision_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("advisor_email", sa.String(255), nullable=False, index=True),
        sa.Column("advisor_name", sa.String(255), nullable=True),
        sa.Column("role_label", sa.String(100), nullable=True),
        sa.Column("requested_by", sa.String(255), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_table(
        "advisor_reviews",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("decision_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("advisor_email", sa.String(255), nullable=False, index=True),
        sa.Column("headline_assessment", sa.String(500), nullable=True),
        sa.Column("what_looks_strong", sa.Text(), nullable=True),
        sa.Column("what_worries_most", sa.Text(), nullable=True),
        sa.Column("next_4_6_weeks", sa.Text(), nullable=True),
        sa.Column("confidence", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("advisor_reviews")
    op.drop_table("advisor_review_requests")

"""Outcome reviews table for CLEAR EMR / outcome learning.

Revision ID: h5d6e7f8a9b0
Revises: g4c5d6e7f8a9
Create Date: 2025-02-07

- outcome_reviews: decision_id, summary, what_worked, what_did_not_work, key_learnings, assumptions_validated, assumptions_broken, readiness_impact
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "h5d6e7f8a9b0"
down_revision: Union[str, Sequence[str], None] = "g4c5d6e7f8a9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "outcome_reviews"):
        op.create_table(
            "outcome_reviews",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("summary", sa.Text(), nullable=True),
            sa.Column("what_worked", sa.Text(), nullable=True),
            sa.Column("what_did_not_work", sa.Text(), nullable=True),
            sa.Column("key_learnings", sa.Text(), nullable=True),
            sa.Column("assumptions_validated", sa.Text(), nullable=True),
            sa.Column("assumptions_broken", sa.Text(), nullable=True),
            sa.Column("readiness_impact", sa.String(20), nullable=True),
            sa.ForeignKeyConstraint(["decision_id"], ["decisions.decision_id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists(conn, "ix_outcome_reviews_decision_id"):
        op.create_index(op.f("ix_outcome_reviews_decision_id"), "outcome_reviews", ["decision_id"], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    if index_exists(conn, "ix_outcome_reviews_decision_id"):
        op.drop_index(op.f("ix_outcome_reviews_decision_id"), table_name="outcome_reviews")
    if table_exists(conn, "outcome_reviews"):
        op.drop_table("outcome_reviews")

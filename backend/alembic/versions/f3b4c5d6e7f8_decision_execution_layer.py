"""Decision execution layer: responsible_owner, expected_outcome, outcome_review, decision_execution_milestones.

Revision ID: f3b4c5d6e7f8
Revises: e8f9a0b1c2d3
Create Date: 2025-02-07

- decisions: add responsible_owner, expected_outcome, outcome_review_reminder, outcome_review_notes
- decision_execution_milestones: milestone_name, responsible_person, due_date, status (pending/completed), notes
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "f3b4c5d6e7f8"
down_revision: Union[str, Sequence[str], None] = "e8f9a0b1c2d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("decisions", sa.Column("responsible_owner", sa.String(255), nullable=True))
    op.add_column("decisions", sa.Column("expected_outcome", sa.Text(), nullable=True))
    op.add_column("decisions", sa.Column("outcome_review_reminder", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("decisions", sa.Column("outcome_review_notes", sa.Text(), nullable=True))

    conn = op.get_bind()
    if not table_exists(conn, "decision_execution_milestones"):
        op.create_table(
            "decision_execution_milestones",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("milestone_name", sa.String(500), nullable=False),
            sa.Column("responsible_person", sa.String(255), nullable=True),
            sa.Column("due_date", sa.Date(), nullable=True),
            sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["decision_id"], ["decisions.decision_id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists(conn, "ix_decision_execution_milestones_decision_id"):
        op.create_index(op.f("ix_decision_execution_milestones_decision_id"), "decision_execution_milestones", ["decision_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_decision_execution_milestones_decision_id"), table_name="decision_execution_milestones")
    op.drop_table("decision_execution_milestones")
    op.drop_column("decisions", "outcome_review_notes")
    op.drop_column("decisions", "outcome_review_reminder")
    op.drop_column("decisions", "expected_outcome")
    op.drop_column("decisions", "responsible_owner")

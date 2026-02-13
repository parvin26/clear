"""Phase 2: implementation_tasks and milestones tables.

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "implementation_tasks"):
        op.create_table(
            "implementation_tasks",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True),
            sa.Column("action_plan_ref", sa.String(255), nullable=True),
            sa.Column("title", sa.String(500), nullable=False),
            sa.Column("owner", sa.String(255), nullable=True),
            sa.Column("due_date", sa.Date(), nullable=True),
            sa.Column("status", sa.String(50), nullable=False, server_default="planned"),
            sa.Column("meta_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
    if not index_exists(conn, "ix_implementation_tasks_decision_id"):
        op.create_index("ix_implementation_tasks_decision_id", "implementation_tasks", ["decision_id"], unique=False)
    if not table_exists(conn, "milestones"):
        op.create_table(
            "milestones",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("task_id", sa.Integer(), sa.ForeignKey("implementation_tasks.id", ondelete="CASCADE"), nullable=False),
            sa.Column("milestone_type", sa.String(50), nullable=False),
            sa.Column("logged_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("evidence_text", sa.Text(), nullable=True),
            sa.Column("evidence_url", sa.String(1000), nullable=True),
            sa.Column("metrics_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        )
    if not index_exists(conn, "ix_milestones_task_id"):
        op.create_index("ix_milestones_task_id", "milestones", ["task_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_milestones_task_id", table_name="milestones")
    op.drop_table("milestones")
    op.drop_index("ix_implementation_tasks_decision_id", table_name="implementation_tasks")
    op.drop_table("implementation_tasks")

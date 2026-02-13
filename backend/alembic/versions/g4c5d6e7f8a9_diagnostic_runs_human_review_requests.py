"""Diagnostic runs and human review requests for CLEAR multi-agent flow.

Revision ID: g4c5d6e7f8a9
Revises: f3b4c5d6e7f8
Create Date: 2025-02-07

- diagnostic_runs: onboarding_context, diagnostic_data, agent_outputs, synthesis, decision_id
- human_review_requests: decision_id, contact fields, status
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "g4c5d6e7f8a9"
down_revision: Union[str, Sequence[str], None] = "f3b4c5d6e7f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "diagnostic_runs"):
        op.create_table(
            "diagnostic_runs",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("onboarding_context", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("diagnostic_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("agent_outputs", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("synthesis", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists(conn, "ix_diagnostic_runs_decision_id"):
        op.create_index(op.f("ix_diagnostic_runs_decision_id"), "diagnostic_runs", ["decision_id"], unique=False)

    if not table_exists(conn, "human_review_requests"):
        op.create_table(
            "human_review_requests",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("name", sa.String(255), nullable=True),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("whatsapp", sa.String(100), nullable=True),
            sa.Column("country", sa.String(100), nullable=True),
            sa.Column("company", sa.String(255), nullable=True),
            sa.Column("role", sa.String(255), nullable=True),
            sa.Column("consent", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
            sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists(conn, "ix_human_review_requests_decision_id"):
        op.create_index(op.f("ix_human_review_requests_decision_id"), "human_review_requests", ["decision_id"], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    if index_exists(conn, "ix_human_review_requests_decision_id"):
        op.drop_index(op.f("ix_human_review_requests_decision_id"), table_name="human_review_requests")
    if table_exists(conn, "human_review_requests"):
        op.drop_table("human_review_requests")
    if index_exists(conn, "ix_diagnostic_runs_decision_id"):
        op.drop_index(op.f("ix_diagnostic_runs_decision_id"), table_name="diagnostic_runs")
    if table_exists(conn, "diagnostic_runs"):
        op.drop_table("diagnostic_runs")

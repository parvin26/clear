"""RTCO Phase 1: decision_records table — append-only decision memory from analyses.

- decision_records: one row per decision version; links to analysis (analysis_table, analysis_id)
- id (pk), decision_id (uuid), version, agent_domain, analysis_table, analysis_id, artifact_json, created_at, supersedes_id (self-fk)

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "decision_records"):
        op.create_table(
            "decision_records",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("version", sa.Integer(), nullable=False),
            sa.Column("agent_domain", sa.String(20), nullable=False),
            sa.Column("analysis_table", sa.String(100), nullable=False),
            sa.Column("analysis_id", sa.Integer(), nullable=False),
            sa.Column("artifact_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("supersedes_id", sa.Integer(), sa.ForeignKey("decision_records.id", ondelete="SET NULL"), nullable=True),
        )
    if not index_exists(conn, "ix_decision_records_analysis"):
        op.create_index("ix_decision_records_analysis", "decision_records", ["analysis_table", "analysis_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_decision_records_analysis", table_name="decision_records")
    op.drop_table("decision_records")

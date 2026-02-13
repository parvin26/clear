"""CLEAR v0: usage_events, impact_feedback, decision_comments, enterprise_members.

Revision ID: m0c1d2e3f4a5
Revises: l9b0c1d2e3f4
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import table_exists, index_exists

revision: str = "m0c1d2e3f4a5"
down_revision: Union[str, Sequence[str], None] = "l9b0c1d2e3f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    if not table_exists(conn, "usage_events"):
        op.create_table(
            "usage_events",
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
            sa.Column("event_type", sa.String(80), nullable=False, index=True),
            sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("metadata", postgresql.JSONB(), nullable=True),
        )

    if not table_exists(conn, "impact_feedback"):
        op.create_table(
            "impact_feedback",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
            sa.Column("cycle_number", sa.Integer(), nullable=True),
            sa.Column("question", sa.String(120), nullable=False),
            sa.Column("score", sa.SmallInteger(), nullable=True),
            sa.Column("comment", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )

    if not table_exists(conn, "decision_comments"):
        op.create_table(
            "decision_comments",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("author_email", sa.String(255), nullable=False),
            sa.Column("author_role", sa.String(50), nullable=True),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )

    if not table_exists(conn, "enterprise_members"):
        op.create_table(
            "enterprise_members",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("enterprise_id", sa.Integer(), sa.ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("email", sa.String(255), nullable=False, index=True),
            sa.Column("role", sa.String(50), nullable=False),
            sa.Column("invite_token", sa.String(255), nullable=True, index=True),
            sa.Column("invite_token_expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        if not index_exists(conn, "ix_enterprise_members_enterprise_email"):
            op.create_index("ix_enterprise_members_enterprise_email", "enterprise_members", ["enterprise_id", "email"], unique=True)


def downgrade() -> None:
    if index_exists(op.get_bind(), "ix_enterprise_members_enterprise_email"):
        op.drop_index("ix_enterprise_members_enterprise_email", table_name="enterprise_members")
    op.drop_table("enterprise_members")
    op.drop_table("decision_comments")
    op.drop_table("impact_feedback")
    op.drop_table("usage_events")

"""CLEAR Phase 1 governance tables: enterprises, decisions, decision_ledger_events, decision_evidence_links, decision_chat_sessions

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2025-02-07

- enterprises: minimal profile (sector, geography, operating_model, size_band)
- decisions: decision_id (UUID), enterprise_id (nullable), current_status, current_artifact_version
- decision_ledger_events: append-only source of truth (event_id, artifact_snapshot, artifact_hash, supersedes, reason_code, actor_id, actor_role, changed_fields_summary)
- decision_evidence_links: provenance (evidence_type, source_table, source_id, retrieval_metadata, integrity_hash)
- decision_chat_sessions: link chat sessions to decisions (decision_id, session_id, agent_domain)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    # enterprises (Phase 1 anchoring)
    if not table_exists(conn, "enterprises"):
        op.create_table(
        "enterprises",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("sector", sa.String(100), nullable=True),
        sa.Column("geography", sa.String(100), nullable=True),
        sa.Column("operating_model", sa.String(100), nullable=True),
        sa.Column("size_band", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists(conn, "ix_enterprises_id"):
        op.create_index(op.f("ix_enterprises_id"), "enterprises", ["id"], unique=False)

    # decisions (current head per decision_id; artifact lives only in ledger)
    if not table_exists(conn, "decisions"):
        op.create_table(
        "decisions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("enterprise_id", sa.Integer(), nullable=True),
        sa.Column("current_status", sa.String(50), nullable=False, server_default="draft"),
        sa.Column("current_artifact_version", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["enterprise_id"], ["enterprises.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("decision_id", name="uq_decisions_decision_id"),
        )
    if not index_exists(conn, "ix_decisions_decision_id"):
        op.create_index(op.f("ix_decisions_decision_id"), "decisions", ["decision_id"], unique=True)
    if not index_exists(conn, "ix_decisions_enterprise_id"):
        op.create_index(op.f("ix_decisions_enterprise_id"), "decisions", ["enterprise_id"], unique=False)
    if not index_exists(conn, "ix_decisions_current_status"):
        op.create_index(op.f("ix_decisions_current_status"), "decisions", ["current_status"], unique=False)

    # decision_ledger_events (append-only source of truth)
    if not table_exists(conn, "decision_ledger_events"):
        op.create_table(
        "decision_ledger_events",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("artifact_version", sa.Integer(), nullable=True),
        sa.Column("artifact_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("artifact_hash", sa.String(64), nullable=True),
        sa.Column("supersedes_event_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("reason_code", sa.String(100), nullable=True),
        sa.Column("actor_id", sa.String(255), nullable=True),
        sa.Column("actor_role", sa.String(100), nullable=True),
        sa.Column("changed_fields_summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.decision_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["supersedes_event_id"], ["decision_ledger_events.event_id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", name="uq_decision_ledger_events_event_id"),
        )
    if not index_exists(conn, "ix_decision_ledger_events_decision_id"):
        op.create_index(op.f("ix_decision_ledger_events_decision_id"), "decision_ledger_events", ["decision_id"], unique=False)
    if not index_exists(conn, "ix_decision_ledger_events_event_id"):
        op.create_index(op.f("ix_decision_ledger_events_event_id"), "decision_ledger_events", ["event_id"], unique=True)
    if not index_exists(conn, "ix_decision_ledger_events_created_at"):
        op.create_index(op.f("ix_decision_ledger_events_created_at"), "decision_ledger_events", ["created_at"], unique=False)

    # decision_evidence_links (first-class evidence with provenance)
    if not table_exists(conn, "decision_evidence_links"):
        op.create_table(
        "decision_evidence_links",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("evidence_type", sa.String(50), nullable=False),
        sa.Column("source_table", sa.String(100), nullable=False),
        sa.Column("source_id", sa.String(255), nullable=False),
        sa.Column("retrieval_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("integrity_hash", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.decision_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists(conn, "ix_decision_evidence_links_decision_id"):
        op.create_index(op.f("ix_decision_evidence_links_decision_id"), "decision_evidence_links", ["decision_id"], unique=False)

    # decision_chat_sessions (chat attached to decisions; no change to existing chat tables)
    if not table_exists(conn, "decision_chat_sessions"):
        op.create_table(
        "decision_chat_sessions",
        sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", sa.String(255), nullable=False),
        sa.Column("agent_domain", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.decision_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("decision_id", "session_id", "agent_domain", name="pk_decision_chat_sessions"),
        )
    if not index_exists(conn, "ix_decision_chat_sessions_decision_id"):
        op.create_index(op.f("ix_decision_chat_sessions_decision_id"), "decision_chat_sessions", ["decision_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_decision_chat_sessions_decision_id"), table_name="decision_chat_sessions")
    op.drop_table("decision_chat_sessions")
    op.drop_index(op.f("ix_decision_evidence_links_decision_id"), table_name="decision_evidence_links")
    op.drop_table("decision_evidence_links")
    op.drop_index(op.f("ix_decision_ledger_events_created_at"), table_name="decision_ledger_events")
    op.drop_index(op.f("ix_decision_ledger_events_event_id"), table_name="decision_ledger_events")
    op.drop_index(op.f("ix_decision_ledger_events_decision_id"), table_name="decision_ledger_events")
    op.drop_table("decision_ledger_events")
    op.drop_index(op.f("ix_decisions_current_status"), table_name="decisions")
    op.drop_index(op.f("ix_decisions_enterprise_id"), table_name="decisions")
    op.drop_index(op.f("ix_decisions_decision_id"), table_name="decisions")
    op.drop_table("decisions")
    op.drop_index(op.f("ix_enterprises_id"), table_name="enterprises")
    op.drop_table("enterprises")

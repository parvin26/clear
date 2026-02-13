"""Phase 1B: Immutability triggers on decision_records; rtco_decision_ledger_events; rtco_decision_evidence_links.

- decision_records: forbid UPDATE/DELETE (append-only).
- rtco_decision_ledger_events: id, decision_id uuid, event_type, event_payload jsonb, created_at; forbid UPDATE/DELETE.
- rtco_decision_evidence_links: id, decision_id uuid, source_type, source_ref, meta_json, created_at; forbid UPDATE/DELETE.

Revision ID: e1f2a3b4c5d6
Revises: d0e1f2a3b4c5
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "d0e1f2a3b4c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    # Reuse CLEAR-style trigger function or create RTCO-specific one
    op.execute("""
        CREATE OR REPLACE FUNCTION rtco_forbid_update_delete()
        RETURNS TRIGGER AS $$
        BEGIN
            RAISE EXCEPTION 'RTCO Phase 1B: UPDATE/DELETE not allowed on %. Append-only.', TG_TABLE_NAME;
        END;
        $$ LANGUAGE plpgsql;
    """)
    # Triggers on decision_records
    op.execute("""
        CREATE TRIGGER forbid_update_delete_decision_records
        BEFORE UPDATE OR DELETE ON decision_records
        FOR EACH ROW EXECUTE PROCEDURE rtco_forbid_update_delete();
    """)
    # rtco_decision_ledger_events
    if not table_exists(conn, "rtco_decision_ledger_events"):
        op.create_table(
            "rtco_decision_ledger_events",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("event_type", sa.String(50), nullable=False),
            sa.Column("event_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
    if not index_exists(conn, "ix_rtco_decision_ledger_events_decision_id"):
        op.create_index("ix_rtco_decision_ledger_events_decision_id", "rtco_decision_ledger_events", ["decision_id"], unique=False)
    op.execute("""
        CREATE TRIGGER forbid_update_delete_rtco_decision_ledger_events
        BEFORE UPDATE OR DELETE ON rtco_decision_ledger_events
        FOR EACH ROW EXECUTE PROCEDURE rtco_forbid_update_delete();
    """)
    # rtco_decision_evidence_links
    if not table_exists(conn, "rtco_decision_evidence_links"):
        op.create_table(
            "rtco_decision_evidence_links",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("source_type", sa.String(50), nullable=False),
            sa.Column("source_ref", sa.String(500), nullable=False),
            sa.Column("meta_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
    if not index_exists(conn, "ix_rtco_decision_evidence_links_decision_id"):
        op.create_index("ix_rtco_decision_evidence_links_decision_id", "rtco_decision_evidence_links", ["decision_id"], unique=False)
    op.execute("""
        CREATE TRIGGER forbid_update_delete_rtco_decision_evidence_links
        BEFORE UPDATE OR DELETE ON rtco_decision_evidence_links
        FOR EACH ROW EXECUTE PROCEDURE rtco_forbid_update_delete();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS forbid_update_delete_rtco_decision_evidence_links ON rtco_decision_evidence_links;")
    op.drop_index("ix_rtco_decision_evidence_links_decision_id", table_name="rtco_decision_evidence_links")
    op.drop_table("rtco_decision_evidence_links")
    op.execute("DROP TRIGGER IF EXISTS forbid_update_delete_rtco_decision_ledger_events ON rtco_decision_ledger_events;")
    op.drop_index("ix_rtco_decision_ledger_events_decision_id", table_name="rtco_decision_ledger_events")
    op.drop_table("rtco_decision_ledger_events")
    op.execute("DROP TRIGGER IF EXISTS forbid_update_delete_decision_records ON decision_records;")
    op.execute("DROP FUNCTION IF EXISTS rtco_forbid_update_delete();")

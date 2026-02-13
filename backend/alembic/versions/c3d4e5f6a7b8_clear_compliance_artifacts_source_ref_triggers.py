"""CLEAR compliance: decision_artifacts table, source_ref on evidence, version_id on ledger, immutability triggers.

- decision_artifacts: governed artifact versions (insert-only); version_id, supersedes_version_id, canonical_hash, canonical_json
- decision_ledger_events: add version_id (uuid) to reference artifact; artifact_snapshot/artifact_hash deprecated for new flow
- decision_evidence_links: add source_ref jsonb NOT NULL (unified provenance)
- Triggers: forbid UPDATE/DELETE on decision_ledger_events and decision_artifacts

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    # ----- decision_artifacts (governed artifact versions; insert-only) -----
    if not table_exists(conn, "decision_artifacts"):
        op.create_table(
            "decision_artifacts",
            sa.Column("artifact_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("enterprise_id", sa.Integer(), nullable=True),
            sa.Column("version_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("supersedes_version_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("canonical_hash", sa.Text(), nullable=False),
            sa.Column("canonical_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("created_by_actor_id", sa.String(255), nullable=True),
            sa.Column("created_by_actor_role", sa.String(100), nullable=True),
            sa.ForeignKeyConstraint(["decision_id"], ["decisions.decision_id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["enterprise_id"], ["enterprises.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["supersedes_version_id"], ["decision_artifacts.version_id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("artifact_id"),
            sa.UniqueConstraint("decision_id", "version_id", name="uq_decision_artifacts_decision_version"),
            sa.UniqueConstraint("version_id", name="uq_decision_artifacts_version_id"),
        )
    if not index_exists(conn, "ix_decision_artifacts_decision_id"):
        op.create_index("ix_decision_artifacts_decision_id", "decision_artifacts", ["decision_id"], unique=False)
    if not index_exists(conn, "ix_decision_artifacts_version_id"):
        op.create_index("ix_decision_artifacts_version_id", "decision_artifacts", ["version_id"], unique=True)

    # ----- decision_ledger_events: add version_id (reference to artifact) -----
    op.add_column(
        "decision_ledger_events",
        sa.Column("version_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_decision_ledger_events_version_id",
        "decision_ledger_events",
        "decision_artifacts",
        ["version_id"],
        ["version_id"],
        ondelete="SET NULL",
    )
    if not index_exists(conn, "ix_decision_ledger_events_version_id"):
        op.create_index("ix_decision_ledger_events_version_id", "decision_ledger_events", ["version_id"], unique=False)

    # ----- decision_evidence_links: source_ref (unified provenance) -----
    op.add_column(
        "decision_evidence_links",
        sa.Column(
            "source_ref",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )
    # Backfill: set source_ref from source_table/source_id where present
    op.execute("""
        UPDATE decision_evidence_links
        SET source_ref = jsonb_build_object(
            'system', 'db',
            'table', source_table,
            'id', source_id,
            'uri', NULL
        )
        WHERE source_ref IS NULL
    """)
    op.alter_column("decision_evidence_links", "source_ref", nullable=False)
    op.alter_column("decision_evidence_links", "source_table", nullable=True)
    op.alter_column("decision_evidence_links", "source_id", nullable=True)

    # ----- Immutability triggers -----
    op.execute("""
        CREATE OR REPLACE FUNCTION clear_forbid_update_delete()
        RETURNS TRIGGER AS $$
        BEGIN
            RAISE EXCEPTION 'CLEAR: UPDATE/DELETE not allowed on %. Use append-only semantics.', TG_TABLE_NAME;
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("""
        CREATE TRIGGER forbid_update_delete_decision_ledger_events
        BEFORE UPDATE OR DELETE ON decision_ledger_events
        FOR EACH ROW EXECUTE PROCEDURE clear_forbid_update_delete();
    """)
    op.execute("""
        CREATE TRIGGER forbid_update_delete_decision_artifacts
        BEFORE UPDATE OR DELETE ON decision_artifacts
        FOR EACH ROW EXECUTE PROCEDURE clear_forbid_update_delete();
    """)
    # If you're on PG < 11, replace EXECUTE FUNCTION with EXECUTE PROCEDURE above


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS forbid_update_delete_decision_artifacts ON decision_artifacts;")
    op.execute("DROP TRIGGER IF EXISTS forbid_update_delete_decision_ledger_events ON decision_ledger_events;")
    op.execute("DROP FUNCTION IF EXISTS clear_forbid_update_delete();")

    op.alter_column("decision_evidence_links", "source_table", nullable=False)
    op.alter_column("decision_evidence_links", "source_id", nullable=False)
    op.alter_column("decision_evidence_links", "source_ref", nullable=True)
    op.drop_column("decision_evidence_links", "source_ref")

    op.drop_index("ix_decision_ledger_events_version_id", table_name="decision_ledger_events")
    op.drop_constraint("fk_decision_ledger_events_version_id", "decision_ledger_events", type_="foreignkey")
    op.drop_column("decision_ledger_events", "version_id")

    op.drop_index("ix_decision_artifacts_version_id", table_name="decision_artifacts")
    op.drop_index("ix_decision_artifacts_decision_id", table_name="decision_artifacts")
    op.drop_table("decision_artifacts")

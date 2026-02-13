"""Phase 2: decision_context append-only — drop unique on decision_id, add immutability trigger.

Revision ID: a3b4c5d6e7f8
Revises: f2a3b4c5d6e7
"""
from typing import Sequence, Union

from alembic import op

from app.alembic_utils import index_exists

revision: str = "a3b4c5d6e7f8"
down_revision: Union[str, Sequence[str], None] = "f2a3b4c5d6e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_decision_context_decision_id;")
    conn = op.get_bind()
    if not index_exists(conn, "ix_decision_context_decision_id"):
        op.create_index("ix_decision_context_decision_id", "decision_context", ["decision_id"], unique=False)
    op.execute("""
        CREATE OR REPLACE FUNCTION clear_forbid_update_delete_context()
        RETURNS TRIGGER AS $$
        BEGIN
            RAISE EXCEPTION 'CLEAR Phase 2: UPDATE/DELETE not allowed on decision_context. Append-only.';
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("""
        CREATE TRIGGER forbid_update_delete_decision_context
        BEFORE UPDATE OR DELETE ON decision_context
        FOR EACH ROW EXECUTE PROCEDURE clear_forbid_update_delete_context();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS forbid_update_delete_decision_context ON decision_context;")
    op.execute("DROP FUNCTION IF EXISTS clear_forbid_update_delete_context();")
    op.drop_index("ix_decision_context_decision_id", table_name="decision_context")
    op.create_index("ix_decision_context_decision_id", "decision_context", ["decision_id"], unique=True)

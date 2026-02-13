"""Phase 2: Add enterprise_id, decision_id (nullable) to *_analyses.

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists

revision: str = "c9d0e1f2a3b4"
down_revision: Union[str, Sequence[str], None] = "b8c9d0e1f2a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    for table in ("cfo_analyses", "cmo_analyses", "coo_analyses", "cto_analyses"):
        op.add_column(table, sa.Column("enterprise_id", sa.Integer(), nullable=True))
        op.add_column(table, sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=True))
        op.create_foreign_key(f"fk_{table}_enterprise_id", table, "enterprises", ["enterprise_id"], ["id"], ondelete="SET NULL")
        if not index_exists(conn, f"ix_{table}_enterprise_id"):
            op.create_index(f"ix_{table}_enterprise_id", table, ["enterprise_id"], unique=False)
        if not index_exists(conn, f"ix_{table}_decision_id"):
            op.create_index(f"ix_{table}_decision_id", table, ["decision_id"], unique=False)


def downgrade() -> None:
    for table in ("cfo_analyses", "cmo_analyses", "coo_analyses", "cto_analyses"):
        op.drop_index(f"ix_{table}_decision_id", table_name=table)
        op.drop_index(f"ix_{table}_enterprise_id", table_name=table)
        op.drop_constraint(f"fk_{table}_enterprise_id", table, type_="foreignkey")
        op.drop_column(table, "decision_id")
        op.drop_column(table, "enterprise_id")

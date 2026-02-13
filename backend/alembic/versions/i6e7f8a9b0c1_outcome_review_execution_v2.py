"""Outcome review execution v2: main_constraint, keep_raise_reduce_stop.

Revision ID: i6e7f8a9b0c1
Revises: h5d6e7f8a9b0
Create Date: 2025-02-07

Execution layer v2: guided outcome review (main_constraint, keep_raise_reduce_stop).
Idempotent: only add columns if they do not exist.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "i6e7f8a9b0c1"
down_revision: Union[str, Sequence[str], None] = "h5d6e7f8a9b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(conn, table: str, column: str) -> bool:
    r = conn.execute(
        sa.text("""
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema() AND table_name = :t AND column_name = :c
            LIMIT 1
        """),
        {"t": table, "c": column},
    )
    return r.first() is not None


def upgrade() -> None:
    conn = op.get_bind()
    if not _column_exists(conn, "outcome_reviews", "main_constraint"):
        op.add_column("outcome_reviews", sa.Column("main_constraint", sa.Text(), nullable=True))
    if not _column_exists(conn, "outcome_reviews", "keep_raise_reduce_stop"):
        op.add_column("outcome_reviews", sa.Column("keep_raise_reduce_stop", sa.String(20), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    if _column_exists(conn, "outcome_reviews", "keep_raise_reduce_stop"):
        op.drop_column("outcome_reviews", "keep_raise_reduce_stop")
    if _column_exists(conn, "outcome_reviews", "main_constraint"):
        op.drop_column("outcome_reviews", "main_constraint")

"""Auth: users password_hash + email_verified_at, pending_verifications table.

Revision ID: j7f8a9b0c1d2
Revises: i6e7f8a9b0c1
Create Date: 2025-02-07

Idempotent: add columns only if missing; create table only if not exists.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "j7f8a9b0c1d2"
down_revision: Union[str, Sequence[str], None] = "i6e7f8a9b0c1"
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


def _table_exists(conn, table: str) -> bool:
    r = conn.execute(
        sa.text("""
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = :t
            LIMIT 1
        """),
        {"t": table},
    )
    return r.first() is not None


def upgrade() -> None:
    conn = op.get_bind()
    if not _column_exists(conn, "users", "password_hash"):
        op.add_column("users", sa.Column("password_hash", sa.String(255), nullable=True))
    if not _column_exists(conn, "users", "email_verified_at"):
        op.add_column("users", sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True))
    if not _table_exists(conn, "pending_verifications"):
        op.create_table(
            "pending_verifications",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("token_hash", sa.String(255), nullable=False),
            sa.Column("purpose", sa.String(50), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_pending_verifications_email", "pending_verifications", ["email"], unique=False)
        op.create_index("ix_pending_verifications_purpose", "pending_verifications", ["purpose"], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    if _table_exists(conn, "pending_verifications"):
        op.drop_index("ix_pending_verifications_purpose", "pending_verifications")
        op.drop_index("ix_pending_verifications_email", "pending_verifications")
        op.drop_table("pending_verifications")
    if _column_exists(conn, "users", "email_verified_at"):
        op.drop_column("users", "email_verified_at")
    if _column_exists(conn, "users", "password_hash"):
        op.drop_column("users", "password_hash")

"""Phase 3: capabilities table — capability definitions (code, domain, name, description).

Revision ID: b5c6d7e8f9a0
Revises: a3b4c5d6e7f8
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.alembic_utils import table_exists

revision: str = "b5c6d7e8f9a0"
down_revision: Union[str, Sequence[str], None] = "a3b4c5d6e7f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if not table_exists(conn, "capabilities"):
        op.create_table(
            "capabilities",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("code", sa.String(80), unique=True, nullable=False, index=True),
            sa.Column("domain", sa.String(50), nullable=False, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
        )


def downgrade() -> None:
    op.drop_table("capabilities")

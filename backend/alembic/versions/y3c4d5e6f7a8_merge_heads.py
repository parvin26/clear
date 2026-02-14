"""Merge multiple heads: o2f9a0b1c2d3 (advisor reviews) and x2b3c4d5e6f7 (pgvector extension).

Revision ID: y3c4d5e6f7a8
Revises: o2f9a0b1c2d3, x2b3c4d5e6f7
Create Date: 2026-02-14

"""
from typing import Sequence, Union

from alembic import op

revision: str = "y3c4d5e6f7a8"
down_revision: Union[str, Sequence[str], None] = ("o2f9a0b1c2d3", "x2b3c4d5e6f7")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

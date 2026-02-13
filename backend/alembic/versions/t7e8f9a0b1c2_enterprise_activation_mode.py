"""Enterprise activation_mode for CLEAR Activation Engine (Layer 5 cohort rollout).

Revision ID: t7e8f9a0b1c2
Revises: s6d7e8f9a0b1
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "t7e8f9a0b1c2"
down_revision: Union[str, Sequence[str], None] = "s6d7e8f9a0b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "enterprises",
        sa.Column("activation_mode", sa.String(50), nullable=True, server_default="enterprise"),
    )


def downgrade() -> None:
    op.drop_column("enterprises", "activation_mode")

"""Phase 1B: Add canonicalization_version, artifact_hash, artifact_canonical_json to decision_records.

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "f2a3b4c5d6e7"
down_revision: Union[str, Sequence[str], None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("decision_records", sa.Column("canonicalization_version", sa.String(20), nullable=True))
    op.add_column("decision_records", sa.Column("artifact_hash", sa.String(64), nullable=True))
    op.add_column("decision_records", sa.Column("artifact_canonical_json", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("decision_records", "artifact_canonical_json")
    op.drop_column("decision_records", "artifact_hash")
    op.drop_column("decision_records", "canonicalization_version")

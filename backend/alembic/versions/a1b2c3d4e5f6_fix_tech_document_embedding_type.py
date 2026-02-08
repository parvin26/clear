"""Fix TechDocument embedding type

Revision ID: a1b2c3d4e5f6
Revises: 15381213704c
Create Date: 2025-02-06

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '15381213704c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Change tech_documents.embedding from TEXT to vector(1536) for pgvector RAG."""
    # Drop existing column and add as vector; existing text data cannot be cast to vector.
    op.execute("ALTER TABLE tech_documents DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE tech_documents ADD COLUMN embedding vector(1536) NULL")


def downgrade() -> None:
    """Revert embedding column to TEXT."""
    op.execute("ALTER TABLE tech_documents DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE tech_documents ADD COLUMN embedding TEXT NULL")

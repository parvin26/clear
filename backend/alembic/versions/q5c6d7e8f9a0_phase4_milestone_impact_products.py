"""Phase 4: milestone impact linkage + impact_products.

Revision ID: q5c6d7e8f9a0
Revises: p4b5c6d7e8f9
Create Date: 2025-02-17

- decision_execution_milestones: linked_org_indicator_ids (JSONB), impact_expected_output_note (text)
- impact_products: new table for product/service impact coefficients (accounting hooks)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import table_exists

revision: str = "q5c6d7e8f9a0"
down_revision: Union[str, Sequence[str], None] = "p4b5c6d7e8f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Milestone impact linkage
    op.add_column(
        "decision_execution_milestones",
        sa.Column("linked_org_indicator_ids", postgresql.JSONB(), nullable=True, server_default=sa.text("'[]'::jsonb")),
    )
    op.add_column(
        "decision_execution_milestones",
        sa.Column("impact_expected_output_note", sa.Text(), nullable=True),
    )

    # impact_products (Phase 4 accounting hooks)
    if not table_exists(conn, "impact_products"):
        op.create_table(
            "impact_products",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("organization_id", sa.Integer(), nullable=True),  # optional; can scope by decision_id later
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("sku", sa.String(120), nullable=True),
            sa.Column("linked_indicator_ids", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
            sa.Column("impact_coefficients", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_impact_products_decision_id"), "impact_products", ["decision_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_impact_products_decision_id"), table_name="impact_products")
    op.drop_table("impact_products")
    op.drop_column("decision_execution_milestones", "impact_expected_output_note")
    op.drop_column("decision_execution_milestones", "linked_org_indicator_ids")

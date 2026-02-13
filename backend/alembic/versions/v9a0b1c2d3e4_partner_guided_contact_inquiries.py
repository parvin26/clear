"""Partner, guided-start, and contact inquiries tables.

Revision ID: v9a0b1c2d3e4
Revises: u8f9a0b1c2d3
Create Date: 2025-02-13

- partner_inquiries: capital partner intake
- guided_start_requests: guided onboarding intake
- contact_inquiries: book-call / contact form
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.alembic_utils import table_exists

revision: str = "v9a0b1c2d3e4"
down_revision: Union[str, Sequence[str], None] = "u8f9a0b1c2d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    if not table_exists(conn, "partner_inquiries"):
        op.create_table(
            "partner_inquiries",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("organization_name", sa.String(500), nullable=False),
            sa.Column("organization_type", sa.String(100), nullable=True),
            sa.Column("portfolio_size", sa.String(100), nullable=True),
            sa.Column("primary_use_case", sa.String(255), nullable=True),
            sa.Column("contact_email", sa.String(255), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_partner_inquiries_id"), "partner_inquiries", ["id"], unique=False)
        op.create_index(op.f("ix_partner_inquiries_contact_email"), "partner_inquiries", ["contact_email"], unique=False)

    if not table_exists(conn, "guided_start_requests"):
        op.create_table(
            "guided_start_requests",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("organization", sa.String(500), nullable=True),
            sa.Column("team_size", sa.String(100), nullable=True),
            sa.Column("primary_challenge", sa.String(500), nullable=True),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("preferred_onboarding_type", sa.String(255), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_guided_start_requests_id"), "guided_start_requests", ["id"], unique=False)
        op.create_index(op.f("ix_guided_start_requests_email"), "guided_start_requests", ["email"], unique=False)

    if not table_exists(conn, "contact_inquiries"):
        op.create_table(
            "contact_inquiries",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("name", sa.String(255), nullable=True),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("phone", sa.String(100), nullable=True),
            sa.Column("company", sa.String(255), nullable=True),
            sa.Column("reason", sa.String(255), nullable=True),
            sa.Column("preferred_date", sa.String(50), nullable=True),
            sa.Column("preferred_time", sa.String(50), nullable=True),
            sa.Column("message", sa.Text(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_contact_inquiries_id"), "contact_inquiries", ["id"], unique=False)
        op.create_index(op.f("ix_contact_inquiries_email"), "contact_inquiries", ["email"], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    if table_exists(conn, "contact_inquiries"):
        op.drop_index(op.f("ix_contact_inquiries_email"), table_name="contact_inquiries")
        op.drop_index(op.f("ix_contact_inquiries_id"), table_name="contact_inquiries")
        op.drop_table("contact_inquiries")
    if table_exists(conn, "guided_start_requests"):
        op.drop_index(op.f("ix_guided_start_requests_email"), table_name="guided_start_requests")
        op.drop_index(op.f("ix_guided_start_requests_id"), table_name="guided_start_requests")
        op.drop_table("guided_start_requests")
    if table_exists(conn, "partner_inquiries"):
        op.drop_index(op.f("ix_partner_inquiries_contact_email"), table_name="partner_inquiries")
        op.drop_index(op.f("ix_partner_inquiries_id"), table_name="partner_inquiries")
        op.drop_table("partner_inquiries")

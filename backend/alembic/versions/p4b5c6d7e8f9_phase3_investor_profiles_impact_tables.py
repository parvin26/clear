"""Phase 3: investor_profiles (intake), impact_profiles, org_impact_indicators, indicator_targets, indicator_measurements.

Revision ID: p4b5c6d7e8f9
Revises: y3c4d5e6f7a8
Create Date: 2025-02-17

- investor_profiles: store POST /api/intake/investor-profile submissions
- impact_profiles: per-decision (social enterprise) impact setup
- org_impact_indicators: org <-> indicator template + optional target
- indicator_targets: annual target by org_indicator_id + year
- indicator_measurements: period value for an org indicator
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.alembic_utils import index_exists, table_exists

revision: str = "p4b5c6d7e8f9"
down_revision: Union[str, Sequence[str], None] = "y3c4d5e6f7a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    if not table_exists(conn, "investor_profiles"):
        op.create_table(
            "investor_profiles",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("onboarding_context", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("investor_profile", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )

    if not table_exists(conn, "impact_profiles"):
        op.create_table(
            "impact_profiles",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("decision_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("impact_categories", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
            sa.Column("primary_sdg_tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
            sa.Column("theory_of_change", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists(conn, "ix_impact_profiles_decision_id"):
        op.create_index(op.f("ix_impact_profiles_decision_id"), "impact_profiles", ["decision_id"], unique=True)

    if not table_exists(conn, "org_impact_indicators"):
        op.create_table(
            "org_impact_indicators",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("impact_profile_id", sa.Integer(), sa.ForeignKey("impact_profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("indicator_template_id", sa.String(120), nullable=False),
            sa.Column("target_value", sa.Numeric(18, 4), nullable=True),
            sa.Column("target_year", sa.Integer(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists(conn, "ix_org_impact_indicators_impact_profile_id"):
        op.create_index(
            op.f("ix_org_impact_indicators_impact_profile_id"),
            "org_impact_indicators",
            ["impact_profile_id"],
            unique=False,
        )

    if not table_exists(conn, "indicator_measurements"):
        op.create_table(
            "indicator_measurements",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("org_impact_indicator_id", sa.Integer(), sa.ForeignKey("org_impact_indicators.id", ondelete="CASCADE"), nullable=False),
            sa.Column("period_start", sa.String(20), nullable=False),
            sa.Column("period_end", sa.String(20), nullable=False),
            sa.Column("value", sa.Numeric(18, 4), nullable=False),
            sa.Column("data_source", sa.String(255), nullable=False, server_default="self_reported"),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
    if not index_exists(conn, "ix_indicator_measurements_org_impact_indicator_id"):
        op.create_index(
            op.f("ix_indicator_measurements_org_impact_indicator_id"),
            "indicator_measurements",
            ["org_impact_indicator_id"],
            unique=False,
        )


def downgrade() -> None:
    conn = op.get_bind()
    if table_exists(conn, "indicator_measurements"):
        if index_exists(conn, "ix_indicator_measurements_org_impact_indicator_id"):
            op.drop_index(
                op.f("ix_indicator_measurements_org_impact_indicator_id"),
                table_name="indicator_measurements",
            )
        op.drop_table("indicator_measurements")
    if table_exists(conn, "org_impact_indicators"):
        if index_exists(conn, "ix_org_impact_indicators_impact_profile_id"):
            op.drop_index(
                op.f("ix_org_impact_indicators_impact_profile_id"),
                table_name="org_impact_indicators",
            )
        op.drop_table("org_impact_indicators")
    if table_exists(conn, "impact_profiles"):
        if index_exists(conn, "ix_impact_profiles_decision_id"):
            op.drop_index(op.f("ix_impact_profiles_decision_id"), table_name="impact_profiles")
        op.drop_table("impact_profiles")
    if table_exists(conn, "investor_profiles"):
        op.drop_table("investor_profiles")

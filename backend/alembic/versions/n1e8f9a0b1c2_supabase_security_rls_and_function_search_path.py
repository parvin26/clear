"""Supabase Security Advisor: RLS on public tables and function search_path.

- Enable Row Level Security (RLS) on all tables in public schema (satisfies Security Advisor).
- Add policy allowing service_role full access so backend/API keeps working.
- Set explicit search_path on trigger functions to fix 'Function Search Path Mutable' warnings.

Revision ID: n1e8f9a0b1c2
Revises: m0c1d2e3f4a5
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "n1e8f9a0b1c2"
down_revision: Union[str, Sequence[str], None] = "m0c1d2e3f4a5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ---- 1. Fix function search_path (Security Advisor: Function Search Path Mutable) ----
    op.execute("ALTER FUNCTION IF EXISTS public.rtco_forbid_update_delete() SET search_path = public")
    op.execute("ALTER FUNCTION IF EXISTS public.clear_forbid_update_delete() SET search_path = public")
    op.execute("ALTER FUNCTION IF EXISTS public.clear_forbid_update_delete_context() SET search_path = public")

    # ---- 2. Enable RLS on all tables in public schema ----
    result = conn.execute(
        sa.text(
            """
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
            """
        )
    )
    tables = [row[0] for row in result]

    for table in tables:
        # Enable RLS (idempotent: no-op if already enabled)
        op.execute(sa.text(f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY'))

        policy_name = "service_role_full_access"
        # Drop if exists so migration is idempotent
        op.execute(
            sa.text(
                f'DROP POLICY IF EXISTS "{policy_name}" ON public."{table}"'
            )
        )
        op.execute(
            sa.text(
                f'''CREATE POLICY "{policy_name}" ON public."{table}"
                FOR ALL TO service_role USING (true) WITH CHECK (true)'''
            )
        )


def downgrade() -> None:
    conn = op.get_bind()

    # Remove RLS policies and disable RLS
    result = conn.execute(
        sa.text(
            """
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
            """
        )
    )
    tables = [row[0] for row in result]

    for table in tables:
        op.execute(
            sa.text(f'DROP POLICY IF EXISTS "service_role_full_access" ON public."{table}"')
        )
        op.execute(sa.text(f'ALTER TABLE public."{table}" DISABLE ROW LEVEL SECURITY'))

    # Reset function search_path (optional; leave as public is safe)
    op.execute("ALTER FUNCTION IF EXISTS public.rtco_forbid_update_delete() RESET search_path")
    op.execute("ALTER FUNCTION IF EXISTS public.clear_forbid_update_delete() RESET search_path")
    op.execute("ALTER FUNCTION IF EXISTS public.clear_forbid_update_delete_context() RESET search_path")

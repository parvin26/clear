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
    # PostgreSQL does not support ALTER FUNCTION IF EXISTS; use DO block.
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'rtco_forbid_update_delete') THEN
                ALTER FUNCTION public.rtco_forbid_update_delete() SET search_path = public;
            END IF;
            IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'clear_forbid_update_delete') THEN
                ALTER FUNCTION public.clear_forbid_update_delete() SET search_path = public;
            END IF;
            IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'clear_forbid_update_delete_context') THEN
                ALTER FUNCTION public.clear_forbid_update_delete_context() SET search_path = public;
            END IF;
        END $$;
    """)

    # ---- 2. Enable RLS on all tables (Supabase only: service_role exists) ----
    # On Railway/plain Postgres there is no service_role; skip RLS so migration succeeds.
    # On Supabase, service_role exists and we enable RLS + policy for Security Advisor.
    role_check = conn.execute(sa.text("SELECT 1 FROM pg_roles WHERE rolname = 'service_role'"))
    if role_check.fetchone():
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
            op.execute(sa.text(f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY'))
            policy_name = "service_role_full_access"
            op.execute(sa.text(f'DROP POLICY IF EXISTS "{policy_name}" ON public."{table}"'))
            op.execute(
                sa.text(
                    f'''CREATE POLICY "{policy_name}" ON public."{table}"
                    FOR ALL TO service_role USING (true) WITH CHECK (true)'''
                )
            )


def downgrade() -> None:
    conn = op.get_bind()

    # Remove RLS policies and disable RLS only if we're on Supabase (service_role exists)
    role_check = conn.execute(sa.text("SELECT 1 FROM pg_roles WHERE rolname = 'service_role'"))
    if role_check.fetchone():
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
            op.execute(sa.text(f'DROP POLICY IF EXISTS "service_role_full_access" ON public."{table}"'))
            op.execute(sa.text(f'ALTER TABLE public."{table}" DISABLE ROW LEVEL SECURITY'))

    # Reset function search_path (optional; leave as public is safe)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'rtco_forbid_update_delete') THEN
                ALTER FUNCTION public.rtco_forbid_update_delete() RESET search_path;
            END IF;
            IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'clear_forbid_update_delete') THEN
                ALTER FUNCTION public.clear_forbid_update_delete() RESET search_path;
            END IF;
            IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'clear_forbid_update_delete_context') THEN
                ALTER FUNCTION public.clear_forbid_update_delete_context() RESET search_path;
            END IF;
        END $$;
    """)

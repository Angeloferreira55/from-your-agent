-- ============================================================
-- Migration 017: Ensure RLS is enabled on all public tables
-- ============================================================
-- Supabase Security Advisor can report publicly accessible tables
-- when row-level security is disabled. This migration enables RLS
-- for every user-defined table in the public schema.

DO $$
DECLARE
  row RECORD;
BEGIN
  FOR row IN
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('schema_migrations')
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', row.table_schema, row.table_name);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Keep admin access and public policies defined in prior migrations.
-- If a given table has no explicit policies, it will remain protected
-- by RLS until policies are added.

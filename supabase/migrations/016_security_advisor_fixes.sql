-- ============================================================
-- Migration 016: Security Advisor Fixes
-- ============================================================
-- Resolves WARN-level findings from Supabase Security Advisor:
--   - function_search_path_mutable (4 functions)
--   - public_bucket_allows_listing (agent-logos, agent-photos)
--   - anon/authenticated_security_definer_function_executable (4 functions)

-- ------------------------------------------------------------
-- 1. Pin search_path on all SECURITY DEFINER / helper functions
-- ------------------------------------------------------------
ALTER FUNCTION public.get_agent_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.find_nearest_offers(numeric, numeric, uuid[], integer)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_campaign_counter(uuid, text)
  SET search_path = public, pg_temp;

-- ------------------------------------------------------------
-- 2. Drop broad SELECT policies on public storage buckets
-- ------------------------------------------------------------
-- Public buckets (public = true) already serve files via public URLs
-- without requiring a SELECT policy on storage.objects. The "Anyone can
-- view ..." policies allow clients to LIST the bucket, exposing more
-- than necessary. Direct URL access continues to work after dropping.
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;

-- ------------------------------------------------------------
-- 3. Lock down SECURITY DEFINER functions from REST RPC exposure
-- ------------------------------------------------------------
-- handle_new_user: trigger function only, never called via RPC.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- increment_campaign_counter: called only by the Lob webhook handler
-- using the service-role key. Service role bypasses these grants, so
-- revoking from anon/authenticated is safe.
REVOKE EXECUTE ON FUNCTION public.increment_campaign_counter(uuid, text)
  FROM PUBLIC, anon, authenticated;

-- get_agent_id, is_admin: used inside RLS policy expressions. Revoke
-- from anon (never authenticated, never hits these). Keep authenticated
-- EXECUTE so RLS evaluation continues to work.
REVOKE EXECUTE ON FUNCTION public.get_agent_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_agent_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

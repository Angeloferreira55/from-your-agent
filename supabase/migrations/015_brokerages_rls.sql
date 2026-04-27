-- ============================================================
-- Migration 015: Enable RLS on brokerages table
-- ============================================================
-- Brokerages are admin-managed but read by all authenticated agents
-- (agent_profiles.brokerage_id references this table).
-- Pattern matches merchants/offers/regions/postcard_templates/pricing_tiers
-- in 005_rls_and_functions.sql.

ALTER TABLE public.brokerages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_brokerages" ON public.brokerages
  FOR SELECT USING (true);

CREATE POLICY "admin_write_brokerages" ON public.brokerages
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_brokerages" ON public.brokerages
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "admin_delete_brokerages" ON public.brokerages
  FOR DELETE USING (public.is_admin());

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.brokerages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

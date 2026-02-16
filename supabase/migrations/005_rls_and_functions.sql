-- ============================================================
-- Migration 005: RLS Policies, Triggers, Functions
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postcard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Helper: Get current user's agent profile ID
CREATE OR REPLACE FUNCTION public.get_agent_id()
RETURNS UUID AS $$
  SELECT id FROM public.agent_profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Agent profiles: users see own, admins see all
CREATE POLICY "agents_own_profile" ON public.agent_profiles
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- Contacts: agents see own, admins see all
CREATE POLICY "agents_own_contacts" ON public.contacts
  FOR ALL USING (agent_id = public.get_agent_id() OR public.is_admin());

-- Contact imports: agents see own
CREATE POLICY "agents_own_imports" ON public.contact_imports
  FOR ALL USING (agent_id = public.get_agent_id() OR public.is_admin());

-- Public read tables (merchants, offers, regions, templates, pricing)
CREATE POLICY "read_merchants" ON public.merchants FOR SELECT USING (true);
CREATE POLICY "admin_write_merchants" ON public.merchants
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_merchants" ON public.merchants
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_merchants" ON public.merchants
  FOR DELETE USING (public.is_admin());

CREATE POLICY "read_offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "admin_write_offers" ON public.offers
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_offers" ON public.offers
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_offers" ON public.offers
  FOR DELETE USING (public.is_admin());

CREATE POLICY "read_regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "admin_write_regions" ON public.regions
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_regions" ON public.regions
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_regions" ON public.regions
  FOR DELETE USING (public.is_admin());

CREATE POLICY "read_templates" ON public.postcard_templates FOR SELECT USING (true);
CREATE POLICY "admin_write_templates" ON public.postcard_templates
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_templates" ON public.postcard_templates
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_templates" ON public.postcard_templates
  FOR DELETE USING (public.is_admin());

CREATE POLICY "read_pricing" ON public.pricing_tiers FOR SELECT USING (true);
CREATE POLICY "admin_write_pricing" ON public.pricing_tiers
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_pricing" ON public.pricing_tiers
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_pricing" ON public.pricing_tiers
  FOR DELETE USING (public.is_admin());

-- Campaigns: read for authenticated, write for admin
CREATE POLICY "read_campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_write_campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_campaigns" ON public.campaigns
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_campaigns" ON public.campaigns
  FOR DELETE USING (public.is_admin());

-- Agent campaigns: agents see own, admins see all
CREATE POLICY "agents_own_agent_campaigns" ON public.agent_campaigns
  FOR ALL USING (agent_id = public.get_agent_id() OR public.is_admin());

-- Postcards: agents see own via agent_campaigns, admins see all
CREATE POLICY "agents_own_postcards" ON public.postcards
  FOR SELECT USING (
    agent_campaign_id IN (
      SELECT id FROM public.agent_campaigns WHERE agent_id = public.get_agent_id()
    ) OR public.is_admin()
  );

-- Billing: agents see own, admins see all
CREATE POLICY "agents_own_billing" ON public.billing_records
  FOR ALL USING (agent_id = public.get_agent_id() OR public.is_admin());

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.agent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.regions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.postcard_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.agent_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.postcards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create agent profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.agent_profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Geospatial offer matching function
CREATE OR REPLACE FUNCTION public.find_nearest_offers(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_campaign_offer_ids UUID[],
  p_limit INTEGER DEFAULT 1
)
RETURNS SETOF public.offers AS $$
  SELECT o.*
  FROM public.offers o
  JOIN public.merchants m ON o.merchant_id = m.id
  WHERE o.id = ANY(p_campaign_offer_ids)
    AND o.is_active = TRUE
    AND m.latitude IS NOT NULL
    AND m.longitude IS NOT NULL
  ORDER BY (
    3959 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(p_latitude)) * cos(radians(m.latitude))
        * cos(radians(m.longitude) - radians(p_longitude))
        + sin(radians(p_latitude)) * sin(radians(m.latitude))
      ))
    )
  ) ASC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;

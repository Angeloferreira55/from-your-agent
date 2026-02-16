-- ============================================================
-- Migration 004: Campaigns, Postcards, Billing
-- ============================================================

CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  template_id UUID NOT NULL REFERENCES public.postcard_templates(id),
  offer_ids UUID[] DEFAULT '{}',
  mail_date DATE NOT NULL,
  cutoff_date DATE NOT NULL,
  status TEXT DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'scheduled', 'generating', 'ready_to_mail',
      'mailing', 'mailed', 'completed', 'canceled'
    )),
  total_postcards INTEGER DEFAULT 0,
  mailed_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  returned_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.agent_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(month, year)
);

CREATE TABLE public.agent_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  custom_message_override TEXT,
  contact_filter JSONB,
  contact_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'opted_in'
    CHECK (status IN ('opted_in', 'generating', 'ready', 'mailed', 'canceled')),
  estimated_cost NUMERIC(10, 2) DEFAULT 0,
  actual_cost NUMERIC(10, 2),
  billed BOOLEAN DEFAULT FALSE,
  opted_in_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, campaign_id)
);

CREATE INDEX idx_agent_campaigns_agent ON public.agent_campaigns(agent_id);
CREATE INDEX idx_agent_campaigns_campaign ON public.agent_campaigns(campaign_id);

CREATE TABLE public.postcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_campaign_id UUID NOT NULL REFERENCES public.agent_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  lob_postcard_id TEXT,
  lob_tracking_id TEXT,
  lob_url TEXT,
  merge_variables JSONB,
  mailed BOOLEAN DEFAULT FALSE,
  mail_type TEXT DEFAULT 'usps_first_class'
    CHECK (mail_type IN ('usps_first_class', 'usps_standard')),
  status TEXT DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'generating', 'rendered', 'queued',
      'mailed', 'in_transit', 'in_local_area', 'delivered',
      'returned', 'canceled', 'failed'
    )),
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  cost_per_card NUMERIC(6, 2),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_postcards_agent_campaign ON public.postcards(agent_campaign_id);
CREATE INDEX idx_postcards_contact ON public.postcards(contact_id);
CREATE INDEX idx_postcards_campaign ON public.postcards(campaign_id);
CREATE INDEX idx_postcards_status ON public.postcards(status);
CREATE INDEX idx_postcards_lob_id ON public.postcards(lob_postcard_id);

CREATE TABLE public.billing_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  campaign_id UUID REFERENCES public.campaigns(id),
  description TEXT NOT NULL,
  total_cards INTEGER DEFAULT 0,
  mailed_cards INTEGER DEFAULT 0,
  unmailed_cards INTEGER DEFAULT 0,
  price_per_mailed NUMERIC(6, 2),
  price_per_unmailed NUMERIC(6, 2),
  subtotal NUMERIC(10, 2) NOT NULL,
  tax NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'void')),
  billing_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_agent ON public.billing_records(agent_id);
CREATE INDEX idx_billing_campaign ON public.billing_records(campaign_id);

CREATE TABLE public.pricing_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  min_cards INTEGER NOT NULL,
  max_cards INTEGER,
  price_per_mailed NUMERIC(6, 2) NOT NULL,
  price_per_unmailed NUMERIC(6, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.pricing_tiers (name, min_cards, max_cards, price_per_mailed, price_per_unmailed)
VALUES
  ('Starter', 1, 99, 1.25, 0.90),
  ('Standard', 100, 499, 1.10, 0.85),
  ('Volume', 500, NULL, 1.00, 0.85);

-- ============================================================
-- Migration 001: Core Schema - Agent Profiles, Regions
-- ============================================================

-- Agent profiles (extends Supabase auth.users)
CREATE TABLE public.agent_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT,
  industry TEXT NOT NULL DEFAULT 'real_estate'
    CHECK (industry IN ('real_estate', 'insurance')),
  company_name TEXT,
  license_number TEXT,
  -- Branding / personalization (back of postcard)
  logo_url TEXT,
  photo_url TEXT,
  custom_message TEXT,
  tagline TEXT,
  brand_color TEXT DEFAULT '#F97316',
  -- Address (for return address on postcards)
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  -- Stripe
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive'
    CHECK (subscription_status IN (
      'inactive', 'active', 'past_due', 'canceled', 'trialing'
    )),
  -- Role
  role TEXT NOT NULL DEFAULT 'agent'
    CHECK (role IN ('agent', 'admin')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_agent_profiles_user_id ON public.agent_profiles(user_id);
CREATE INDEX idx_agent_profiles_stripe_customer ON public.agent_profiles(stripe_customer_id);

-- Regions / Geographic Zones (admin-defined)
CREATE TABLE public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  center_lat NUMERIC(10, 7),
  center_lng NUMERIC(10, 7),
  radius_miles NUMERIC(6, 2) DEFAULT 25.0,
  state_codes TEXT[],
  zip_codes TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

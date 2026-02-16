-- ============================================================
-- Migration 003: Merchants, Offers, Postcard Templates
-- ============================================================

CREATE TABLE public.merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN (
      'restaurant', 'cafe', 'pizza', 'mexican', 'asian', 'italian',
      'american', 'bbq', 'seafood', 'bakery', 'ice_cream',
      'bar', 'brewery', 'other_food',
      'spa', 'salon', 'fitness', 'entertainment', 'retail', 'service'
    )),
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_merchants_region ON public.merchants(region_id);
CREATE INDEX idx_merchants_category ON public.merchants(category);

CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_text TEXT NOT NULL,
  fine_print TEXT,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  redemption_code TEXT,
  redemption_instructions TEXT,
  image_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  max_uses_per_month INTEGER,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_offers_merchant ON public.offers(merchant_id);
CREATE INDEX idx_offers_region ON public.offers(region_id);
CREATE INDEX idx_offers_active_dates ON public.offers(valid_from, valid_until)
  WHERE is_active = TRUE;

CREATE TABLE public.postcard_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  size TEXT NOT NULL DEFAULT '6x9'
    CHECK (size IN ('4x6', '6x9', '6x11')),
  front_html TEXT NOT NULL,
  back_html TEXT NOT NULL,
  front_preview_url TEXT,
  back_preview_url TEXT,
  merge_variables JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  season TEXT CHECK (season IN ('spring', 'summer', 'fall', 'winter', 'holiday', 'any')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Migration 013: Add type and brokerage_id to postcard_templates
-- ============================================================

-- Template type: "brokerage" = top-right panel, "monthly" = top-left + front
ALTER TABLE public.postcard_templates
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'brokerage'
    CHECK (type IN ('brokerage', 'monthly'));

-- Link brokerage templates to their brokerage (TEXT id to match brokerages table)
ALTER TABLE public.postcard_templates
  ADD COLUMN IF NOT EXISTS brokerage_id TEXT REFERENCES public.brokerages(id) ON DELETE SET NULL;

-- Index for fast lookup by brokerage
CREATE INDEX IF NOT EXISTS idx_templates_brokerage ON public.postcard_templates(brokerage_id)
  WHERE brokerage_id IS NOT NULL;

-- Index for type filtering
CREATE INDEX IF NOT EXISTS idx_templates_type ON public.postcard_templates(type);

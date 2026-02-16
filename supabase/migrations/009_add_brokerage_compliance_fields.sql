-- ============================================================
-- Migration 009: Add brokerage address & phone for compliance
-- ============================================================

ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS brokerage_phone TEXT,
  ADD COLUMN IF NOT EXISTS brokerage_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS brokerage_address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS brokerage_city TEXT,
  ADD COLUMN IF NOT EXISTS brokerage_state TEXT,
  ADD COLUMN IF NOT EXISTS brokerage_zip TEXT;

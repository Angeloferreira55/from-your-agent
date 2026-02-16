-- ============================================================
-- Migration 010: Add website field and postcard visibility preferences
-- ============================================================

ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS postcard_visible_fields JSONB DEFAULT '{"phone":true,"email":true,"license":true,"website":false,"brokerage_info":true}'::jsonb;

-- ============================================================
-- Migration 008: Add brokerage/team logo fields, increase upload limits
-- ============================================================

-- Add new logo URL columns to agent_profiles
ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS brokerage_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS team_logo_url TEXT;

-- Increase file size limits to 10MB for both buckets
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'agent-logos';
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'agent-photos';

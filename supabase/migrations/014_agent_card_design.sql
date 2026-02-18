-- ============================================================
-- Migration 014: Add agent_card_design to agent_profiles
-- Stores the agent's bottom-left postcard panel design (DesignConfig JSON)
-- ============================================================

ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS agent_card_design JSONB;

-- 018_partner_signups.sql
-- Adds fields to support the public "Become a Partner" signup form, where a
-- business registers itself and accepts the partner terms. Submissions land as
-- partner_status = 'pending' (and is_active = false) for admin review; existing
-- admin-created merchants keep the 'active' default so they are unaffected.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS contact_name       TEXT,
  ADD COLUMN IF NOT EXISTS contact_email      TEXT,
  ADD COLUMN IF NOT EXISTS source             TEXT DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS partner_status     TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS terms_accepted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_signature    TEXT,
  ADD COLUMN IF NOT EXISTS terms_version      TEXT;

-- Constrain the review status to known values.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'merchants_partner_status_check'
  ) THEN
    ALTER TABLE merchants
      ADD CONSTRAINT merchants_partner_status_check
      CHECK (partner_status IN ('pending', 'active', 'declined'));
  END IF;
END $$;

-- Fast lookups for the admin review queue.
CREATE INDEX IF NOT EXISTS idx_merchants_partner_status ON merchants (partner_status);

COMMENT ON COLUMN merchants.source IS 'Where the merchant came from: admin | partner_form';
COMMENT ON COLUMN merchants.partner_status IS 'Review state for self-signup partners: pending | active | declined';
COMMENT ON COLUMN merchants.terms_signature IS 'Typed full name captured as electronic signature at signup';

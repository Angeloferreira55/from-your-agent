-- ============================================================
-- Migration 002: Contacts / SOI Database
-- ============================================================

CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  email TEXT,
  phone TEXT,
  relationship_type TEXT DEFAULT 'sphere'
    CHECK (relationship_type IN (
      'sphere', 'past_client', 'prospect', 'referral', 'family', 'friend', 'other'
    )),
  tags TEXT[],
  address_verified BOOLEAN DEFAULT FALSE,
  address_verification_date TIMESTAMPTZ,
  lob_address_id TEXT,
  deliverability TEXT DEFAULT 'unknown'
    CHECK (deliverability IN (
      'deliverable', 'deliverable_unnecessary_unit',
      'deliverable_incorrect_unit', 'deliverable_missing_unit',
      'undeliverable', 'unknown'
    )),
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'do_not_mail', 'bad_address')),
  import_batch_id UUID,
  source TEXT DEFAULT 'manual'
    CHECK (source IN ('manual', 'csv_import', 'crm_sync')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_agent_id ON public.contacts(agent_id);
CREATE INDEX idx_contacts_zip ON public.contacts(zip);
CREATE INDEX idx_contacts_status ON public.contacts(status);

-- Contact import batches (tracks CSV uploads)
CREATE TABLE public.contact_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  total_rows INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  column_mapping JSONB,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  errors JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

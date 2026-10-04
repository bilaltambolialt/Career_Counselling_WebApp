-- v1.22.0 — Make cutoff_data platform-wide (remove tenant requirement)
-- Cutoff data is now centralized — not scoped per tenant/institution.
-- Run this in Supabase SQL Editor.

ALTER TABLE cutoff_data ALTER COLUMN tenant_id DROP NOT NULL;

-- Index for queries that still filter by tenant_id (optional adminId filter in listCutoff)
-- Already exists from earlier migrations; no change needed.

COMMENT ON COLUMN cutoff_data.tenant_id IS 'Nullable — legacy column; new entries are platform-wide (NULL)';

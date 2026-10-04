-- v1.25.0 — Combined fix: make cutoff_data super-admin compatible
-- Removes NOT NULL from tenant_id and uploaded_by so super admin can insert
-- platform-wide entries (super admin has no tenant_id and is not in admins table).
-- Safe to run even if v1_22_0 and v1_24_0 were already applied (idempotent).
-- Run this in Supabase SQL Editor.

-- 1. Make tenant_id nullable (super admin inserts have no tenant)
ALTER TABLE cutoff_data ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Make uploaded_by nullable (super admin UUID is in super_admins, not admins)
ALTER TABLE cutoff_data ALTER COLUMN uploaded_by DROP NOT NULL;

-- Verify — both should show is_nullable = 'YES'
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'cutoff_data'
  AND column_name IN ('tenant_id', 'uploaded_by');

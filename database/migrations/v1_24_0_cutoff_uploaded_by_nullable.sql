-- v1.24.0 — Make cutoff_data.uploaded_by nullable
-- uploaded_by was NOT NULL REFERENCES admins(id), which breaks super admin inserts
-- since super admin UUIDs are in super_admins table, not admins table.
-- Run this in Supabase SQL Editor.

ALTER TABLE cutoff_data ALTER COLUMN uploaded_by DROP NOT NULL;

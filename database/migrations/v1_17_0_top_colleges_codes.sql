-- ============================================================
-- Migration v1.17.0 — Add DTE code & branch code to top_colleges
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE top_colleges
  ADD COLUMN IF NOT EXISTS dte_code    VARCHAR(50),
  ADD COLUMN IF NOT EXISTS branch_code VARCHAR(50);

-- ============================================================
-- VERIFY
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'top_colleges'
-- ORDER BY ordinal_position;
-- ============================================================

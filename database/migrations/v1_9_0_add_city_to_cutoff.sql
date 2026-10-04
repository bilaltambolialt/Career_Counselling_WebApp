-- ═══════════════════════════════════════════════════════════════════════════
-- Migration v1.9.0 — Add city column to cutoff_data
--
-- Purpose: Store the city of the college campus for each cutoff row so that
--          the recommendations page can later filter results by city without
--          requiring an extra JOIN to the colleges table.
--
-- Design note: city is stored directly on cutoff_data (not inherited from
--              colleges.location) because:
--              1. The prediction engine can filter with a simple .eq('city')
--              2. Admins filling the CSV already know the campus city
--              3. Consistent pattern with exam_type and category columns
--
-- Column is nullable — existing rows and rows without city data are unaffected.
-- Run ONCE in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE cutoff_data
  ADD COLUMN IF NOT EXISTS city VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_cutoff_city ON cutoff_data(city);

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'cutoff_data' AND column_name = 'city';
-- Expected: 1 row — city / character varying
-- ═══════════════════════════════════════════════════════════════════════════

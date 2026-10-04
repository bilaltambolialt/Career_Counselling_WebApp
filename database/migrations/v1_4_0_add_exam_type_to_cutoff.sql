-- ============================================================
-- MIGRATION: v1.4.0 — Add exam_type to cutoff_data
-- Purpose : Filter recommendations by the student's exam stream
--           so NEET students never see engineering cutoffs and
--           JEE students never see medical cutoffs.
-- Run ONCE in Supabase SQL Editor
-- Idempotent: safe to re-run
-- ============================================================

-- Add exam_type column (nullable so existing rows aren't broken)
ALTER TABLE cutoff_data
  ADD COLUMN IF NOT EXISTS exam_type VARCHAR(20);

-- Add check constraint (wrapped in DO block for idempotency)
DO $$ BEGIN
  ALTER TABLE cutoff_data
    ADD CONSTRAINT cutoff_data_exam_type_check
    CHECK (exam_type IN (
      'JEE_MAIN', 'JEE_ADVANCED', 'MHT_CET',
      'NEET_UG', 'NEET_PG', 'OTHER'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- VERIFY
-- SELECT exam_type, COUNT(*) FROM cutoff_data GROUP BY exam_type;
-- ============================================================

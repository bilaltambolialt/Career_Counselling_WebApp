-- ═══════════════════════════════════════════════════════════════════════════
-- Migration v1.6.0 — Add Diploma / Polytechnic fields to student_profiles
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. qualification_type column — '12th' (default) or 'Diploma'
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS qualification_type      VARCHAR(20)   DEFAULT '12th',
  ADD COLUMN IF NOT EXISTS diploma_board           VARCHAR(150),
  ADD COLUMN IF NOT EXISTS diploma_branch          VARCHAR(150),
  ADD COLUMN IF NOT EXISTS diploma_percentage      DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS diploma_year_of_passing INTEGER;

-- 2. CHECK constraint on qualification_type (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_qualification_type'
      AND conrelid = 'student_profiles'::regclass
  ) THEN
    ALTER TABLE student_profiles
      ADD CONSTRAINT chk_qualification_type
        CHECK (qualification_type IN ('12th', 'Diploma'));
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification query (run after migration to confirm columns exist)
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'student_profiles'
--   AND column_name IN ('qualification_type','diploma_board','diploma_branch','diploma_percentage','diploma_year_of_passing')
-- ORDER BY column_name;

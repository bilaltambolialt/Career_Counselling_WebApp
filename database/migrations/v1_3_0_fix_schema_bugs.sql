-- ============================================================
-- MIGRATION: v1.3.0 — Schema Bug Fixes
-- Project: College Admission Prediction & Notification WebApp
-- Date: 2026-02-27
-- Description:
--   1. Expand student_profiles.gender constraint to include
--      'Prefer not to say' (frontend sends this value)
--   2. Rename student_exam_scores.year → attempt_year
--      (controller and frontend use attempt_year)
--   3. Add attempt_number column to student_exam_scores
-- ============================================================

-- ============================================================
-- 1. Expand gender constraint in student_profiles
-- ============================================================
ALTER TABLE student_profiles
  DROP CONSTRAINT IF EXISTS valid_gender;

ALTER TABLE student_profiles
  ADD CONSTRAINT valid_gender CHECK (
    gender IS NULL OR gender IN ('Male', 'Female', 'Other', 'Prefer not to say')
  );

COMMENT ON COLUMN student_profiles.gender IS 'Male | Female | Other | Prefer not to say';

-- ============================================================
-- 2. Rename year → attempt_year in student_exam_scores
-- ============================================================
ALTER TABLE student_exam_scores
  RENAME COLUMN year TO attempt_year;

COMMENT ON COLUMN student_exam_scores.attempt_year IS 'Year of exam attempt (e.g. 2025)';

-- ============================================================
-- 3. Add attempt_number column to student_exam_scores
-- ============================================================
ALTER TABLE student_exam_scores
  ADD COLUMN IF NOT EXISTS attempt_number SMALLINT NOT NULL DEFAULT 1;

COMMENT ON COLUMN student_exam_scores.attempt_number IS 'Which attempt number (1st, 2nd, etc.)';

-- ============================================================
-- END OF MIGRATION v1.3.0
-- ============================================================

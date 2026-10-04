-- ============================================================
-- MIGRATION: v1.1.0 — Auth Fields + Exam Type Expansion
-- Project: College Admission Prediction & Notification WebApp
-- Date: 2026-02-24
-- Description:
--   1. Add password_hash to all user tables
--   2. Expand exam_type constraint (add NEET_UG, NEET_PG)
--   3. Drop unused otp_verifications table
--   4. Add must_change_password flag to counselors + students
-- ============================================================

-- ============================================================
-- 1. Add password_hash to super_admins
-- ============================================================
ALTER TABLE super_admins
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT '';

COMMENT ON COLUMN super_admins.password_hash IS 'bcrypt hashed password (salt rounds: 12)';

-- ============================================================
-- 2. Add password_hash to admins
-- ============================================================
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT '';

COMMENT ON COLUMN admins.password_hash IS 'bcrypt hashed password (salt rounds: 12)';

-- ============================================================
-- 3. Add password_hash + must_change_password to counselors
-- ============================================================
ALTER TABLE counselors
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN counselors.password_hash IS 'bcrypt hashed password set by admin on creation';
COMMENT ON COLUMN counselors.must_change_password IS 'Forces password reset on first login';

-- ============================================================
-- 4. Add password_hash + must_change_password to students
-- ============================================================
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN students.password_hash IS 'bcrypt hashed password set by admin/counselor on creation';
COMMENT ON COLUMN students.must_change_password IS 'Forces password reset on first login';

-- ============================================================
-- 5. Expand exam_type constraint in student_exam_scores
-- ============================================================
ALTER TABLE student_exam_scores
  DROP CONSTRAINT IF EXISTS valid_exam_type;

ALTER TABLE student_exam_scores
  ADD CONSTRAINT valid_exam_type CHECK (
    exam_type IN (
      'JEE_MAIN',
      'JEE_ADVANCED',
      'MHT_CET',
      'NEET_UG',
      'NEET_PG',
      'OTHER'
    )
  );

COMMENT ON COLUMN student_exam_scores.exam_type IS 'JEE_MAIN | JEE_ADVANCED | MHT_CET | NEET_UG | NEET_PG | OTHER';

-- ============================================================
-- 6. Expand exam_type in student_profiles (preferred exam)
-- ============================================================
COMMENT ON COLUMN student_profiles.exam_type IS 'Preferred exam: JEE_MAIN | JEE_ADVANCED | MHT_CET | NEET_UG | NEET_PG | OTHER';

-- ============================================================
-- 7. Drop otp_verifications table (auth method changed)
-- ============================================================
DROP TABLE IF EXISTS otp_verifications;

-- ============================================================
-- 8. Remove otp_verifications RLS if it was applied
-- (RLS drops automatically when table is dropped)
-- ============================================================

-- ============================================================
-- END OF MIGRATION v1.1.0
-- ============================================================

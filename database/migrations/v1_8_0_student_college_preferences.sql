-- ═══════════════════════════════════════════════════════════════════════════
-- Migration v1.8.0 — Student College Preferences
--
-- Adds a new table to store each student's shortlisted colleges, grouped
-- into three categories: dream, target, and safe.
--
-- Limit: 5 colleges per category (enforced in application layer).
-- Duplicate college (any category) prevented by unique index.
--
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS student_college_preferences (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID         NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tenant_id    UUID         NOT NULL REFERENCES admins(id)   ON DELETE CASCADE,
  college_id   UUID         NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  college_name VARCHAR(255) NOT NULL,  -- denormalised copy of colleges.name for fast display
  college_location VARCHAR(255),       -- denormalised: city/state for display
  category     VARCHAR(10)  NOT NULL CHECK (category IN ('dream', 'target', 'safe')),
  added_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- A student cannot add the same college twice (regardless of category)
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_college_pref
  ON student_college_preferences(student_id, college_id);

CREATE INDEX IF NOT EXISTS idx_scp_student_id ON student_college_preferences(student_id);
CREATE INDEX IF NOT EXISTS idx_scp_tenant_id  ON student_college_preferences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scp_category   ON student_college_preferences(student_id, category);

ALTER TABLE student_college_preferences ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name = 'student_college_preferences';
-- Expected: 1 row
-- ═══════════════════════════════════════════════════════════════════════════

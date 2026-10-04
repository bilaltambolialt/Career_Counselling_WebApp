-- ============================================================
-- Migration v1.16.0 — Student College Bookmarks
-- Students can bookmark top-college entries for quick reference
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS student_college_bookmarks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID        NOT NULL REFERENCES students(id)     ON DELETE CASCADE,
  tenant_id       UUID        NOT NULL REFERENCES admins(id)       ON DELETE CASCADE,
  top_college_id  UUID        NOT NULL REFERENCES top_colleges(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_student_college_bookmark UNIQUE (student_id, top_college_id)
);

CREATE INDEX IF NOT EXISTS idx_scb_student_id     ON student_college_bookmarks(student_id);
CREATE INDEX IF NOT EXISTS idx_scb_tenant_id      ON student_college_bookmarks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scb_top_college_id ON student_college_bookmarks(top_college_id);

ALTER TABLE student_college_bookmarks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFY
-- SELECT COUNT(*) FROM student_college_bookmarks;
-- ============================================================

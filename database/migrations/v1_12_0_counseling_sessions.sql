-- ============================================================
-- MIGRATION: v1.12.0 — Counseling Sessions
-- Purpose : Add counseling_sessions table for Phase 8
--           (Counselor Session Management)
-- Run ONCE in Supabase SQL Editor
-- Idempotent: safe to re-run
-- ============================================================

CREATE TABLE IF NOT EXISTS counseling_sessions (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID         NOT NULL REFERENCES admins(id)     ON DELETE CASCADE,
  student_id       UUID         NOT NULL REFERENCES students(id)   ON DELETE CASCADE,
  counselor_id     UUID         NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  title            VARCHAR(200) NOT NULL,
  scheduled_at     TIMESTAMPTZ  NOT NULL,
  duration_minutes INTEGER      NOT NULL DEFAULT 60,
  status           VARCHAR(20)  NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes            TEXT,
  meeting_link     VARCHAR(500),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Fast lookup by counselor (main query path)
CREATE INDEX IF NOT EXISTS idx_sessions_counselor
  ON counseling_sessions(counselor_id, tenant_id, scheduled_at DESC);

-- Fast lookup by student
CREATE INDEX IF NOT EXISTS idx_sessions_student
  ON counseling_sessions(student_id, tenant_id, scheduled_at DESC);

-- Fast lookup by tenant (admin view)
CREATE INDEX IF NOT EXISTS idx_sessions_tenant
  ON counseling_sessions(tenant_id, scheduled_at DESC);

-- ============================================================
-- VERIFY
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'counseling_sessions' ORDER BY ordinal_position;
-- ============================================================

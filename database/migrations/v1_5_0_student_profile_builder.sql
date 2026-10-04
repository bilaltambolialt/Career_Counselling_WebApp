-- ============================================================
-- MIGRATION: v1.5.0 — Student Profile Builder
-- Purpose : Expand student_profiles for multi-section profile
--           builder; add student_documents for file uploads.
-- Run ONCE in Supabase SQL Editor
-- Idempotent: safe to re-run
-- ============================================================

-- ─── student_profiles: Section 1 additions ──────────────────
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS minority_status      BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS annual_family_income VARCHAR(50);

-- ─── student_profiles: Section 2 – Academic Background ──────
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS board_12th       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS stream_12th      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS percentage_12th  DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS pcm_percentage   DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS pcb_percentage   DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS is_drop_year     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS num_attempts     INTEGER DEFAULT 1;

-- stream_12th constraint
DO $$ BEGIN
  ALTER TABLE student_profiles
    ADD CONSTRAINT student_profiles_stream_12th_check
    CHECK (stream_12th IN ('PCM','PCB','PCMB','Commerce','Arts','Other'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── student_profiles: Section 4 – Domain Preferences ───────
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS domains_of_interest JSONB DEFAULT '[]'::jsonb;

-- ─── student_profiles: Section 5 – Course Preferences ───────
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS preferred_degree_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS preferred_branches    JSONB DEFAULT '[]'::jsonb;
  -- JSONB structure: [{"rank":1,"name":"CSE"},{"rank":2,"name":"IT"}]

-- ─── student_profiles: Section 6 – Location Preferences ─────
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS preferred_states             JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preferred_cities             TEXT,
  ADD COLUMN IF NOT EXISTS only_government_colleges     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS private_allowed              BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deemed_universities_allowed  BOOLEAN DEFAULT TRUE;

-- ─── student_documents table ─────────────────────────────────
-- Tracks files uploaded to Supabase Storage bucket: student-documents
-- NOTE: Create the Storage bucket manually in Supabase Dashboard
--       Dashboard → Storage → New Bucket → "student-documents" (Private)
CREATE TABLE IF NOT EXISTS student_documents (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID         NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tenant_id    UUID         NOT NULL REFERENCES admins(id)   ON DELETE CASCADE,
  doc_type     VARCHAR(50)  NOT NULL,
  file_name    VARCHAR(255) NOT NULL,
  file_path    TEXT         NOT NULL,
  file_size    INTEGER,
  uploaded_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for fast student lookup
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id
  ON student_documents(student_id);

CREATE INDEX IF NOT EXISTS idx_student_documents_tenant_id
  ON student_documents(tenant_id);

-- RLS (backup layer — app enforces tenant isolation)
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFY
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'student_profiles' ORDER BY ordinal_position;
-- SELECT * FROM student_documents LIMIT 5;
-- ============================================================

-- ============================================================
-- MIGRATION: v1.11.0 — Add PCM+PCB stream & autonomous_allowed
-- Purpose : Expand stream_12th CHECK constraint to include
--           'PCM+PCB' (student took both Math and Biology);
--           add autonomous_allowed toggle to student_profiles.
-- Run ONCE in Supabase SQL Editor
-- Idempotent: safe to re-run
-- ============================================================

-- ─── 1. Drop the old stream_12th CHECK constraint ────────────
ALTER TABLE student_profiles
  DROP CONSTRAINT IF EXISTS student_profiles_stream_12th_check;

-- ─── 2. Recreate with PCM+PCB added ─────────────────────────
ALTER TABLE student_profiles
  ADD CONSTRAINT student_profiles_stream_12th_check
  CHECK (stream_12th IN ('PCM', 'PCB', 'PCMB', 'PCM+PCB', 'Commerce', 'Arts', 'Other'));

-- ─── 3. Add autonomous_allowed column ────────────────────────
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS autonomous_allowed BOOLEAN DEFAULT TRUE;

-- ============================================================
-- VERIFY
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'student_profiles'
-- AND column_name IN ('stream_12th', 'autonomous_allowed');
-- ============================================================

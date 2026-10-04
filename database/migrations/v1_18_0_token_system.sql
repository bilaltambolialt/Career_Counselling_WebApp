-- ============================================================
-- Migration v1.18.0 — Token System for Tenant Student Limits
-- Each token allows 1 student to be created.
-- Super admin allocates tokens; admin consumes 1 per student add.
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS tokens_allocated  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_used       INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- VERIFY
-- SELECT id, name, tokens_allocated, tokens_used,
--        (tokens_allocated - tokens_used) AS tokens_remaining
-- FROM admins ORDER BY created_at DESC LIMIT 10;
-- ============================================================

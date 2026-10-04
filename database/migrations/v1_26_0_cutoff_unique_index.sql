-- v1.26.0 — Deduplicate cutoff_data and enforce uniqueness at DB level
-- Prevents the same cutoff entry being inserted more than once (CSV re-upload, form re-submit).
-- Run this in Supabase SQL Editor BEFORE deploying the backend changes.

-- Step 1: Remove duplicate rows keeping the oldest entry (created_at ASC).
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY
        college_id, branch_id, year, round, category, exam_type,
        COALESCE(city,                    '__NULL__'),
        COALESCE(cutoff_percentile::text, '__NULL__'),
        COALESCE(cutoff_rank::text,       '__NULL__'),
        COALESCE(cutoff_score::text,      '__NULL__'),
        COALESCE(dte_code,                '__NULL__'),
        COALESCE(course_code,             '__NULL__')
      ORDER BY created_at ASC
    ) AS rn
  FROM cutoff_data
)
DELETE FROM cutoff_data
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Step 2: Unique index — NULLS NOT DISTINCT treats NULL = NULL for uniqueness purposes.
-- Requires PostgreSQL 15+ (Supabase uses PG15).
CREATE UNIQUE INDEX IF NOT EXISTS idx_cutoff_data_no_duplicates
ON cutoff_data (
  college_id, branch_id, year, round, category, exam_type,
  city, cutoff_percentile, cutoff_rank, cutoff_score, dte_code, course_code
) NULLS NOT DISTINCT;

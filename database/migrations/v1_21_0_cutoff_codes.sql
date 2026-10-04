-- v1_21_0 : Add dte_code and course_code to cutoff_data
-- Run in Supabase SQL Editor

ALTER TABLE cutoff_data
  ADD COLUMN IF NOT EXISTS dte_code    VARCHAR(50),
  ADD COLUMN IF NOT EXISTS course_code VARCHAR(50);

-- Optional indexes for lookups by code
CREATE INDEX IF NOT EXISTS idx_cutoff_dte_code    ON cutoff_data(dte_code)    WHERE dte_code    IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cutoff_course_code ON cutoff_data(course_code) WHERE course_code IS NOT NULL;

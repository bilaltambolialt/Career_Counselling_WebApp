  -- ============================================================
  -- MIGRATION: v1.2.0 — Fix Category Constraint (General → OPEN)
  -- Project: College Admission Prediction & Notification WebApp
  -- Date: 2026-02-25
  -- Description:
  --   1. Rename 'General' → 'OPEN' in students.valid_category constraint
  --   2. Make students.category nullable (it's optional on creation)
  --   3. Rename 'General' → 'OPEN' in cutoff_data.valid_cutoff_category
  -- ============================================================

  -- ============================================================
  -- 1. Fix students.category
  -- ============================================================

  -- Drop the old constraint
  ALTER TABLE students
    DROP CONSTRAINT IF EXISTS valid_category;

  -- Make category nullable (admin may not know category at creation time)
  ALTER TABLE students
    ALTER COLUMN category DROP NOT NULL;

  -- Re-add constraint with 'OPEN' instead of 'General'
  ALTER TABLE students
    ADD CONSTRAINT valid_category
    CHECK (category IS NULL OR category IN ('OPEN', 'OBC', 'SC', 'ST', 'EWS','VJ', 'NT', 'SEBC'));

  COMMENT ON COLUMN students.category IS 'Admission category: OPEN, OBC, SC, ST, EWS, VJ, NT, SEBC';

  -- ============================================================
  -- 2. Fix cutoff_data.category
  -- ============================================================

  -- Drop the old constraint
  ALTER TABLE cutoff_data
    DROP CONSTRAINT IF EXISTS valid_cutoff_category;

  -- Re-add constraint with 'OPEN' instead of 'General'
  ALTER TABLE cutoff_data
    ADD CONSTRAINT valid_cutoff_category
    CHECK (category IN ('OPEN', 'OBC', 'SC', 'ST', 'EWS','VJ', 'NT', 'SEBC'));

  COMMENT ON COLUMN cutoff_data.category IS 'Admission category: OPEN, OBC, SC, ST, EWS, VJ, NT, SEBC';

  -- ============================================================
  -- END OF MIGRATION v1.2.0
  -- ============================================================

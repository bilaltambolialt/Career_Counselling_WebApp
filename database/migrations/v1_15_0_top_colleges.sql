-- ============================================================
-- v1.15.0 — Top College Lists
-- Platform-wide curated list of top colleges per field+program.
-- Managed by Super Admin only. Used by counselors for comparison.
-- ============================================================

CREATE TABLE IF NOT EXISTS top_colleges (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  field            VARCHAR(100)  NOT NULL,   -- e.g. Engineering, Medical, Law
  program          VARCHAR(150)  NOT NULL,   -- e.g. Computer Science, MBBS, LLB
  college_name     VARCHAR(300)  NOT NULL,
  rank             INTEGER,                  -- rank within this field+program (optional)
  location_city    VARCHAR(100),
  location_state   VARCHAR(100),
  college_type     VARCHAR(50),              -- Government | Private | Deemed | Autonomous
  affiliation      VARCHAR(200),             -- IIT, NIT, AIIMS, deemed university name, etc.
  annual_fees      NUMERIC(12, 2),           -- approximate annual fees in INR
  notable_features TEXT,                     -- short description / USP
  created_by       UUID          REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE top_colleges IS 'Platform-wide curated top college list per field and program, managed by Super Admin.';
COMMENT ON COLUMN top_colleges.field   IS 'Broad domain: Engineering, Medical, Law, Management, etc.';
COMMENT ON COLUMN top_colleges.program IS 'Specific program: B.Tech (CS), MBBS, LLB, MBA, BDS, etc.';
COMMENT ON COLUMN top_colleges.rank    IS 'Rank within the field+program combination. Lower = better.';

-- Fast lookups by field / program
CREATE INDEX IF NOT EXISTS idx_top_colleges_field_program
  ON top_colleges (field, program, rank NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_top_colleges_state
  ON top_colleges (location_state);

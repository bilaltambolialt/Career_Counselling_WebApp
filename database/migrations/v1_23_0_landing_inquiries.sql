-- v1.23.0 — Landing page inquiry submissions
-- Run this in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS landing_inquiries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  qualification VARCHAR(200),
  concern       VARCHAR(100),
  concern_detail TEXT,
  status        VARCHAR(50) NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'contacted', 'closed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landing_inquiries_created ON landing_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_inquiries_status  ON landing_inquiries(status);

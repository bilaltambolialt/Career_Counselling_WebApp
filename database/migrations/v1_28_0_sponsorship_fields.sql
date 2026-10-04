-- v1.28.0 — Sponsorship amount and duration fields on top_colleges

ALTER TABLE top_colleges
  ADD COLUMN IF NOT EXISTS sponsorship_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS sponsored_from     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sponsored_until    TIMESTAMPTZ;

COMMENT ON COLUMN top_colleges.sponsorship_amount IS 'Amount paid by the college for sponsorship (₹)';
COMMENT ON COLUMN top_colleges.sponsored_from     IS 'Timestamp when sponsorship started';
COMMENT ON COLUMN top_colleges.sponsored_until    IS 'Timestamp when sponsorship expires; NULL = no expiry';

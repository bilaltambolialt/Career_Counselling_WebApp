-- v1.29.0 — Add parent mobile and college fee range to student_profiles

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS parent_mobile     VARCHAR(15),
  ADD COLUMN IF NOT EXISTS college_fee_range VARCHAR(50);

COMMENT ON COLUMN student_profiles.parent_mobile     IS 'Parent / guardian mobile number';
COMMENT ON COLUMN student_profiles.college_fee_range IS 'Preferred college annual fee budget range';

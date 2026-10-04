-- v1.13.0 — predictions_enabled toggle per student
-- Counselors can enable/disable the Recommendations page for each assigned student.
-- Default FALSE so students don't see predictions until counselor explicitly enables it.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS predictions_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN students.predictions_enabled IS
  'When TRUE the student can view and generate college recommendations. Toggled by their assigned counselor.';

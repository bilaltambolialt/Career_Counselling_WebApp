-- ═══════════════════════════════════════════════════════════════════════════
-- Migration v1.7.0 — Add ON DELETE CASCADE to predictions.exam_score_id FK
--
-- Problem: predictions.exam_score_id REFERENCES student_exam_scores(id)
--          with NO cascade rule. Deleting an exam score that has linked
--          predictions fails with a FK violation (500 error).
--
-- Fix: Drop the old FK and re-add it with ON DELETE CASCADE so that
--      deleting an exam score automatically removes its linked predictions.
--
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE predictions
  DROP CONSTRAINT IF EXISTS predictions_exam_score_id_fkey;

ALTER TABLE predictions
  ADD CONSTRAINT predictions_exam_score_id_fkey
    FOREIGN KEY (exam_score_id)
    REFERENCES student_exam_scores(id)
    ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification query
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT conname, confdeltype
-- FROM pg_constraint
-- WHERE conname = 'predictions_exam_score_id_fkey';
-- Expected: confdeltype = 'c'  (c = CASCADE)
-- ═══════════════════════════════════════════════════════════════════════════

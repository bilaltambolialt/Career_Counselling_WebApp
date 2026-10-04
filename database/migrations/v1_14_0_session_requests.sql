-- ============================================================
-- v1.14.0 — Session Requests
-- Students can request a counseling session from their assigned counselor.
-- The counselor can accept (creates a real session) or decline.
-- ============================================================

CREATE TABLE IF NOT EXISTS session_requests (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID         NOT NULL REFERENCES admins(id)     ON DELETE CASCADE,
  student_id   UUID         NOT NULL REFERENCES students(id)   ON DELETE CASCADE,
  counselor_id UUID         NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  message      TEXT,
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE session_requests IS 'Student-initiated requests for a counseling session. Counselor can accept (creates counseling_session) or decline.';
COMMENT ON COLUMN session_requests.message IS 'Optional note from the student explaining what they need help with.';
COMMENT ON COLUMN session_requests.status  IS 'pending | accepted | declined';

-- Index for counselor inbox lookup
CREATE INDEX IF NOT EXISTS idx_session_requests_counselor_status
  ON session_requests (counselor_id, status, created_at DESC);

-- Index for student status check
CREATE INDEX IF NOT EXISTS idx_session_requests_student
  ON session_requests (student_id, created_at DESC);

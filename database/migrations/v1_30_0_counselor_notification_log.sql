-- v1.30.0 — Counselor notification sent log
-- One row per send action (not per recipient) — used for sent history view

CREATE TABLE IF NOT EXISTS counselor_notification_log (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id   UUID         NOT NULL,
  tenant_id      UUID         NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  recipient_type VARCHAR(20)  NOT NULL,    -- 'student' | 'all_my_students'
  student_name   VARCHAR(255),             -- set when recipient_type = 'student'
  title          TEXT         NOT NULL,
  message        TEXT         NOT NULL,
  link           TEXT,
  recipient_count INT          NOT NULL DEFAULT 1,
  sent_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cnl_counselor_id ON counselor_notification_log(counselor_id);
CREATE INDEX IF NOT EXISTS idx_cnl_tenant_id    ON counselor_notification_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cnl_sent_at      ON counselor_notification_log(sent_at DESC);

-- Migration v1.10.0 — Notifications Engine
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notifications (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  recipient_id     UUID        NOT NULL,
  recipient_role   VARCHAR(20) NOT NULL CHECK (recipient_role IN ('student', 'counselor', 'admin')),
  type             VARCHAR(50) NOT NULL,
  -- type values: 'welcome', 'counselor_assigned', 'predictions_ready', 'cutoff_updated', 'admin_message'
  title            VARCHAR(200) NOT NULL,
  message          TEXT         NOT NULL,
  link             VARCHAR(500),          -- optional front-end route to navigate on click
  is_read          BOOLEAN      NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for fast per-recipient queries (unread first)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON notifications (recipient_id, tenant_id, is_read, created_at DESC);

-- Index for admin "sent" list queries
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_created
  ON notifications (tenant_id, created_at DESC);

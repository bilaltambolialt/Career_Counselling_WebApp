-- ============================================================
-- Migration v1.19.0 — Allow super_admin as notifications recipient
-- Also adds token_request to the type CHECK constraint
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop old recipient_role CHECK (PostgreSQL auto-names inline constraints)
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_recipient_role_check;

-- Re-add with super_admin included
ALTER TABLE notifications
  ADD CONSTRAINT notifications_recipient_role_check
    CHECK (recipient_role IN ('student', 'counselor', 'admin', 'super_admin'));

-- Drop old type CHECK if it exists and re-add with token_request included
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'welcome', 'counselor_assigned', 'predictions_ready', 'cutoff_updated',
      'admin_message', 'session_scheduled', 'session_cancelled',
      'session_request', 'session_declined', 'token_request'
    ));

-- Index for super admin notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_superadmin
  ON notifications(recipient_role, is_read, created_at DESC)
  WHERE recipient_role = 'super_admin';

-- ============================================================
-- VERIFY
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_schema = 'public'
--   AND constraint_name LIKE 'notifications_%';
-- ============================================================

-- ============================================================
-- SEED: 01 — Initial Super Admin
-- Run ONCE after both migrations have been applied
-- ============================================================
-- DEFAULT CREDENTIALS:
--   Email:    superadmin@gmail.com
--   Password: pass@123
--
-- To use your own password, generate a new hash with:
--   cd backend
--   node --input-type=module -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash('YourPassword', 12))"
--   Then replace the password_hash value below.
-- ============================================================

-- Remove any existing super admins first
DELETE FROM super_admins;

-- Insert new super admin
INSERT INTO super_admins (name, email, password_hash, is_active)
VALUES (
  'Platform Super Admin',
  'superadmin@gmail.com',
  '$2a$12$BllBF5RQ07jltywsJ0rMBu6Le9UAU/zjTUp0zMPjmUJLzgK1F5i6m',
  true
);

-- ============================================================
-- VERIFY (run this after to confirm):
-- SELECT id, name, email, is_active, created_at FROM super_admins;
-- ============================================================

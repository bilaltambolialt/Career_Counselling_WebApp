-- ============================================================
-- SEED: 03 — Initial Admin (Tenant)
-- Run ONCE after both migrations and super admin seed are done
-- ============================================================
-- DEFAULT CREDENTIALS (CHANGE AFTER FIRST LOGIN):
--   Email:    admin@demo.com
--   Password: Admin@123456
--   Login at: /login/admin
--
-- To use your own password, generate a new hash with:
--   cd backend
--   node --input-type=module -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash('YourPassword', 12))"
--   Then replace the password_hash value below.
-- ============================================================

INSERT INTO admins (
  name,
  email,
  password_hash,
  organization_name,
  phone,
  city,
  state,
  is_active,
  subscription_plan
)
VALUES (
  'Demo Admin',
  'admin@demo.com',
  '$2a$12$2v0CCS2vKID1gxtZJOEbK.Sr5OHDlYhNSOctg9VvOPP7euu/NolEK',
  'Demo Institution',
  '9000000001',
  'Pune',
  'Maharashtra',
  true,
  'pro'
)
ON CONFLICT (email) DO UPDATE
  SET password_hash     = EXCLUDED.password_hash,
      organization_name = EXCLUDED.organization_name,
      is_active         = true;

-- ============================================================
-- VERIFY (run this after to confirm):
-- SELECT id, name, email, organization_name, is_active FROM admins;
-- ============================================================

-- v1.27.0 — Password reset tokens table
-- Stores short-lived tokens for the forgot-password flow.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) NOT NULL,
  role       VARCHAR(50)  NOT NULL
    CHECK (role IN ('student', 'counselor', 'admin', 'super_admin')),
  token      VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ  NOT NULL,
  used       BOOLEAN      NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_token    ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_email    ON password_reset_tokens(email, role);

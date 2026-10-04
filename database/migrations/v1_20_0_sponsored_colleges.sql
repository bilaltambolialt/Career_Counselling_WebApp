-- v1_20_0 : Sponsored Colleges + Atomic Token Consume RPC
-- Run in Supabase SQL Editor

-- 1. Add is_sponsored column to top_colleges
ALTER TABLE top_colleges
  ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_top_colleges_sponsored
  ON top_colleges(is_sponsored, field, program)
  WHERE is_sponsored = TRUE;

-- 2. Atomic token consume function
--    Returns 'OK' if token was consumed, 'INSUFFICIENT_TOKENS' if balance is zero.
--    Runs as SECURITY DEFINER so the service_role key can call it.
CREATE OR REPLACE FUNCTION consume_token(p_admin_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admins
  SET tokens_used = tokens_used + 1
  WHERE id          = p_admin_id
    AND tokens_used < tokens_allocated;

  IF NOT FOUND THEN
    RETURN 'INSUFFICIENT_TOKENS';
  END IF;

  RETURN 'OK';
END;
$$;

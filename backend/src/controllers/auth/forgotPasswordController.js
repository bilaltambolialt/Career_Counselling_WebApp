import crypto from 'crypto';
import supabase from '../../config/supabase.js';
import { hashPassword } from '../../utils/passwordUtils.js';
import { sendPasswordResetEmail } from '../../utils/emailUtils.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

// Ordered by most common role first for faster lookup
const ROLE_LOOKUP = [
  { role: 'student',     table: 'students' },
  { role: 'counselor',   table: 'counselors' },
  { role: 'admin',       table: 'admins' },
  { role: 'super_admin', table: 'super_admins' },
];

const TOKEN_EXPIRY_MINUTES = 60;

// Finds which table the email belongs to and returns { user, role } or null
async function findUserByEmail(email) {
  for (const { role, table } of ROLE_LOOKUP) {
    const { data: user } = await supabase
      .from(table)
      .select('id, email, name')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle();
    if (user) return { user, role };
  }
  return null;
}

// POST /api/v1/auth/forgot-password
// Role is auto-detected from email — no role param needed from client.
// Always returns 200 — never reveals whether an email exists (security).
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 'Email is required', 400);
  }

  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const found = await findUserByEmail(normalizedEmail);

    if (found) {
      const { user, role } = found;

      // Invalidate any existing unused tokens for this email
      await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('email', normalizedEmail)
        .eq('used', false);

      const token     = crypto.randomBytes(48).toString('hex');
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

      await supabase.from('password_reset_tokens').insert({
        email:      normalizedEmail,
        role,
        token,
        expires_at: expiresAt,
      });

      const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

      // Fire-and-forget — don't let email failure block the response
      sendPasswordResetEmail({ to: user.email, resetUrl, role }).catch((err) => {
        console.error('[forgotPassword] Email send failed:', err.message);
      });
    }

    // Always return the same message regardless of whether email was found
    return sendSuccess(res, null, 'If that email is registered, a reset link has been sent.');
  } catch (err) {
    console.error('[forgotPassword Error]', err);
    return sendError(res, 'Failed to process request', 500, err.message);
  }
};

// POST /api/v1/auth/reset-password
export const resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return sendError(res, 'Token, newPassword, and confirmPassword are required', 400);
  }
  if (newPassword !== confirmPassword) {
    return sendError(res, 'Passwords do not match', 400);
  }
  if (newPassword.length < 8) {
    return sendError(res, 'Password must be at least 8 characters', 400);
  }

  try {
    // Fetch token record
    const { data: record } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .maybeSingle();

    if (!record) {
      return sendError(res, 'Invalid or expired reset link.', 400);
    }
    if (new Date(record.expires_at) < new Date()) {
      return sendError(res, 'This reset link has expired. Please request a new one.', 400);
    }

    const table    = ROLE_TABLES[record.role];
    const newHash  = await hashPassword(newPassword);

    // Update password
    const { error: updateErr } = await supabase
      .from(table)
      .update({ password_hash: newHash })
      .eq('email', record.email);

    if (updateErr) {
      return sendError(res, 'Failed to update password', 500, updateErr.message);
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', record.id);

    return sendSuccess(res, null, 'Password reset successfully. You can now log in.');
  } catch (err) {
    console.error('[resetPassword Error]', err);
    return sendError(res, 'Failed to reset password', 500, err.message);
  }
};

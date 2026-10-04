import supabase from '../../config/supabase.js';
import { signToken } from '../../config/jwt.js';
import { comparePassword, hashPassword } from '../../utils/passwordUtils.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

// Maps role string → Supabase table name
const ROLE_TABLES = {
  super_admin: 'super_admins',
  admin: 'admins',
  counselor: 'counselors',
  student: 'students',
};

// Columns to select per role (exclude password_hash from return)
const SAFE_COLUMNS = {
  super_admin: 'id, name, email, is_active, created_at',
  admin: 'id, name, email, organization_name, phone, city, state, is_active, subscription_plan, created_at',
  counselor: 'id, name, email, phone, specialization, is_active, tenant_id, must_change_password, created_at',
  student: 'id, name, email, phone, category, is_active, tenant_id, assigned_counselor_id, must_change_password, created_at',
};

const resolveTenantId = (user, role) => {
  if (role === 'admin') return user.id;
  if (role === 'super_admin') return null;
  return user.tenant_id;
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return sendError(res, 'Email, password, and role are required', 400);
    }
    const validRoles = Object.keys(ROLE_TABLES);
    if (!validRoles.includes(role)) {
      return sendError(res, 'Invalid role specified', 400);
    }
    const table = ROLE_TABLES[role];
    const { data: user, error } = await supabase
      .from(table)
      .select('*, password_hash')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    if (error) {
      console.error('[Login Error] Supabase query failed for role=' + role + ', table=' + table + ':', error.message);
      return sendError(res, 'Database error: ' + error.message, 500, error.message);
    }
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }
    if (!user.is_active) {
      return sendError(res, 'Your account has been deactivated. Please contact your administrator.', 403);
    }
    if (!user.password_hash) {
      return sendError(res, 'Account not fully configured. Contact your administrator.', 401);
    }
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid credentials', 401);
    }
    const tenantId = resolveTenantId(user, role);
    const token = signToken({ userId: user.id, role, tenantId, email: user.email });
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      tenantId,
      isActive: user.is_active,
      ...(user.organization_name && { organizationName: user.organization_name }),
      ...(user.must_change_password !== undefined && { mustChangePassword: user.must_change_password }),
    };
    return sendSuccess(res, { token, user: safeUser }, 'Login successful');
  } catch (err) {
    console.error('[Login Error] Unexpected error:', err);
    return sendError(res, 'Login failed due to a server error', 500, err.message);
  }
};

export const getMe = async (req, res) => {
  try {
    const { userId, role, tenantId } = req.user;
    const table = ROLE_TABLES[role];
    const columns = SAFE_COLUMNS[role];
    const { data: user, error } = await supabase
      .from(table)
      .select(columns)
      .eq('id', userId)
      .maybeSingle();
    if (error || !user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, { ...user, role, tenantId }, 'User retrieved');
  } catch (err) {
    console.error('[GetMe Error]', err);
    return sendError(res, 'Failed to fetch user', 500, err.message);
  }
};

export const logout = (_req, res) => {
  return sendSuccess(res, null, 'Logged out successfully');
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const { userId, role } = req.user;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return sendError(res, 'All password fields are required', 400);
    }
    if (newPassword !== confirmPassword) {
      return sendError(res, 'New passwords do not match', 400);
    }
    if (newPassword.length < 8) {
      return sendError(res, 'Password must be at least 8 characters', 400);
    }
    if (newPassword === currentPassword) {
      return sendError(res, 'New password must differ from current password', 400);
    }
    const table = ROLE_TABLES[role];
    const { data: user, error: fetchError } = await supabase
      .from(table)
      .select('password_hash')
      .eq('id', userId)
      .maybeSingle();
    if (fetchError) {
      console.error('[ChangePassword] Fetch error:', fetchError.message);
      return sendError(res, 'Database error while fetching user', 500, fetchError.message);
    }
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    if (!user.password_hash) {
      return sendError(res, 'Account has no password set. Contact your administrator.', 400);
    }
    const isValid = await comparePassword(currentPassword, user.password_hash);
    if (!isValid) {
      // Use 422 (not 401) — 401 would trigger the client-side "log out" interceptor
      return sendError(res, 'Current password is incorrect', 422);
    }
    const newHash = await hashPassword(newPassword);

    // Step 1: Update password hash (always)
    const { error: hashUpdateError } = await supabase
      .from(table)
      .update({ password_hash: newHash })
      .eq('id', userId);
    if (hashUpdateError) {
      console.error('[ChangePassword] Hash update error:', hashUpdateError.message);
      return sendError(res, 'Password update failed: ' + hashUpdateError.message, 500, hashUpdateError.message);
    }

    // Step 2: Clear must_change_password flag (best-effort — column may not exist on all roles)
    if (role === 'student' || role === 'counselor') {
      const { error: flagError } = await supabase
        .from(table)
        .update({ must_change_password: false })
        .eq('id', userId);
      if (flagError) {
        // Log but don't fail — password IS changed; client clears flag locally
        console.warn('[ChangePassword] Could not clear must_change_password:', flagError.message);
      }
    }

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (err) {
    console.error('[ChangePassword Error]', err);
    return sendError(res, 'Password change failed: ' + err.message, 500, err.message);
  }
};

import supabase from '../../config/supabase.js';
import { hashPassword } from '../../utils/passwordUtils.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/responseUtils.js';

const SAFE_COUNSELOR_COLS =
  'id, name, email, phone, specialization, is_active, must_change_password, tenant_id, created_by, created_at, updated_at';

export const listCounselors = async (req, res) => {
  const { tenantId } = req.user;
  const { page = 1, limit = 20, search, active } = req.query;
  try {
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * pageSize;
    let query = supabase.from('counselors').select(SAFE_COUNSELOR_COLS, { count: 'exact' })
      .eq('tenant_id', tenantId).order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);
    if (search?.trim()) query = query.or('name.ilike.%' + search.trim() + '%,email.ilike.%' + search.trim() + '%');
    if (active !== undefined) query = query.eq('is_active', active === 'true');
    const { data, count, error } = await query;
    if (error) return sendError(res, 'Failed to fetch counselors', 500, error.message);
    const counselorsWithCount = await Promise.all(
      (data ?? []).map(async (c) => {
        const { count: studentCount } = await supabase.from('students')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_counselor_id', c.id).eq('tenant_id', tenantId).eq('is_active', true);
        return { ...c, student_count: studentCount ?? 0 };
      })
    );
    const meta = { page: pageNum, totalPages: Math.ceil((count ?? 0) / pageSize), total: count ?? 0 };
    return sendSuccess(res, counselorsWithCount, 'Counselors fetched', 200, meta);
  } catch (err) {
    console.error('[listCounselors Error]', err);
    return sendError(res, 'Failed to fetch counselors', 500, err.message);
  }
};

export const createCounselor = async (req, res) => {
  const { tenantId, userId } = req.user;
  const { name, fullName, email, phone, specialization, password } = req.body;
  const counselorName = name || fullName;
  if (!counselorName || !email || !password) return sendError(res, 'name, email and password are required', 400);
  if (password.length < 8) return sendError(res, 'Password must be at least 8 characters', 400);
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const { data: existing } = await supabase.from('counselors').select('id')
      .eq('email', normalizedEmail).eq('tenant_id', tenantId).maybeSingle();
    if (existing) return sendError(res, 'A counselor with this email already exists in your institution', 409);
    const passwordHash = await hashPassword(password);
    const { data, error } = await supabase.from('counselors').insert({
      name: counselorName.trim(), email: normalizedEmail, phone: phone?.trim() || null,
      specialization: specialization?.trim() || null, password_hash: passwordHash,
      tenant_id: tenantId, created_by: userId, must_change_password: true, is_active: true,
    }).select(SAFE_COUNSELOR_COLS).single();
    if (error) return sendError(res, 'Failed to create counselor', 500, error.message);
    return sendCreated(res, data, 'Counselor created successfully');
  } catch (err) {
    console.error('[createCounselor Error]', err);
    return sendError(res, 'Failed to create counselor', 500, err.message);
  }
};

export const getCounselor = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from('counselors').select(SAFE_COUNSELOR_COLS)
      .eq('id', id).eq('tenant_id', tenantId).maybeSingle();
    if (error) return sendError(res, 'Failed to fetch counselor', 500, error.message);
    if (!data) return sendError(res, 'Counselor not found', 404);
    const { data: students } = await supabase.from('students')
      .select('id, name, email, category, is_active').eq('assigned_counselor_id', id)
      .eq('tenant_id', tenantId).eq('is_active', true).order('name');
    return sendSuccess(res, { ...data, assignedStudents: students ?? [] });
  } catch (err) {
    console.error('[getCounselor Error]', err);
    return sendError(res, 'Failed to fetch counselor', 500, err.message);
  }
};

export const updateCounselor = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { name, fullName, phone, specialization, isActive } = req.body;
  try {
    const { data: existing } = await supabase.from('counselors').select('id')
      .eq('id', id).eq('tenant_id', tenantId).maybeSingle();
    if (!existing) return sendError(res, 'Counselor not found', 404);
    const updates = {};
    const resolvedName = name || fullName;
    if (resolvedName   !== undefined) updates.name           = resolvedName.trim();
    if (phone          !== undefined) updates.phone          = phone?.trim() || null;
    if (specialization !== undefined) updates.specialization = specialization?.trim() || null;
    if (isActive       !== undefined) updates.is_active      = isActive;
    const { data, error } = await supabase.from('counselors').update(updates)
      .eq('id', id).eq('tenant_id', tenantId).select(SAFE_COUNSELOR_COLS).single();
    if (error) return sendError(res, 'Failed to update counselor', 500, error.message);
    return sendSuccess(res, data, 'Counselor updated');
  } catch (err) {
    console.error('[updateCounselor Error]', err);
    return sendError(res, 'Failed to update counselor', 500, err.message);
  }
};

export const deactivateCounselor = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  try {
    const { data: counselor } = await supabase.from('counselors').select('id, name')
      .eq('id', id).eq('tenant_id', tenantId).maybeSingle();
    if (!counselor) return sendError(res, 'Counselor not found', 404);
    await supabase.from('students').update({ assigned_counselor_id: null })
      .eq('assigned_counselor_id', id).eq('tenant_id', tenantId);
    const { error } = await supabase.from('counselors').update({ is_active: false })
      .eq('id', id).eq('tenant_id', tenantId);
    if (error) return sendError(res, 'Failed to deactivate counselor', 500, error.message);
    return sendSuccess(res, null, 'Counselor deactivated and students unassigned');
  } catch (err) {
    console.error('[deactivateCounselor Error]', err);
    return sendError(res, 'Failed to deactivate counselor', 500, err.message);
  }
};

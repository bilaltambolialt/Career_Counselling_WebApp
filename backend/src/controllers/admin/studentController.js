import supabase from '../../config/supabase.js';
import { hashPassword } from '../../utils/passwordUtils.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/responseUtils.js';
import { createNotification } from '../../utils/notificationUtils.js';

const SAFE_STUDENT_COLS = `
  id, name, email, phone, category, is_active,
  must_change_password, created_at, updated_at,
  tenant_id, assigned_counselor_id, created_by, created_by_role,
  counselors:assigned_counselor_id(id, name, email)
`;

// ── GET /admin/students ──────────────────────────────────────
export const listStudents = async (req, res) => {
  const { tenantId } = req.user;
  const { page = 1, limit = 20, search, category, counselorId, active } = req.query;

  try {
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * pageSize;

    let query = supabase
      .from('students')
      .select(SAFE_STUDENT_COLS, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (search?.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }
    if (category)   query = query.eq('category', category);
    if (counselorId) query = query.eq('assigned_counselor_id', counselorId);
    if (active !== undefined) query = query.eq('is_active', active === 'true');

    const { data, count, error } = await query;
    if (error) return sendError(res, 'Failed to fetch students', 500, error.message);

    const meta = {
      page: pageNum,
      totalPages: Math.ceil((count ?? 0) / pageSize),
      total: count ?? 0,
    };

    return sendSuccess(res, data ?? [], 'Students fetched', 200, meta);
  } catch (err) {
    console.error('[listStudents Error]', err);
    return sendError(res, 'Failed to fetch students', 500, err.message);
  }
};

// ── POST /admin/students ─────────────────────────────────────
export const createStudent = async (req, res) => {
  const { tenantId, userId } = req.user;
  // Accept both 'name' and 'fullName' from the request body
  const { name, fullName, email, phone, category, password, counselorId, assignedCounselorId } = req.body;
  const studentName = name || fullName;

  if (!studentName || !email || !password) {
    return sendError(res, 'name, email and password are required', 400);
  }
  if (password.length < 8) {
    return sendError(res, 'Password must be at least 8 characters', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // ── Atomic token gate (consume_token RPC) ───────────────
    // Single UPDATE that checks balance AND consumes 1 token atomically.
    // Requires migration v1_20_0 (consume_token function + is_sponsored column).
    const { data: tokenResult, error: tokenErr } = await supabase
      .rpc('consume_token', { p_admin_id: tenantId });

    if (tokenErr) {
      return sendError(
        res,
        'Student creation is currently unavailable. Please contact the Super Admin.',
        503,
        tokenErr.message,
      );
    }
    if (tokenResult === 'INSUFFICIENT_TOKENS') {
      return sendError(
        res,
        'No tokens available. Please request more tokens from the Super Admin to add new students.',
        403,
        'INSUFFICIENT_TOKENS',
      );
    }
    // ────────────────────────────────────────────────────────

    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (existing) {
      return sendError(res, 'A student with this email already exists in your institution', 409);
    }

    const resolvedCounselorId = counselorId || assignedCounselorId || null;

    if (resolvedCounselorId) {
      const { data: counselor } = await supabase
        .from('counselors')
        .select('id')
        .eq('id', resolvedCounselorId)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .maybeSingle();

      if (!counselor) {
        return sendError(res, 'Counselor not found or does not belong to your institution', 404);
      }
    }

    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('students')
      .insert({
        name: studentName.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        category: category || null,
        password_hash: passwordHash,
        tenant_id: tenantId,
        assigned_counselor_id: resolvedCounselorId,
        created_by: userId,
        created_by_role: 'admin',
        must_change_password: true,
        is_active: true,
      })
      .select(SAFE_STUDENT_COLS)
      .single();

    if (error) return sendError(res, 'Failed to create student', 500, error.message);

    // Fire-and-forget welcome notification
    createNotification({
      tenantId,
      recipientId:   data.id,
      recipientRole: 'student',
      type:          'welcome',
      title:         'Welcome to the platform!',
      message:       'Your account has been created. Please complete your profile and add your exam scores to get personalised admission recommendations.',
      link:          '/student/profile',
    });

    return sendCreated(res, data, 'Student created successfully');
  } catch (err) {
    console.error('[createStudent Error]', err);
    return sendError(res, 'Failed to create student', 500, err.message);
  }
};

// ── GET /admin/students/:id ──────────────────────────────────
export const getStudent = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        ${SAFE_STUDENT_COLS},
        student_profiles(dob, gender, city, state, preferred_location, preferred_branch, exam_type, profile_complete)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) return sendError(res, 'Failed to fetch student', 500, error.message);
    if (!data)  return sendError(res, 'Student not found', 404);

    return sendSuccess(res, data);
  } catch (err) {
    console.error('[getStudent Error]', err);
    return sendError(res, 'Failed to fetch student', 500, err.message);
  }
};

// ── PATCH /admin/students/:id ────────────────────────────────
export const updateStudent = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { name, fullName, phone, category, isActive } = req.body;

  try {
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!existing) return sendError(res, 'Student not found', 404);

    const updates = {};
    const resolvedName = name || fullName;
    if (resolvedName !== undefined) updates.name = resolvedName.trim();
    if (phone    !== undefined) updates.phone    = phone?.trim() || null;
    if (category !== undefined) updates.category = category;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(SAFE_STUDENT_COLS)
      .single();

    if (error) return sendError(res, 'Failed to update student', 500, error.message);
    return sendSuccess(res, data, 'Student updated');
  } catch (err) {
    console.error('[updateStudent Error]', err);
    return sendError(res, 'Failed to update student', 500, err.message);
  }
};

// ── DELETE /admin/students/:id (soft delete) ─────────────────
export const deactivateStudent = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('students')
      .update({ is_active: false })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, name')
      .maybeSingle();

    if (error) return sendError(res, 'Failed to deactivate student', 500, error.message);
    if (!data)  return sendError(res, 'Student not found', 404);
    return sendSuccess(res, null, `Student "${data.name}" deactivated`);
  } catch (err) {
    console.error('[deactivateStudent Error]', err);
    return sendError(res, 'Failed to deactivate student', 500, err.message);
  }
};

// ── POST /admin/students/:id/assign-counselor ────────────────
export const assignCounselor = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { counselorId } = req.body;

  try {
    const { data: student } = await supabase
      .from('students')
      .select('id, name')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!student) return sendError(res, 'Student not found', 404);

    if (counselorId) {
      const { data: counselor } = await supabase
        .from('counselors')
        .select('id')
        .eq('id', counselorId)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .maybeSingle();

      if (!counselor) return sendError(res, 'Counselor not found', 404);
    }

    const { data, error } = await supabase
      .from('students')
      .update({ assigned_counselor_id: counselorId || null })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(SAFE_STUDENT_COLS)
      .single();

    if (error) return sendError(res, 'Failed to assign counselor', 500, error.message);

    // Notify the student (only when assigning, not unassigning)
    if (counselorId) {
      createNotification({
        tenantId,
        recipientId:   id,
        recipientRole: 'student',
        type:          'counselor_assigned',
        title:         'A counselor has been assigned to you',
        message:       'You now have a dedicated counselor to guide your admission journey. Reach out through your institution for support.',
        link:          '/student/dashboard',
      });
    }

    return sendSuccess(res, data, 'Counselor assigned successfully');
  } catch (err) {
    console.error('[assignCounselor Error]', err);
    return sendError(res, 'Failed to assign counselor', 500, err.message);
  }
};

import supabase from '../../config/supabase.js';
import { hashPassword } from '../../utils/passwordUtils.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/responseUtils.js';

const SAFE_ADMIN_COLS =
  'id, name, email, phone, organization_name, city, state, subscription_plan, is_active, tokens_allocated, tokens_used, created_at, updated_at';

const PAGE_SIZE = 20;

// GET /api/v1/superadmin/admins
export const listAdmins = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  try {
    const { data, count, error } = await supabase
      .from('admins')
      .select('id, name, email, phone, organization_name, is_active, tokens_allocated, tokens_used, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    // Attach per-tenant student + counselor counts
    const enriched = await Promise.all(
      (data ?? []).map(async (admin) => {
        const [stuRes, counRes] = await Promise.allSettled([
          supabase.from('students').select('id', { count: 'exact', head: true }).eq('tenant_id', admin.id),
          supabase.from('counselors').select('id', { count: 'exact', head: true }).eq('tenant_id', admin.id),
        ]);
        return {
          ...admin,
          studentCount:    stuRes.status  === 'fulfilled' ? (stuRes.value.count  ?? 0) : 0,
          counselorCount:  counRes.status === 'fulfilled' ? (counRes.value.count ?? 0) : 0,
          tokensRemaining: (admin.tokens_allocated ?? 0) - (admin.tokens_used ?? 0),
        };
      })
    );

    return sendSuccess(res, enriched, 'Admins fetched', 200, {
      page,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      total: count ?? 0,
    });
  } catch (err) {
    console.error('[listAdmins Error]', err);
    return sendError(res, 'Failed to fetch admins', 500, err.message);
  }
};

// POST /api/v1/superadmin/admins — create a new admin/tenant
export const createAdmin = async (req, res) => {
  const { userId } = req.user;
  const { name, email, organizationName, phone, city, state, subscriptionPlan, password } = req.body;

  if (!name || !email || !organizationName || !password) {
    return sendError(res, 'name, email, organizationName and password are required', 400);
  }
  if (password.length < 8) {
    return sendError(res, 'Password must be at least 8 characters', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { data: existing } = await supabase
      .from('admins').select('id').eq('email', normalizedEmail).maybeSingle();
    if (existing) return sendError(res, 'An admin with this email already exists', 409);

    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('admins')
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        organization_name: organizationName.trim(),
        phone: phone?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        subscription_plan: subscriptionPlan || 'basic',
        password_hash: passwordHash,
        is_active: true,
        created_by: userId,
      })
      .select(SAFE_ADMIN_COLS)
      .single();

    if (error) return sendError(res, 'Failed to create admin', 500, error.message);
    return sendCreated(res, data, 'Admin created successfully');
  } catch (err) {
    console.error('[createAdmin Error]', err);
    return sendError(res, 'Failed to create admin', 500, err.message);
  }
};

// GET /api/v1/superadmin/admins/:id — get single admin
export const getAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('admins').select(SAFE_ADMIN_COLS).eq('id', id).maybeSingle();
    if (error) return sendError(res, 'Failed to fetch admin', 500, error.message);
    if (!data)  return sendError(res, 'Admin not found', 404);
    return sendSuccess(res, data, 'Admin fetched');
  } catch (err) {
    console.error('[getAdmin Error]', err);
    return sendError(res, 'Failed to fetch admin', 500, err.message);
  }
};

// PATCH /api/v1/superadmin/admins/:id — update admin details
export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, organizationName, phone, city, state, subscriptionPlan, isActive } = req.body;

  try {
    const { data: existing } = await supabase
      .from('admins').select('id').eq('id', id).maybeSingle();
    if (!existing) return sendError(res, 'Admin not found', 404);

    const updates = {};
    if (name             !== undefined) updates.name              = name.trim();
    if (organizationName !== undefined) updates.organization_name = organizationName.trim();
    if (phone            !== undefined) updates.phone             = phone?.trim() || null;
    if (city             !== undefined) updates.city              = city?.trim() || null;
    if (state            !== undefined) updates.state             = state?.trim() || null;
    if (subscriptionPlan !== undefined) updates.subscription_plan = subscriptionPlan;
    if (isActive         !== undefined) updates.is_active         = isActive;

    const { data, error } = await supabase
      .from('admins').update(updates).eq('id', id).select(SAFE_ADMIN_COLS).single();
    if (error) return sendError(res, 'Failed to update admin', 500, error.message);
    return sendSuccess(res, data, 'Admin updated successfully');
  } catch (err) {
    console.error('[updateAdmin Error]', err);
    return sendError(res, 'Failed to update admin', 500, err.message);
  }
};

// PATCH /api/v1/superadmin/admins/:id/allocate-tokens
export const allocateTokens = async (req, res) => {
  const { id } = req.params;
  const { tokens } = req.body;

  if (tokens === undefined || tokens === null) {
    return sendError(res, 'tokens is required', 400);
  }
  const amount = parseInt(tokens);
  if (isNaN(amount) || amount < 1 || amount > 10000) {
    return sendError(res, 'tokens must be a number between 1 and 10000', 400);
  }

  try {
    const { data: admin, error: fetchErr } = await supabase
      .from('admins')
      .select('id, name, tokens_allocated, tokens_used')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!admin) return sendError(res, 'Admin not found', 404);

    const newAllocated = (admin.tokens_allocated ?? 0) + amount;

    const { data, error: updateErr } = await supabase
      .from('admins')
      .update({ tokens_allocated: newAllocated })
      .eq('id', id)
      .select('id, name, tokens_allocated, tokens_used')
      .single();

    if (updateErr) throw updateErr;

    return sendSuccess(res, {
      ...data,
      tokensRemaining: data.tokens_allocated - data.tokens_used,
    }, `${amount} token${amount !== 1 ? 's' : ''} allocated to ${admin.name}`);
  } catch (err) {
    console.error('[allocateTokens Error]', err);
    return sendError(res, 'Failed to allocate tokens', 500, err.message);
  }
};

// PATCH /api/v1/superadmin/admins/:id/toggle-active
export const toggleAdminActive = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: admin, error: fetchErr } = await supabase
      .from('admins')
      .select('id, name, is_active')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!admin) return sendError(res, 'Admin not found', 404);

    const newValue = !admin.is_active;
    const { error: updateErr } = await supabase
      .from('admins')
      .update({ is_active: newValue })
      .eq('id', id);

    if (updateErr) throw updateErr;

    return sendSuccess(
      res,
      { is_active: newValue },
      `Admin ${admin.name} ${newValue ? 'activated' : 'deactivated'} successfully`,
    );
  } catch (err) {
    console.error('[toggleAdminActive Error]', err);
    return sendError(res, 'Failed to toggle admin status', 500, err.message);
  }
};

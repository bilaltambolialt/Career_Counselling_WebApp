import supabase from '../../config/supabase.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/responseUtils.js';

const VALID_CATEGORIES = ['dream', 'target', 'safe'];
const MAX_PER_CATEGORY = 5;

// ── GET /api/v1/student/college-preferences ───────────────────
export const listCollegePreferences = async (req, res) => {
  const { userId, tenantId } = req.user;

  try {
    const { data, error } = await supabase
      .from('student_college_preferences')
      .select('id, college_id, college_name, college_location, category, added_at')
      .eq('student_id', userId)
      .eq('tenant_id', tenantId)
      .order('category')
      .order('added_at');

    if (error) return sendError(res, 'Failed to fetch college preferences', 500, error.message);
    return sendSuccess(res, data ?? [], 'College preferences fetched');
  } catch (err) {
    console.error('[listCollegePreferences Error]', err);
    return sendError(res, 'Failed to fetch college preferences', 500, err.message);
  }
};

// ── POST /api/v1/student/college-preferences ─────────────────
export const addCollegePreference = async (req, res) => {
  const { userId, tenantId } = req.user;
  const { college_id, category } = req.body;

  if (!college_id) return sendError(res, 'college_id is required', 400);
  if (!category)   return sendError(res, 'category is required', 400);
  if (!VALID_CATEGORIES.includes(category)) {
    return sendError(res, `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}`, 400);
  }

  try {
    // Verify college exists and get denormalised data
    const { data: college, error: collegeErr } = await supabase
      .from('colleges')
      .select('id, name, location, state')
      .eq('id', college_id)
      .maybeSingle();

    if (collegeErr) return sendError(res, 'Failed to verify college', 500, collegeErr.message);
    if (!college)   return sendError(res, 'College not found', 404);

    // Enforce per-category limit
    const { count, error: countErr } = await supabase
      .from('student_college_preferences')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', userId)
      .eq('tenant_id', tenantId)
      .eq('category', category);

    if (countErr) return sendError(res, 'Failed to check limit', 500, countErr.message);
    if ((count ?? 0) >= MAX_PER_CATEGORY) {
      return sendError(
        res,
        `Maximum ${MAX_PER_CATEGORY} colleges per category reached. Remove one to add another.`,
        400,
      );
    }

    // Build display location string
    const collegeLoc = [college.location, college.state].filter(Boolean).join(', ') || null;

    // Insert — unique constraint on (student_id, college_id) prevents duplicates
    const { data, error: insertErr } = await supabase
      .from('student_college_preferences')
      .insert({
        student_id:       userId,
        tenant_id:        tenantId,
        college_id:       college.id,
        college_name:     college.name,
        college_location: collegeLoc,
        category,
      })
      .select('id, college_id, college_name, college_location, category, added_at')
      .single();

    if (insertErr) {
      // Postgres unique violation
      if (insertErr.code === '23505') {
        return sendError(res, 'College already in your list', 409);
      }
      return sendError(res, 'Failed to add college', 500, insertErr.message);
    }

    return sendCreated(res, data, 'College added to preferences');
  } catch (err) {
    console.error('[addCollegePreference Error]', err);
    return sendError(res, 'Failed to add college preference', 500, err.message);
  }
};

// ── DELETE /api/v1/student/college-preferences/:id ───────────
export const removeCollegePreference = async (req, res) => {
  const { userId, tenantId } = req.user;
  const { id } = req.params;

  try {
    // Verify ownership
    const { data: pref, error: fetchErr } = await supabase
      .from('student_college_preferences')
      .select('id')
      .eq('id', id)
      .eq('student_id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchErr) return sendError(res, 'Failed to fetch preference', 500, fetchErr.message);
    if (!pref)    return sendError(res, 'College preference not found', 404);

    const { error: delErr } = await supabase
      .from('student_college_preferences')
      .delete()
      .eq('id', id)
      .eq('student_id', userId);

    if (delErr) return sendError(res, 'Failed to remove college', 500, delErr.message);

    return sendSuccess(res, null, 'College removed from preferences');
  } catch (err) {
    console.error('[removeCollegePreference Error]', err);
    return sendError(res, 'Failed to remove college preference', 500, err.message);
  }
};

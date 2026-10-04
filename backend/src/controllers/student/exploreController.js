import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

const now = () => new Date().toISOString();

// ── GET /api/v1/student/explore/colleges ──────────────────────────────────────
// Returns all top_colleges entries. Filtering/sorting done client-side.
// A college is treated as "effectively sponsored" only if is_sponsored=true
// AND sponsored_until IS NULL or sponsored_until > now.
export const listExploreColleges = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('top_colleges')
      .select('id, field, program, college_name, rank, location_city, location_state, college_type, affiliation, annual_fees, notable_features, is_sponsored, sponsored_until')
      .order('field')
      .order('program')
      .order('rank', { ascending: true, nullsFirst: false });

    if (error) throw error;

    // Mark expired sponsorships as not-sponsored for students
    const nowTs = now();
    const result = (data ?? []).map(c => ({
      ...c,
      is_sponsored: c.is_sponsored && (!c.sponsored_until || c.sponsored_until > nowTs),
    }));

    // Sort: active sponsored first
    result.sort((a, b) => (b.is_sponsored ? 1 : 0) - (a.is_sponsored ? 1 : 0));

    return sendSuccess(res, result, 'Colleges fetched');
  } catch (err) {
    console.error('[listExploreColleges] Error:', err);
    return sendError(res, 'Failed to fetch colleges', 500, err.message);
  }
};

// ── GET /api/v1/student/explore/sponsored ────────────────────────────────
// Returns ACTIVE sponsored colleges only (not expired).
// Used by PredictionsPage to show "Featured Partner Colleges" section.
export const listSponsoredColleges = async (req, res) => {
  const { field, program } = req.query;
  try {
    let query = supabase
      .from('top_colleges')
      .select('id, field, program, college_name, rank, location_city, location_state, college_type, affiliation, annual_fees, notable_features, dte_code, branch_code')
      .eq('is_sponsored', true)
      // Only return non-expired: sponsored_until IS NULL OR sponsored_until > now
      .or(`sponsored_until.is.null,sponsored_until.gt.${now()}`)
      .order('rank', { ascending: true, nullsFirst: false });

    if (field)   query = query.eq('field', field);
    if (program) query = query.ilike('program', `%${program}%`);

    const { data, error } = await query;
    if (error) throw error;
    return sendSuccess(res, data ?? [], 'Sponsored colleges fetched');
  } catch (err) {
    console.error('[listSponsoredColleges] Error:', err);
    return sendError(res, 'Failed to fetch sponsored colleges', 500, err.message);
  }
};

// ── GET /api/v1/student/explore/bookmarks ────────────────────────────────────
// Returns the set of top_college_ids bookmarked by this student.
export const listBookmarks = async (req, res) => {
  const { userId: studentId, tenantId } = req.user;

  try {
    const { data, error } = await supabase
      .from('student_college_bookmarks')
      .select('id, top_college_id, created_at')
      .eq('student_id', studentId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return sendSuccess(res, data ?? [], 'Bookmarks fetched');
  } catch (err) {
    console.error('[listBookmarks] Error:', err);
    return sendError(res, 'Failed to fetch bookmarks', 500, err.message);
  }
};

// ── POST /api/v1/student/explore/bookmarks ───────────────────────────────────
// Body: { top_college_id }
export const addBookmark = async (req, res) => {
  const { userId: studentId, tenantId } = req.user;
  const { top_college_id } = req.body;

  if (!top_college_id) {
    return sendError(res, 'top_college_id is required', 400);
  }

  // Verify the college exists
  const { data: college, error: colErr } = await supabase
    .from('top_colleges')
    .select('id')
    .eq('id', top_college_id)
    .single();

  if (colErr || !college) {
    return sendError(res, 'College not found', 404);
  }

  try {
    const { data, error } = await supabase
      .from('student_college_bookmarks')
      .insert({ student_id: studentId, tenant_id: tenantId, top_college_id })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return sendError(res, 'Already bookmarked', 409);
      }
      throw error;
    }
    return sendSuccess(res, data, 'Bookmarked', 201);
  } catch (err) {
    console.error('[addBookmark] Error:', err);
    return sendError(res, 'Failed to bookmark', 500, err.message);
  }
};

// ── DELETE /api/v1/student/explore/bookmarks/:topCollegeId ───────────────────
export const removeBookmark = async (req, res) => {
  const { userId: studentId, tenantId } = req.user;
  const { topCollegeId } = req.params;

  try {
    const { error } = await supabase
      .from('student_college_bookmarks')
      .delete()
      .eq('student_id', studentId)
      .eq('tenant_id', tenantId)
      .eq('top_college_id', topCollegeId);

    if (error) throw error;
    return sendSuccess(res, null, 'Bookmark removed');
  } catch (err) {
    console.error('[removeBookmark] Error:', err);
    return sendError(res, 'Failed to remove bookmark', 500, err.message);
  }
};

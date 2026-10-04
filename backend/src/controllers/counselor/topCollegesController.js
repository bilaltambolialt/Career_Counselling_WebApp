import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

// ── GET /api/v1/counselor/top-colleges ────────────────────────────────────
// Returns all platform-wide top college entries for counselor comparison.
// Optional ?colleges=Name1,Name2 to filter by specific college names.
// Optional ?field=Engineering to filter by field.
export const listTopCollegesForCounselor = async (req, res) => {
  const { colleges, field } = req.query;

  try {
    let query = supabase
      .from('top_colleges')
      .select('id, field, program, college_name, rank, location_city, location_state, college_type, affiliation, annual_fees, notable_features')
      .order('field')
      .order('program')
      .order('rank', { ascending: true, nullsFirst: false });

    if (field) {
      query = query.eq('field', field);
    }
    if (colleges) {
      const names = colleges.split(',').map(n => n.trim()).filter(Boolean);
      if (names.length) query = query.in('college_name', names);
    }

    const { data, error } = await query;
    if (error) throw error;

    return sendSuccess(res, data ?? [], 'Top colleges fetched');
  } catch (err) {
    console.error('[listTopCollegesForCounselor] Error:', err);
    return sendError(res, 'Failed to fetch top colleges', 500, err.message);
  }
};

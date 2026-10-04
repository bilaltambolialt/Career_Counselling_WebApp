import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

// GET /api/v1/colleges — accessible by all authenticated users
export const listColleges = async (req, res) => {
  const { search, type, state, limit = 100 } = req.query;

  let query = supabase
    .from('colleges')
    .select('id, name, short_name, location, state, college_type, affiliation')
    .eq('is_active', true)
    .order('name')
    .limit(Math.min(200, parseInt(limit)));

  if (search?.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,short_name.ilike.%${search.trim()}%`);
  }
  if (type) query = query.eq('college_type', type);
  if (state) query = query.eq('state', state);

  const { data, error } = await query;
  if (error) return sendError(res, 'Failed to fetch colleges', 500, error.message);
  return sendSuccess(res, data ?? [], 'Colleges fetched');
};

// GET /api/v1/colleges/:id/branches
export const getCollegeBranches = async (req, res) => {
  const { id } = req.params;

  const { data: college } = await supabase
    .from('colleges')
    .select('id, name')
    .eq('id', id)
    .maybeSingle();

  if (!college) return sendError(res, 'College not found', 404);

  const { data: branches, error } = await supabase
    .from('college_branches')
    .select('id, branch_name, branch_code, total_seats')
    .eq('college_id', id)
    .eq('is_active', true)
    .order('branch_name');

  if (error) return sendError(res, 'Failed to fetch branches', 500, error.message);
  return sendSuccess(res, branches ?? [], 'Branches fetched');
};

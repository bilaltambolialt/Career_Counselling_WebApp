import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

// GET /api/v1/student/branches
// Returns sorted, deduplicated list of branch names across all active colleges.
// Used by the student Profile Builder (Course Preferences section).
export const listBranchNames = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('college_branches')
      .select('branch_name')
      .eq('is_active', true)
      .order('branch_name');

    if (error) return sendError(res, 'Failed to fetch branch names', 500, error.message);

    // Deduplicate — same branch name may appear across multiple colleges
    const unique = [...new Set((data ?? []).map((b) => b.branch_name))].sort((a, b) =>
      a.localeCompare(b)
    );

    return sendSuccess(res, unique, 'Branch names fetched');
  } catch (err) {
    console.error('[listBranchNames Error]', err);
    return sendError(res, 'Failed to fetch branch names', 500, err.message);
  }
};

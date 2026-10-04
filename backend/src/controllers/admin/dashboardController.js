import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

// GET /api/v1/admin/dashboard
export const getDashboard = async (req, res) => {
  const { tenantId } = req.user;

  try {
    const [studentsRes, counselorsRes, cutoffRes, predictionsRes, recentStudentsRes, adminTokenRes] =
      await Promise.all([
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('is_active', true),

        supabase
          .from('counselors')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('is_active', true),

        supabase
          .from('cutoff_data')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),

        supabase
          .from('predictions')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),

        supabase
          .from('students')
          .select('id, name, email, category, is_active, created_at')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(5),

        supabase
          .from('admins')
          .select('tokens_allocated, tokens_used')
          .eq('id', tenantId)
          .maybeSingle(),
      ]);

    const tokenRow = adminTokenRes.data;
    const tokensAllocated = tokenRow?.tokens_allocated ?? 0;
    const tokensUsed      = tokenRow?.tokens_used      ?? 0;

    return sendSuccess(res, {
      students:        studentsRes.count     ?? 0,
      counselors:      counselorsRes.count   ?? 0,
      cutoffEntries:   cutoffRes.count       ?? 0,
      predictions:     predictionsRes.count  ?? 0,
      recentStudents:  recentStudentsRes.data ?? [],
      tokensAllocated,
      tokensUsed,
      tokensRemaining: tokensAllocated - tokensUsed,
    });
  } catch (err) {
    console.error('[Dashboard Error]', err);
    return sendError(res, 'Failed to load dashboard', 500, err.message);
  }
};

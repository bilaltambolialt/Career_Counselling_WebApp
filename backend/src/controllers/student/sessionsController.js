import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

const PAGE_SIZE = 20;

// ── GET /api/v1/student/sessions?status=upcoming|past|all&page=N ───────────
export const listSessions = async (req, res) => {
  const { userId: studentId, tenantId } = req.user;
  const { status = 'upcoming' } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const now  = new Date().toISOString();

  try {
    let query = supabase
      .from('counseling_sessions')
      .select(
        'id, title, scheduled_at, duration_minutes, status, meeting_link, created_at, counselors ( id, name, email )',
        { count: 'exact' }
      )
      .eq('student_id', studentId)
      .eq('tenant_id', tenantId);

    if (status === 'upcoming') {
      query = query.eq('status', 'scheduled').gte('scheduled_at', now);
    } else if (status === 'past') {
      query = query.or(`status.eq.completed,status.eq.cancelled,and(status.eq.scheduled,scheduled_at.lt.${now})`);
    }

    const ascending = status !== 'past';
    query = query.order('scheduled_at', { ascending });

    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return sendSuccess(res, data ?? [], 'Sessions fetched', 200, {
      page,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      total: count ?? 0,
    });
  } catch (err) {
    console.error('[listSessions/student] Error:', err);
    return sendError(res, 'Failed to fetch sessions', 500, err.message);
  }
};

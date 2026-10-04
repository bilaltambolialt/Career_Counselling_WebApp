import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

// GET /api/v1/counselor/dashboard
export const getCounselorDashboard = async (req, res) => {
  const { userId, tenantId } = req.user;

  try {
    // Fetch counselor info
    const { data: counselor, error: counselorError } = await supabase
      .from('counselors')
      .select('id, name, email, phone')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (counselorError) return sendError(res, 'Failed to fetch counselor info', 500, counselorError.message);
    if (!counselor) return sendError(res, 'Counselor not found', 404);

    // Count assigned students + their stats
    const [studentCountRes, recentStudentsRes] = await Promise.allSettled([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_counselor_id', userId)
        .eq('tenant_id', tenantId)
        .eq('is_active', true),
      supabase
        .from('students')
        .select('id, name, email, category, created_at')
        .eq('assigned_counselor_id', userId)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const assignedCount   = studentCountRes.status   === 'fulfilled' ? (studentCountRes.value.count   ?? 0) : 0;
    const recentStudents  = recentStudentsRes.status  === 'fulfilled' ? (recentStudentsRes.value.data   ?? []) : [];

    return sendSuccess(res, {
      counselor,
      assignedCount,
      recentStudents,
    });
  } catch (err) {
    console.error('[getCounselorDashboard Error]', err);
    return sendError(res, 'Failed to load counselor dashboard', 500, err.message);
  }
};

// GET /api/v1/counselor/students  — paginated list of assigned students
export const listAssignedStudents = async (req, res) => {
  const { userId, tenantId } = req.user;
  const page  = Math.max(1, parseInt(req.query.page  ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? '20', 10)));
  const from  = (page - 1) * limit;

  try {
    const { data, error, count } = await supabase
      .from('students')
      .select('id, name, email, phone, category, is_active, predictions_enabled, created_at', { count: 'exact' })
      .eq('assigned_counselor_id', userId)
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
      .range(from, from + limit - 1);

    if (error) return sendError(res, 'Failed to fetch assigned students', 500, error.message);

    return sendSuccess(res, data ?? [], 'Assigned students fetched', 200, {
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      total: count ?? 0,
    });
  } catch (err) {
    console.error('[listAssignedStudents Error]', err);
    return sendError(res, 'Failed to list assigned students', 500, err.message);
  }
};

// PATCH /api/v1/counselor/students/:id/toggle-predictions
export const toggleStudentPredictions = async (req, res) => {
  const { userId: counselorId, tenantId } = req.user;
  const { id: studentId } = req.params;

  try {
    const { data: student, error: fetchErr } = await supabase
      .from('students')
      .select('id, predictions_enabled')
      .eq('id', studentId)
      .eq('assigned_counselor_id', counselorId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!student) return sendError(res, 'Student not found or not assigned to you', 404);

    const newValue = !student.predictions_enabled;

    const { error: updateErr } = await supabase
      .from('students')
      .update({ predictions_enabled: newValue })
      .eq('id', studentId);

    if (updateErr) throw updateErr;

    return sendSuccess(
      res,
      { predictions_enabled: newValue },
      `Recommendations ${newValue ? 'enabled' : 'disabled'} for this student`,
    );
  } catch (err) {
    console.error('[toggleStudentPredictions Error]', err);
    return sendError(res, 'Failed to toggle predictions', 500, err.message);
  }
};

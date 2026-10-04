import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';
import { createNotification } from '../../utils/notificationUtils.js';

// ── POST /api/v1/student/sessions/request ──────────────────────────────────
// Student submits a session request to their assigned counselor.
export const createSessionRequest = async (req, res) => {
  const { userId: studentId, tenantId } = req.user;
  const { message } = req.body;

  try {
    // 1. Verify student has an assigned counselor
    const { data: student, error: stuErr } = await supabase
      .from('students')
      .select('id, name, assigned_counselor_id')
      .eq('id', studentId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (stuErr) throw stuErr;
    if (!student?.assigned_counselor_id) {
      return sendError(res, 'No counselor has been assigned to you yet. Please contact your admin.', 400);
    }

    const counselorId = student.assigned_counselor_id;

    // 2. Check for an already-pending request
    const { data: existing } = await supabase
      .from('session_requests')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('counselor_id', counselorId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return sendError(res, 'You already have a pending session request. Please wait for your counselor to respond.', 409);
    }

    // 3. Insert request
    const { data: request, error: insErr } = await supabase
      .from('session_requests')
      .insert({
        tenant_id:    tenantId,
        student_id:   studentId,
        counselor_id: counselorId,
        message:      message?.trim() || null,
        status:       'pending',
      })
      .select('id, status, message, created_at')
      .single();

    if (insErr) throw insErr;

    // 4. Notify counselor
    createNotification({
      tenantId,
      recipientId:   counselorId,
      recipientRole: 'counselor',
      type:          'session_request',
      title:         'New Session Request',
      message:       `${student.name} has requested a counseling session.${message?.trim() ? ` Note: "${message.trim()}"` : ''}`,
      link:          '/counselor/sessions',
    }).catch(console.error);

    return sendSuccess(res, request, 'Session request submitted successfully', 201);
  } catch (err) {
    console.error('[createSessionRequest] Error:', err);
    return sendError(res, 'Failed to submit session request', 500, err.message);
  }
};

// ── GET /api/v1/student/sessions/request ───────────────────────────────────
// Returns the student's latest session request + assigned counselor info.
export const getSessionRequest = async (req, res) => {
  const { userId: studentId, tenantId } = req.user;

  try {
    // Get assigned counselor info
    const { data: student } = await supabase
      .from('students')
      .select('assigned_counselor_id, counselors:assigned_counselor_id(id, name, email)')
      .eq('id', studentId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const counselor = student?.counselors ?? null;

    // Get latest request (any status — so student sees history)
    const { data: request } = await supabase
      .from('session_requests')
      .select('id, status, message, created_at')
      .eq('student_id', studentId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return sendSuccess(res, { counselor, request: request ?? null }, 'Session request status fetched');
  } catch (err) {
    console.error('[getSessionRequest] Error:', err);
    return sendError(res, 'Failed to fetch session request status', 500, err.message);
  }
};

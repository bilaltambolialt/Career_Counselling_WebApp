import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';
import { createNotification } from '../../utils/notificationUtils.js';

const PAGE_SIZE = 20;

// ── GET /api/v1/counselor/sessions/requests ────────────────────────────────
// List pending session requests addressed to this counselor.
export const listSessionRequests = async (req, res) => {
  const { userId: counselorId, tenantId } = req.user;
  const { status = 'pending' } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const VALID = ['pending', 'accepted', 'declined', 'all'];
  if (!VALID.includes(status)) {
    return sendError(res, 'status must be pending | accepted | declined | all', 400);
  }

  try {
    let query = supabase
      .from('session_requests')
      .select(
        'id, status, message, created_at, students ( id, name, email )',
        { count: 'exact' }
      )
      .eq('counselor_id', counselorId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (status !== 'all') query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    return sendSuccess(res, data ?? [], 'Session requests fetched', 200, {
      page,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      total: count ?? 0,
    });
  } catch (err) {
    console.error('[listSessionRequests] Error:', err);
    return sendError(res, 'Failed to fetch session requests', 500, err.message);
  }
};

// ── PATCH /api/v1/counselor/sessions/requests/:id/accept ──────────────────
// Counselor accepts the request: sets a date/time, creates a real session,
// marks the request as accepted, and notifies the student.
export const acceptSessionRequest = async (req, res) => {
  const { userId: counselorId, tenantId } = req.user;
  const { id } = req.params;
  const { scheduled_at, title, meeting_link } = req.body;

  if (!scheduled_at) {
    return sendError(res, 'scheduled_at is required to accept a request', 400);
  }
  if (new Date(scheduled_at) < new Date()) {
    return sendError(res, 'scheduled_at must be a future date and time', 400);
  }

  try {
    // Verify the request belongs to this counselor and is still pending
    const { data: request, error: fetchErr } = await supabase
      .from('session_requests')
      .select('id, status, student_id, students ( id, name )')
      .eq('id', id)
      .eq('counselor_id', counselorId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!request) return sendError(res, 'Session request not found', 404);
    if (request.status !== 'pending') {
      return sendError(res, `Request is already ${request.status}`, 400);
    }

    const studentName = request.students?.name ?? 'Student';
    const sessionTitle = title?.trim() || `Counseling Session — ${studentName}`;

    // Create the actual counseling session
    const { data: session, error: sessionErr } = await supabase
      .from('counseling_sessions')
      .insert({
        tenant_id:        tenantId,
        counselor_id:     counselorId,
        student_id:       request.student_id,
        title:            sessionTitle,
        scheduled_at,
        duration_minutes: 60,
        meeting_link:     meeting_link?.trim() || null,
      })
      .select('id, title, scheduled_at, status')
      .single();

    if (sessionErr) throw sessionErr;

    // Mark the request as accepted
    await supabase
      .from('session_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', id);

    // Notify the student
    const sessionDate = new Date(scheduled_at).toLocaleString('en-IN', {
      dateStyle: 'medium', timeStyle: 'short',
    });
    createNotification({
      tenantId,
      recipientId:   request.student_id,
      recipientRole: 'student',
      type:          'session_scheduled',
      title:         'Session Request Accepted',
      message:       `Your session request has been accepted. "${sessionTitle}" is scheduled for ${sessionDate}.`,
      link:          '/student/sessions',
    }).catch(console.error);

    return sendSuccess(res, { request_id: id, session }, 'Request accepted and session scheduled');
  } catch (err) {
    console.error('[acceptSessionRequest] Error:', err);
    return sendError(res, 'Failed to accept session request', 500, err.message);
  }
};

// ── PATCH /api/v1/counselor/sessions/requests/:id/decline ─────────────────
// Counselor declines the request and notifies the student.
export const declineSessionRequest = async (req, res) => {
  const { userId: counselorId, tenantId } = req.user;
  const { id } = req.params;

  try {
    const { data: request, error: fetchErr } = await supabase
      .from('session_requests')
      .select('id, status, student_id')
      .eq('id', id)
      .eq('counselor_id', counselorId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!request) return sendError(res, 'Session request not found', 404);
    if (request.status !== 'pending') {
      return sendError(res, `Request is already ${request.status}`, 400);
    }

    await supabase
      .from('session_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', id);

    createNotification({
      tenantId,
      recipientId:   request.student_id,
      recipientRole: 'student',
      type:          'session_declined',
      title:         'Session Request Declined',
      message:       'Your counseling session request could not be accommodated at this time. You may submit a new request later.',
      link:          '/student/profile',
    }).catch(console.error);

    return sendSuccess(res, {}, 'Session request declined');
  } catch (err) {
    console.error('[declineSessionRequest] Error:', err);
    return sendError(res, 'Failed to decline session request', 500, err.message);
  }
};

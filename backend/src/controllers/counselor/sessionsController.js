import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';
import { createNotification } from '../../utils/notificationUtils.js';

const PAGE_SIZE = 20;
const VALID_DURATIONS = [30, 45, 60, 90, 120];
const VALID_STATUSES  = ['scheduled', 'completed', 'cancelled'];

// ── GET /api/v1/counselor/sessions?status=upcoming|past|all&page=N ─────────
export const listSessions = async (req, res) => {
  const { userId: counselorId, tenantId } = req.user;
  const { status = 'upcoming' } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const now  = new Date().toISOString();

  try {
    let query = supabase
      .from('counseling_sessions')
      .select(
        'id, title, scheduled_at, duration_minutes, status, notes, meeting_link, created_at, students ( id, name, email )',
        { count: 'exact' }
      )
      .eq('counselor_id', counselorId)
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
    console.error('[listSessions/counselor] Error:', err);
    return sendError(res, 'Failed to fetch sessions', 500, err.message);
  }
};

// ── GET /api/v1/counselor/sessions/students-list ───────────────────────────
// Flat list of all assigned students — used to populate session creation dropdown
export const getStudentsList = async (req, res) => {
  const { userId: counselorId, tenantId } = req.user;

  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, email')
      .eq('assigned_counselor_id', counselorId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return sendSuccess(res, data ?? [], 'Students list fetched');
  } catch (err) {
    console.error('[getStudentsList] Error:', err);
    return sendError(res, 'Failed to fetch students list', 500, err.message);
  }
};

// ── POST /api/v1/counselor/sessions ────────────────────────────────────────
export const createSession = async (req, res) => {
  const { userId: counselorId, tenantId } = req.user;
  const { student_id, title, scheduled_at, duration_minutes = 60, meeting_link } = req.body;

  if (!student_id || !title?.trim() || !scheduled_at) {
    return sendError(res, 'student_id, title, and scheduled_at are required', 400);
  }
  if (duration_minutes && !VALID_DURATIONS.includes(Number(duration_minutes))) {
    return sendError(res, `duration_minutes must be one of: ${VALID_DURATIONS.join(', ')}`, 400);
  }
  if (new Date(scheduled_at) < new Date()) {
    return sendError(res, 'scheduled_at must be a future date and time', 400);
  }

  try {
    // Verify student belongs to this tenant
    const { data: student, error: stuErr } = await supabase
      .from('students')
      .select('id, name')
      .eq('id', student_id)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (stuErr) throw stuErr;
    if (!student) return sendError(res, 'Student not found in your institution', 404);

    const { data: session, error } = await supabase
      .from('counseling_sessions')
      .insert({
        tenant_id:        tenantId,
        counselor_id:     counselorId,
        student_id,
        title:            title.trim(),
        scheduled_at,
        duration_minutes: Number(duration_minutes),
        meeting_link:     meeting_link?.trim() || null,
      })
      .select('id, title, scheduled_at, duration_minutes, status, meeting_link, created_at, students ( id, name, email )')
      .single();

    if (error) throw error;

    // Auto-notify student
    const sessionDate = new Date(scheduled_at).toLocaleString('en-IN', {
      dateStyle: 'medium', timeStyle: 'short',
    });
    createNotification({
      tenantId,
      recipientId:   student_id,
      recipientRole: 'student',
      type:          'session_scheduled',
      title:         'Session Scheduled',
      message:       `A counseling session "${title.trim()}" has been scheduled for ${sessionDate}.`,
      link:          '/student/sessions',
    }).catch(console.error);

    return sendSuccess(res, session, 'Session created successfully', 201);
  } catch (err) {
    console.error('[createSession] Error:', err);
    return sendError(res, 'Failed to create session', 500, err.message);
  }
};

// ── PATCH /api/v1/counselor/sessions/:id ───────────────────────────────────
export const updateSession = async (req, res) => {
  const { userId: counselorId, tenantId } = req.user;
  const { id } = req.params;
  const { title, scheduled_at, duration_minutes, status, notes, meeting_link } = req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    return sendError(res, `status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
  }

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('counseling_sessions')
      .select('id, title, status, student_id')
      .eq('id', id)
      .eq('counselor_id', counselorId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return sendError(res, 'Session not found', 404);

    const updates = {};
    if (title           !== undefined) updates.title            = title.trim();
    if (scheduled_at    !== undefined) updates.scheduled_at     = scheduled_at;
    if (duration_minutes !== undefined) updates.duration_minutes = Number(duration_minutes);
    if (status          !== undefined) updates.status           = status;
    if (notes           !== undefined) updates.notes            = notes?.trim() || null;
    if (meeting_link    !== undefined) updates.meeting_link     = meeting_link?.trim() || null;

    const { data, error } = await supabase
      .from('counseling_sessions')
      .update(updates)
      .eq('id', id)
      .select('id, title, scheduled_at, duration_minutes, status, notes, meeting_link, students ( id, name, email )')
      .single();
    if (error) throw error;

    // Notify student if session was just cancelled
    if (status === 'cancelled' && existing.status !== 'cancelled') {
      createNotification({
        tenantId,
        recipientId:   existing.student_id,
        recipientRole: 'student',
        type:          'session_cancelled',
        title:         'Session Cancelled',
        message:       `Your counseling session "${data.title}" has been cancelled.`,
        link:          '/student/sessions',
      }).catch(console.error);
    }

    return sendSuccess(res, data, 'Session updated successfully');
  } catch (err) {
    console.error('[updateSession] Error:', err);
    return sendError(res, 'Failed to update session', 500, err.message);
  }
};

// ── DELETE /api/v1/counselor/sessions/:id  (sets status → cancelled) ───────
export const cancelSession = async (req, res) => {
  const { userId: counselorId, tenantId } = req.user;
  const { id } = req.params;

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('counseling_sessions')
      .select('id, title, student_id, status')
      .eq('id', id)
      .eq('counselor_id', counselorId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return sendError(res, 'Session not found', 404);
    if (existing.status === 'cancelled') return sendError(res, 'Session is already cancelled', 400);

    const { error } = await supabase
      .from('counseling_sessions')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (error) throw error;

    createNotification({
      tenantId,
      recipientId:   existing.student_id,
      recipientRole: 'student',
      type:          'session_cancelled',
      title:         'Session Cancelled',
      message:       `Your counseling session "${existing.title}" has been cancelled.`,
      link:          '/student/sessions',
    }).catch(console.error);

    return sendSuccess(res, {}, 'Session cancelled successfully');
  } catch (err) {
    console.error('[cancelSession] Error:', err);
    return sendError(res, 'Failed to cancel session', 500, err.message);
  }
};

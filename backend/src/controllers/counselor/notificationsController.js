import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';
import { createNotification } from '../../utils/notificationUtils.js';

const PAGE_SIZE = 20;

// GET /api/v1/counselor/notifications
export const listNotifications = async (req, res) => {
  const { userId, tenantId } = req.user;
  const page = Math.max(1, parseInt(req.query.page) || 1);

  try {
    const from = (page - 1) * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', userId)
      .eq('tenant_id', tenantId)
      .order('is_read', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_read', false);

    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
    return sendSuccess(res, data ?? [], 'Notifications fetched', 200, {
      page,
      totalPages,
      total: count ?? 0,
      unreadCount: unreadCount ?? 0,
    });
  } catch (err) {
    console.error('[counselor listNotifications] Error:', err);
    return sendError(res, 'Failed to fetch notifications', 500, err.message);
  }
};

// PATCH /api/v1/counselor/notifications/:id/read
export const markRead = async (req, res) => {
  const { userId, tenantId } = req.user;
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('recipient_id', userId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return sendSuccess(res, {}, 'Marked as read');
  } catch (err) {
    console.error('[counselor markRead] Error:', err);
    return sendError(res, 'Failed to mark notification', 500, err.message);
  }
};

// POST /api/v1/counselor/notifications/send
export const sendNotification = async (req, res) => {
  const { userId: counselorId, tenantId } = req.user;
  const { recipientType, studentId, title, message, link } = req.body;

  const VALID_TYPES = ['all_my_students', 'student'];
  if (!VALID_TYPES.includes(recipientType)) {
    return sendError(res, 'recipientType must be "all_my_students" or "student"', 400);
  }
  if (!title?.trim())   return sendError(res, 'title is required', 400);
  if (!message?.trim()) return sendError(res, 'message is required', 400);

  try {
    if (recipientType === 'student') {
      if (!studentId) return sendError(res, 'studentId is required when sending to a specific student', 400);

      // Verify student is assigned to this counselor
      const { data: stu, error: stuErr } = await supabase
        .from('students')
        .select('id, name')
        .eq('id', studentId)
        .eq('assigned_counselor_id', counselorId)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (stuErr) throw stuErr;
      if (!stu) return sendError(res, 'Student not found or not assigned to you', 404);

      await createNotification({
        tenantId,
        recipientId:   studentId,
        recipientRole: 'student',
        type:          'admin_message',
        title:         title.trim(),
        message:       message.trim(),
        link:          link?.trim() || null,
      });

      // Log the sent notification
      await supabase.from('counselor_notification_log').insert({
        counselor_id:   counselorId,
        tenant_id:      tenantId,
        recipient_type: 'student',
        student_name:   stu.name,
        title:          title.trim(),
        message:        message.trim(),
        link:           link?.trim() || null,
        recipient_count: 1,
      });

      return sendSuccess(res, { notifiedCount: 1 }, `Notification sent to ${stu.name}`);
    }

    // all_my_students
    const { data: students, error: stuErr } = await supabase
      .from('students')
      .select('id')
      .eq('assigned_counselor_id', counselorId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    if (stuErr) throw stuErr;
    if (!students?.length) return sendError(res, 'You have no active assigned students', 404);

    const rows = students.map(s => ({
      tenant_id:     tenantId,
      recipient_id:  s.id,
      recipient_role: 'student',
      type:          'admin_message',
      title:         title.trim(),
      message:       message.trim(),
      link:          link?.trim() || null,
    }));

    const { error: insertErr } = await supabase.from('notifications').insert(rows);
    if (insertErr) throw insertErr;

    // Log the sent notification
    await supabase.from('counselor_notification_log').insert({
      counselor_id:    counselorId,
      tenant_id:       tenantId,
      recipient_type:  'all_my_students',
      student_name:    null,
      title:           title.trim(),
      message:         message.trim(),
      link:            link?.trim() || null,
      recipient_count: students.length,
    });

    return sendSuccess(res, { notifiedCount: students.length }, `Notification sent to ${students.length} student${students.length !== 1 ? 's' : ''}`);
  } catch (err) {
    console.error('[counselor sendNotification] Error:', err);
    return sendError(res, 'Failed to send notification', 500, err.message);
  }
};

// GET /api/v1/counselor/notifications/sent
export const listSentNotifications = async (req, res) => {
  const { userId, tenantId } = req.user;
  const page = Math.max(1, parseInt(req.query.page) || 1);

  try {
    const from = (page - 1) * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from('counselor_notification_log')
      .select('*', { count: 'exact' })
      .eq('counselor_id', userId)
      .eq('tenant_id', tenantId)
      .order('sent_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
    return sendSuccess(res, data ?? [], 'Sent notifications fetched', 200, { page, totalPages, total: count ?? 0 });
  } catch (err) {
    console.error('[counselor listSentNotifications] Error:', err);
    return sendError(res, 'Failed to fetch sent notifications', 500, err.message);
  }
};

// DELETE /api/v1/counselor/notifications/sent/:id
export const deleteSentNotification = async (req, res) => {
  const { userId, tenantId } = req.user;
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('counselor_notification_log')
      .delete()
      .eq('id', id)
      .eq('counselor_id', userId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return sendSuccess(res, null, 'Notification removed from history');
  } catch (err) {
    console.error('[counselor deleteSentNotification] Error:', err);
    return sendError(res, 'Failed to delete notification', 500, err.message);
  }
};

// PATCH /api/v1/counselor/notifications/read-all
export const markAllRead = async (req, res) => {
  const { userId, tenantId } = req.user;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_read', false);

    if (error) throw error;
    return sendSuccess(res, {}, 'All notifications marked as read');
  } catch (err) {
    console.error('[counselor markAllRead] Error:', err);
    return sendError(res, 'Failed to mark all notifications', 500, err.message);
  }
};

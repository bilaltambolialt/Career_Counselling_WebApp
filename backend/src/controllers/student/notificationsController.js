import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

const PAGE_SIZE = 20;

// GET /api/v1/student/notifications
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

    // Unread count (fast separate query — avoids filtering full result)
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
    console.error('[listNotifications] Error:', err);
    return sendError(res, 'Failed to fetch notifications', 500, err.message);
  }
};

// PATCH /api/v1/student/notifications/:id/read
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
    console.error('[markRead] Error:', err);
    return sendError(res, 'Failed to mark notification', 500, err.message);
  }
};

// PATCH /api/v1/student/notifications/read-all
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
    console.error('[markAllRead] Error:', err);
    return sendError(res, 'Failed to mark all notifications', 500, err.message);
  }
};

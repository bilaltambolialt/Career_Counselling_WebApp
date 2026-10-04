import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

const PAGE_SIZE = 20;

// GET /api/v1/superadmin/notifications
export const listNotifications = async (req, res) => {
  const { userId } = req.user;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const { data, count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', userId)
      .eq('recipient_role', 'super_admin')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    const unreadCount = (data ?? []).filter(n => !n.is_read).length;

    return sendSuccess(res, data ?? [], 'Notifications fetched', 200, {
      page,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      total: count ?? 0,
      unreadCount,
    });
  } catch (err) {
    console.error('[listNotifications SA] Error:', err);
    return sendError(res, 'Failed to fetch notifications', 500, err.message);
  }
};

// PATCH /api/v1/superadmin/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('recipient_id', userId);

    if (error) throw error;
    return sendSuccess(res, null, 'Notification marked read');
  } catch (err) {
    console.error('[markNotificationRead SA] Error:', err);
    return sendError(res, 'Failed to mark notification', 500, err.message);
  }
};

// PATCH /api/v1/superadmin/notifications/read-all
export const markAllRead = async (req, res) => {
  const { userId } = req.user;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('recipient_role', 'super_admin')
      .eq('is_read', false);

    if (error) throw error;
    return sendSuccess(res, null, 'All notifications marked read');
  } catch (err) {
    console.error('[markAllRead SA] Error:', err);
    return sendError(res, 'Failed to mark all read', 500, err.message);
  }
};

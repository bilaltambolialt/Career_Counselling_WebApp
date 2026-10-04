import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import StudentSidebar from '../../components/layout/StudentSidebar.jsx';
import api from '../../utils/api.js';

const TYPE_ICON = {
  welcome:            '👋',
  counselor_assigned: '👤',
  predictions_ready:  '🎯',
  cutoff_updated:     '📊',
  admin_message:      '📢',
  session_scheduled:  '📅',
  session_cancelled:  '❌',
};

const formatTime = (ts) => {
  const d    = new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days} day${days > 1 ? 's' : ''} ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [total,         setTotal]         = useState(0);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [markingAll,    setMarkingAll]    = useState(false);

  const fetchPage = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/student/notifications', { params: { page: pg } });
      setNotifications(res.data.data ?? []);
      setTotalPages(res.data.meta?.totalPages ?? 1);
      setTotal(res.data.meta?.total ?? 0);
      setUnreadCount(res.data.meta?.unreadCount ?? 0);
      setPage(pg);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  const markOne = async (id) => {
    try {
      await api.patch(`/student/notifications/${id}/read`);
      setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(p => Math.max(0, p - 1));
    } catch { /* silent */ }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/student/notifications/read-all');
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  };

  return (
    <DashboardShell sidebar={<StudentSidebar />}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {total} notification{total !== 1 ? 's' : ''}
            {unreadCount > 0 && ` — ${unreadCount} unread`}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-60"
          >
            {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Notifications about your recommendations, counselor assignment, and more will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`flex gap-4 px-5 py-4 transition-colors ${!n.is_read ? 'bg-indigo-50/40' : 'hover:bg-gray-50'}`}
              >
                <span className="text-2xl shrink-0 mt-0.5 leading-none">
                  {TYPE_ICON[n.type] ?? '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                        {n.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-xs text-gray-400">{formatTime(n.created_at)}</p>
                        {n.link && (
                          <button
                            onClick={() => { markOne(n.id); navigate(n.link); }}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                          >
                            View <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={() => markOne(n.id)}
                        className="shrink-0 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-100 transition-colors whitespace-nowrap"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchPage(page - 1)}
              disabled={page === 1 || loading}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => fetchPage(page + 1)}
              disabled={page === totalPages || loading}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default NotificationsPage;

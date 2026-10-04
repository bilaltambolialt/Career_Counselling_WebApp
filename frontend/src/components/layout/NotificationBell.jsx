import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import { useAuth } from '../../hooks/useAuth.js';

const API_BASE = {
  student:     '/student/notifications',
  counselor:   '/counselor/notifications',
  super_admin: '/superadmin/notifications',
};

const NAV_PAGE = {
  student:     '/student/notifications',
  counselor:   '/counselor/notifications',
  super_admin: null,
};

const TYPE_ICON = {
  welcome:            '👋',
  counselor_assigned: '👤',
  predictions_ready:  '🎯',
  cutoff_updated:     '📊',
  admin_message:      '📢',
  session_scheduled:  '📅',
  session_cancelled:  '❌',
  token_request:      '🪙',
};

const formatTime = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const NotificationBell = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const dropdownRef = useRef(null);

  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);

  const role    = user?.role;
  const apiBase = API_BASE[role];

  // Don't render for admin / superadmin (they send, not receive)
  if (!apiBase) return null;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get(apiBase, { params: { page: 1 } });
      setNotifications((res.data.data ?? []).slice(0, 5));
      setUnreadCount(res.data.meta?.unreadCount ?? 0);
    } catch { /* silent — don't break the shell */ } finally {
      setLoading(false);
    }
  };

  // Initial fetch + 60-second polling for unread badge
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = () => {
    if (!open) fetchNotifications();
    setOpen(p => !p);
  };

  const markOne = async (id) => {
    try {
      await api.patch(`${apiBase}/${id}/read`);
      setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(p => Math.max(0, p - 1));
    } catch { /* silent */ }
  };

  const markAll = async () => {
    try {
      await api.patch(`${apiBase}/read-all`);
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleClick = (n) => {
    if (!n.is_read) markOne(n.id);
    if (n.link) { setOpen(false); navigate(n.link); }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAll}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 ${!n.is_read ? 'bg-indigo-50/40' : ''}`}
                >
                  <span className="text-xl shrink-0 mt-0.5 leading-none">
                    {TYPE_ICON[n.type] ?? '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm line-clamp-1 ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 flex-none" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer link — only for roles with a dedicated notifications page */}
          {NAV_PAGE[role] && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <button
                onClick={() => { setOpen(false); navigate(NAV_PAGE[role]); }}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium py-1 rounded hover:bg-indigo-50 transition-colors"
              >
                View all notifications
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

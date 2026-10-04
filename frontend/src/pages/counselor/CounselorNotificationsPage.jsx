import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, ChevronLeft, ChevronRight, ArrowRight, Send, Search, X, ChevronDown, Trash2, History, Users, User } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import CounselorSidebar from '../../components/layout/CounselorSidebar.jsx';
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

const RECIPIENT_OPTIONS = [
  { value: 'all_my_students', label: 'All my assigned students' },
  { value: 'student',         label: 'Specific student'         },
];

// ── Searchable student dropdown ──────────────────────────────────────────────
const UserSearchSelect = ({ users, value, onChange, placeholder, disabled }) => {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = users.filter(u =>
    !query ||
    u.name?.toLowerCase().includes(query.toLowerCase()) ||
    u.email?.toLowerCase().includes(query.toLowerCase())
  );

  const selected = users.find(u => u.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className="w-full flex items-center justify-between border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-left disabled:opacity-60"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? `${selected.name} — ${selected.email}` : (placeholder || 'Select…')}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && (
            <span
              onClick={e => { e.stopPropagation(); onChange(''); }}
              className="p-0.5 hover:bg-gray-100 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No results</p>
            ) : filtered.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => { onChange(u.id); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${value === u.id ? 'bg-purple-50' : ''}`}
              >
                <span className="font-medium text-gray-900">{u.name}</span>
                <span className="text-gray-400 text-xs ml-1.5">{u.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Send Form ────────────────────────────────────────────────────────────────
const SendForm = ({ myStudents, onSent }) => {
  const [form, setForm] = useState({
    recipientType: 'all_my_students',
    studentId:     '',
    title:         '',
    message:       '',
    link:          '',
  });
  const [sending,  setSending]  = useState(false);
  const [success,  setSuccess]  = useState(null);
  const [error,    setError]    = useState(null);

  const needsStudent = form.recipientType === 'student';

  const handleSend = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (needsStudent && !form.studentId) {
      setError('Please select a student.');
      return;
    }
    setSending(true);
    try {
      const payload = {
        recipientType: form.recipientType,
        title:         form.title.trim(),
        message:       form.message.trim(),
        link:          form.link.trim() || undefined,
      };
      if (needsStudent) payload.studentId = form.studentId;
      const res = await api.post('/counselor/notifications/send', payload);
      setSuccess(res.data?.message ?? 'Notification sent.');
      setForm(f => ({ ...f, title: '', message: '', link: '', studentId: '' }));
      onSent?.();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Send className="w-4 h-4 text-purple-600" /> Send Notification to Students
      </h2>
      <form onSubmit={handleSend} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Send To</label>
            <select
              value={form.recipientType}
              onChange={e => setForm(f => ({ ...f, recipientType: e.target.value, studentId: '' }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {RECIPIENT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {needsStudent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <UserSearchSelect
                users={myStudents}
                value={form.studentId}
                onChange={id => setForm(f => ({ ...f, studentId: id }))}
                placeholder="Search students by name or email…"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            maxLength={120}
            required
            placeholder="e.g. Important Update for Your Application"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            rows={3}
            required
            placeholder="Enter your message here…"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link <span className="text-gray-400 font-normal">(optional — deep link within the student portal)</span>
          </label>
          <input
            type="text"
            value={form.link}
            onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
            placeholder="e.g. /student/sessions"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">{success}</p>}

        <button
          type="submit"
          disabled={sending}
          className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending…' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
const CounselorNotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [total,         setTotal]         = useState(0);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [markingAll,    setMarkingAll]    = useState(false);
  const [myStudents,    setMyStudents]    = useState([]);

  // Sent history state
  const [sentHistory,   setSentHistory]   = useState([]);
  const [sentLoading,   setSentLoading]   = useState(true);
  const [sentPage,      setSentPage]      = useState(1);
  const [sentTotalPages,setSentTotalPages]= useState(1);
  const [sentTotal,     setSentTotal]     = useState(0);
  const [deletingId,    setDeletingId]    = useState(null);

  const fetchPage = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/counselor/notifications', { params: { page: pg } });
      setNotifications(res.data.data ?? []);
      setTotalPages(res.data.meta?.totalPages ?? 1);
      setTotal(res.data.meta?.total ?? 0);
      setUnreadCount(res.data.meta?.unreadCount ?? 0);
      setPage(pg);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const fetchSentPage = useCallback(async (pg = 1) => {
    setSentLoading(true);
    try {
      const res = await api.get('/counselor/notifications/sent', { params: { page: pg } });
      setSentHistory(res.data.data ?? []);
      setSentTotalPages(res.data.meta?.totalPages ?? 1);
      setSentTotal(res.data.meta?.total ?? 0);
      setSentPage(pg);
    } catch { /* silent */ } finally {
      setSentLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(1); }, [fetchPage]);
  useEffect(() => { fetchSentPage(1); }, [fetchSentPage]);

  useEffect(() => {
    api.get('/counselor/sessions/students-list')
      .then(r => setMyStudents(r.data.data ?? []))
      .catch(() => {});
  }, []);

  const handleDeleteSent = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/counselor/notifications/sent/${id}`);
      setSentHistory(p => p.filter(e => e.id !== id));
      setSentTotal(p => Math.max(0, p - 1));
    } catch { /* silent */ } finally {
      setDeletingId(null);
    }
  };

  const markOne = async (id) => {
    try {
      await api.patch(`/counselor/notifications/${id}/read`);
      setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(p => Math.max(0, p - 1));
    } catch { /* silent */ }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/counselor/notifications/read-all');
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  };

  return (
    <DashboardShell sidebar={<CounselorSidebar />}>
      {/* Send form */}
      <SendForm myStudents={myStudents} onSent={() => fetchSentPage(1)} />

      {/* Sent History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" /> Sent History
            {sentTotal > 0 && (
              <span className="text-xs font-normal text-gray-400">({sentTotal})</span>
            )}
          </h2>
        </div>

        {sentLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          </div>
        ) : sentHistory.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No notifications sent yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {sentHistory.map(entry => (
              <div key={entry.id} className="flex items-start gap-4 py-3.5">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                  {entry.recipient_type === 'student'
                    ? <User className="w-4 h-4 text-purple-600" />
                    : <Users className="w-4 h-4 text-purple-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{entry.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{entry.message}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] text-gray-400">
                      {new Date(entry.sent_at).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">
                      {entry.recipient_type === 'student'
                        ? `To: ${entry.student_name ?? 'Student'}`
                        : `To: All students (${entry.recipient_count})`
                      }
                    </span>
                    {entry.link && (
                      <span className="text-[11px] text-gray-400 truncate max-w-[120px]">{entry.link}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSent(entry.id)}
                  disabled={deletingId === entry.id}
                  className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove from history"
                >
                  {deletingId === entry.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            ))}
          </div>
        )}

        {sentTotalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {sentPage} of {sentTotalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchSentPage(sentPage - 1)}
                disabled={sentPage === 1 || sentLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                onClick={() => fetchSentPage(sentPage + 1)}
                disabled={sentPage === sentTotalPages || sentLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inbox header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Notifications</h2>
          <p className="text-gray-500 mt-0.5 text-sm">
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
              Announcements and updates from your institution will appear here.
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

export default CounselorNotificationsPage;

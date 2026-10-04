import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Send, Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Search, X, ChevronDown } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import AdminSidebar from '../../components/layout/AdminSidebar.jsx';
import api from '../../utils/api.js';

const DOMAINS = [
  'Engineering', 'Medical', 'Law', 'Management', 'Design / Architecture',
  'Pure Sciences', 'Commerce', 'Pharmacy', 'Agriculture',
];

const RECIPIENT_OPTIONS = [
  { value: 'all_students',       label: 'All Students',        desc: 'Every active student in your institution' },
  { value: 'all_counselors',     label: 'All Counselors',       desc: 'Every active counselor in your institution' },
  { value: 'students_by_domain', label: 'Students by Domain',   desc: 'All students interested in a specific domain' },
  { value: 'student',            label: 'Specific Student',    desc: 'One student by their User ID' },
  { value: 'counselor',          label: 'Specific Counselor',  desc: 'One counselor by their User ID' },
];

const TYPE_ICON = {
  admin_message: '📢',
};

// ── Searchable user dropdown ─────────────────────────────────────────────────
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
        className="w-full flex items-center justify-between border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left disabled:opacity-60"
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
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
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
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${value === u.id ? 'bg-indigo-50' : ''}`}
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

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const AdminNotificationsPage = () => {
  // Send form state
  const [form,         setForm]         = useState({ recipientType: 'all_students', recipientId: '', domain: '', title: '', message: '', link: '' });
  const [sending,      setSending]      = useState(false);
  const [sendSuccess,  setSendSuccess]  = useState(null);   // null | string message
  const [sendError,    setSendError]    = useState(null);

  // User lists for searchable dropdowns
  const [students,     setStudents]     = useState([]);
  const [counselors,   setCounselors]   = useState([]);

  // Sent history state
  const [history,      setHistory]      = useState([]);
  const [histLoading,  setHistLoading]  = useState(true);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);

  const fetchHistory = useCallback(async (pg = 1) => {
    setHistLoading(true);
    try {
      const res = await api.get('/admin/notifications/sent', { params: { page: pg } });
      setHistory(res.data.data ?? []);
      setTotalPages(res.data.meta?.totalPages ?? 1);
      setTotal(res.data.meta?.total ?? 0);
      setPage(pg);
    } catch { /* silent */ } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(1); }, [fetchHistory]);

  // Fetch students + counselors for searchable dropdowns
  useEffect(() => {
    api.get('/admin/students', { params: { limit: 500 } })
      .then(r => setStudents(r.data.data ?? []))
      .catch(() => {});
    api.get('/admin/counselors', { params: { limit: 500 } })
      .then(r => setCounselors(r.data.data ?? []))
      .catch(() => {});
  }, []);

  const needsId     = form.recipientType === 'student' || form.recipientType === 'counselor';
  const needsDomain = form.recipientType === 'students_by_domain';

  const handleSend = async (e) => {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(null);
    setSending(true);
    try {
      const res = await api.post('/admin/notifications/send', {
        recipientType: form.recipientType,
        recipientId:   needsId     ? form.recipientId.trim() : undefined,
        domain:        needsDomain ? form.domain             : undefined,
        title:         form.title.trim(),
        message:       form.message.trim(),
        link:          form.link.trim() || undefined,
      });
      setSendSuccess(res.data?.message ?? 'Notification sent successfully!');
      setForm(p => ({ ...p, title: '', message: '', link: '', recipientId: '', domain: '' }));
      setTimeout(() => setSendSuccess(null), 6000);
      fetchHistory(1);
    } catch (err) {
      setSendError(err.response?.data?.message ?? 'Failed to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardShell sidebar={<AdminSidebar />}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Send announcements to students and counselors in your institution.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Send form ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Send className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Send Notification</h2>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Recipient type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Send to</label>
              <div className="space-y-2">
                {RECIPIENT_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="recipientType"
                      value={opt.value}
                      checked={form.recipientType === opt.value}
                      onChange={e => setForm(p => ({ ...p, recipientType: e.target.value, recipientId: '', domain: '' }))}
                      className="mt-0.5 accent-indigo-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Domain selector (conditional) */}
            {needsDomain && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <select
                  value={form.domain}
                  onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}
                  required={needsDomain}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select a domain…</option>
                  {DOMAINS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Notification will be sent to all active students who selected this domain in their profile.
                </p>
              </div>
            )}

            {/* Recipient selector (conditional) */}
            {needsId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.recipientType === 'student' ? 'Student' : 'Counselor'}
                </label>
                <UserSearchSelect
                  users={form.recipientType === 'student' ? students : counselors}
                  value={form.recipientId}
                  onChange={id => setForm(p => ({ ...p, recipientId: id }))}
                  placeholder={`Search ${form.recipientType === 'student' ? 'students' : 'counselors'} by name or email…`}
                />
                {needsId && !form.recipientId && (
                  <p className="text-xs text-gray-400 mt-1">Select a {form.recipientType} from the dropdown above.</p>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Short headline (max 200 chars)"
                maxLength={200}
                required
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Full notification body…"
                required
                rows={4}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Optional link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.link}
                onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                placeholder="e.g. /student/predictions"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Front-end route to navigate when the notification is clicked.</p>
            </div>

            {/* Feedback */}
            {sendError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {sendError}
              </div>
            )}
            {sendSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {sendSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending…' : 'Send Notification'}
            </button>
          </form>
        </div>

        {/* ── Sent history ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">Sent History</h2>
              {total > 0 && (
                <span className="text-xs text-gray-400">({total})</span>
              )}
            </div>
            <button
              onClick={() => fetchHistory(1)}
              disabled={histLoading}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${histLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[520px]">
            {histLoading && history.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Bell className="w-8 h-8 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No notifications sent yet</p>
              </div>
            ) : (
              history.map((n, idx) => (
                <div key={`${n.title}-${n.created_at}-${idx}`} className="flex gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <span className="text-lg shrink-0 mt-0.5 leading-none">{TYPE_ICON[n.type] ?? '📢'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{n.title}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {n.recipientCount > 1 && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-semibold">
                            {n.recipientCount} recipients
                          </span>
                        )}
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium capitalize">
                          {n.recipient_role}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
              <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => fetchHistory(page - 1)}
                  disabled={page === 1 || histLoading}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchHistory(page + 1)}
                  disabled={page === totalPages || histLoading}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
};

export default AdminNotificationsPage;

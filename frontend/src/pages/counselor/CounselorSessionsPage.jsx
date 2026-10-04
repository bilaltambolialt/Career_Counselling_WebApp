import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, Plus, Loader2, X, ExternalLink,
  CheckCircle2, XCircle, FileText, ChevronLeft, ChevronRight,
  Inbox, Clock,
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import CounselorSidebar from '../../components/layout/CounselorSidebar.jsx';
import api from '../../utils/api.js';

const STATUS_BADGE = {
  scheduled:  'bg-blue-50 text-blue-700',
  completed:  'bg-green-50 text-green-700',
  cancelled:  'bg-red-50 text-red-600',
};

const fmtDate = (ts) =>
  new Date(ts).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

// ── Create Session Modal ────────────────────────────────────────────────────
const CreateModal = ({ students, onClose, onCreated }) => {
  const [form, setForm] = useState({
    student_id: '', title: '', scheduled_at: '', meeting_link: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await api.post('/counselor/sessions', {
        ...form,
        meeting_link: form.meeting_link.trim() || undefined,
      });
      onCreated(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to create session.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Schedule New Session</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={form.student_id}
              onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select a student…</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} — {s.email}</option>
              ))}
            </select>
            {students.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No assigned students found.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Career Guidance — Round 1"
              maxLength={200}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
              required
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Link <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={form.meeting_link}
              onChange={e => setForm(p => ({ ...p, meeting_link: e.target.value }))}
              placeholder="https://meet.google.com/…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Scheduling…' : 'Schedule Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Edit Session Modal ──────────────────────────────────────────────────────
const EditModal = ({ session, onClose, onUpdated }) => {
  const [notes,       setNotes]       = useState(session.notes ?? '');
  const [meetingLink, setMeetingLink] = useState(session.meeting_link ?? '');
  const [status,      setStatus]      = useState(session.status);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await api.patch(`/counselor/sessions/${session.id}`, {
        notes:        notes.trim() || null,
        meeting_link: meetingLink.trim() || null,
        status,
      });
      onUpdated(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update session.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Update Session</h2>
            <p className="text-xs text-gray-400 mt-0.5">{session.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex gap-2">
              {['scheduled', 'completed', 'cancelled'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-colors capitalize ${
                    status === s
                      ? s === 'completed' ? 'bg-green-600 text-white border-green-600'
                        : s === 'cancelled' ? 'bg-red-500 text-white border-red-500'
                        : 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Link <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Notes <span className="text-gray-400 font-normal">(counselor-only)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Key discussion points, follow-up actions…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Accept Request Modal ─────────────────────────────────────────────────────
const AcceptModal = ({ request, onClose, onAccepted }) => {
  const [form, setForm] = useState({
    title:        `Counseling Session — ${request.students?.name ?? 'Student'}`,
    scheduled_at: '',
    meeting_link: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await api.patch(`/counselor/sessions/requests/${request.id}/accept`, {
        title:        form.title.trim() || undefined,
        scheduled_at: form.scheduled_at,
        meeting_link: form.meeting_link.trim() || undefined,
      });
      onAccepted(request.id, res.data.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to accept request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Accept & Schedule Session</h2>
            <p className="text-xs text-gray-400 mt-0.5">For {request.students?.name} — {request.students?.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {request.message && (
          <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-xs font-medium text-amber-700 mb-0.5">Student's note</p>
            <p className="text-sm text-amber-900 italic">"{request.message}"</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              maxLength={200}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
              required
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Link <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={form.meeting_link}
              onChange={e => setForm(p => ({ ...p, meeting_link: e.target.value }))}
              placeholder="https://meet.google.com/…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Scheduling…' : 'Accept & Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Session Request Card ─────────────────────────────────────────────────────
const RequestCard = ({ request, onAccept, onDecline }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{request.students?.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{request.students?.email}</p>
      </div>
      <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Pending
      </span>
    </div>

    {request.message ? (
      <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
        <p className="text-xs text-gray-400 font-medium mb-0.5">Student's note</p>
        <p className="text-sm text-gray-700 italic leading-relaxed">"{request.message}"</p>
      </div>
    ) : (
      <p className="text-xs text-gray-400 mb-3 italic">No message provided.</p>
    )}

    <p className="text-xs text-gray-400 mb-3">
      Requested {new Date(request.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
    </p>

    <div className="flex gap-2">
      <button
        onClick={() => onAccept(request)}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
      >
        <CheckCircle2 className="w-4 h-4" /> Accept & Schedule
      </button>
      <button
        onClick={() => onDecline(request)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
      >
        <XCircle className="w-4 h-4" /> Decline
      </button>
    </div>
  </div>
);

// ── Session Card ────────────────────────────────────────────────────────────
const SessionCard = ({ session, onEdit, onCancel }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{session.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{session.students?.name} — {session.students?.email}</p>
      </div>
      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[session.status]}`}>
        {session.status}
      </span>
    </div>

    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
      <span className="flex items-center gap-1">
        <CalendarDays className="w-3.5 h-3.5" /> {fmtDate(session.scheduled_at)}
      </span>
    </div>

    {session.meeting_link && (
      <a
        href={session.meeting_link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium mb-3"
      >
        <ExternalLink className="w-3 h-3" /> Join Meeting
      </a>
    )}

    {session.notes && (
      <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3">
        <p className="text-xs text-gray-400 font-medium mb-0.5 flex items-center gap-1">
          <FileText className="w-3 h-3" /> Notes
        </p>
        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{session.notes}</p>
      </div>
    )}

    {session.status !== 'cancelled' && (
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onEdit(session)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          {session.status === 'scheduled' ? 'Edit / Add Notes' : 'View / Edit Notes'}
        </button>
        {session.status === 'scheduled' && (
          <button
            onClick={() => onCancel(session)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" /> Cancel
          </button>
        )}
        {session.status === 'scheduled' && (
          <button
            onClick={() => onEdit({ ...session, _quickComplete: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
          </button>
        )}
      </div>
    )}
  </div>
);

// ── Main Page ───────────────────────────────────────────────────────────────
const CounselorSessionsPage = () => {
  const [tab,       setTab]       = useState('upcoming');
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);
  const [total,     setTotal]     = useState(0);
  const [students,  setStudents]  = useState([]);
  const [showCreate,setShowCreate]= useState(false);
  const [editTarget,setEditTarget]= useState(null);

  // Session requests state
  const [requests,      setRequests]      = useState([]);
  const [reqLoading,    setReqLoading]    = useState(false);
  const [reqTotal,      setReqTotal]      = useState(0);
  const [acceptTarget,  setAcceptTarget]  = useState(null);   // request being accepted

  const fetchSessions = useCallback(async (status, pg = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/counselor/sessions', { params: { status, page: pg } });
      setSessions(res.data.data ?? []);
      setTotalPages(res.data.meta?.totalPages ?? 1);
      setTotal(res.data.meta?.total ?? 0);
      setPage(pg);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setReqLoading(true);
    try {
      const res = await api.get('/counselor/sessions/requests', { params: { status: 'pending' } });
      setRequests(res.data.data ?? []);
      setReqTotal(res.data.meta?.total ?? 0);
    } catch { /* silent */ } finally {
      setReqLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/counselor/sessions/students-list')
      .then(r => setStudents(r.data.data ?? []))
      .catch(() => {});
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (tab !== 'requests') fetchSessions(tab, 1);
  }, [tab, fetchSessions]);

  const handleCreated = (newSession) => {
    setShowCreate(false);
    if (tab === 'upcoming') setSessions(p => [newSession, ...p]);
    fetchSessions(tab, 1);
  };

  const handleUpdated = (updated) => {
    setEditTarget(null);
    setSessions(p => p.map(s => s.id === updated.id ? { ...s, ...updated } : s));
  };

  const handleCancel = async (session) => {
    if (!window.confirm(`Cancel "${session.title}"? The student will be notified.`)) return;
    try {
      await api.delete(`/counselor/sessions/${session.id}`);
      setSessions(p => p.map(s => s.id === session.id ? { ...s, status: 'cancelled' } : s));
      if (tab === 'upcoming') fetchSessions('upcoming', page);
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to cancel session.');
    }
  };

  const handleAccepted = (requestId) => {
    setAcceptTarget(null);
    setRequests(p => p.filter(r => r.id !== requestId));
    setReqTotal(t => Math.max(0, t - 1));
    // refresh upcoming sessions so the new one appears
    if (tab === 'upcoming') fetchSessions('upcoming', 1);
  };

  const handleDecline = async (request) => {
    if (!window.confirm(`Decline session request from ${request.students?.name}? They will be notified.`)) return;
    try {
      await api.patch(`/counselor/sessions/requests/${request.id}/decline`);
      setRequests(p => p.filter(r => r.id !== request.id));
      setReqTotal(t => Math.max(0, t - 1));
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to decline request.');
    }
  };

  const TABS = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past',     label: 'Past'     },
    { key: 'all',      label: 'All'      },
    { key: 'requests', label: 'Requests', badge: reqTotal },
  ];

  return (
    <DashboardShell sidebar={<CounselorSidebar />}>
      {showCreate && (
        <CreateModal students={students} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {editTarget && (
        <EditModal
          session={{ ...editTarget, status: editTarget._quickComplete ? 'completed' : editTarget.status }}
          onClose={() => setEditTarget(null)}
          onUpdated={handleUpdated}
        />
      )}
      {acceptTarget && (
        <AcceptModal
          request={acceptTarget}
          onClose={() => setAcceptTarget(null)}
          onAccepted={handleAccepted}
        />
      )}

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-500 mt-1 text-sm">Schedule and manage counseling sessions with your students.</p>
        </div>
        {tab !== 'requests' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> New Session
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.badge > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Requests Tab ── */}
      {tab === 'requests' ? (
        reqLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
            <Inbox className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No pending session requests</p>
            <p className="text-xs text-gray-400 mt-1">Students can request sessions from their profile page.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">{reqTotal} pending request{reqTotal !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {requests.map(r => (
                <RequestCard
                  key={r.id}
                  request={r}
                  onAccept={setAcceptTarget}
                  onDecline={handleDecline}
                />
              ))}
            </div>
          </>
        )
      ) : (
        /* ── Sessions Tabs ── */
        loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
            <CalendarDays className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No {tab} sessions</p>
            {tab === 'upcoming' && (
              <button onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                Schedule one now →
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">{total} session{total !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sessions.map(s => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onEdit={setEditTarget}
                  onCancel={handleCancel}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => fetchSessions(tab, page - 1)} disabled={page === 1 || loading}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button onClick={() => fetchSessions(tab, page + 1)} disabled={page === totalPages || loading}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )
      )}
    </DashboardShell>
  );
};

export default CounselorSessionsPage;

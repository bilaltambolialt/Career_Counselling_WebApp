import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, Loader2, ExternalLink, Clock,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import StudentSidebar from '../../components/layout/StudentSidebar.jsx';
import api from '../../utils/api.js';

const STATUS_BADGE = {
  scheduled: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
};

const fmtDate = (ts) =>
  new Date(ts).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const SessionCard = ({ session }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{session.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          With {session.counselors?.name ?? 'Your Counselor'}
        </p>
      </div>
      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[session.status]}`}>
        {session.status}
      </span>
    </div>

    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
      <span className="flex items-center gap-1">
        <CalendarDays className="w-3.5 h-3.5" /> {fmtDate(session.scheduled_at)}
      </span>
      <span className="flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" /> {session.duration_minutes} min
      </span>
    </div>

    {session.meeting_link && session.status === 'scheduled' && (
      <a
        href={session.meeting_link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors mb-3"
      >
        <ExternalLink className="w-3.5 h-3.5" /> Join Meeting
      </a>
    )}

  </div>
);

const StudentSessionsPage = () => {
  const [tab,        setTab]        = useState('upcoming');
  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);

  const fetchSessions = useCallback(async (status, pg = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/student/sessions', { params: { status, page: pg } });
      setSessions(res.data.data ?? []);
      setTotalPages(res.data.meta?.totalPages ?? 1);
      setTotal(res.data.meta?.total ?? 0);
      setPage(pg);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(tab, 1); }, [tab, fetchSessions]);

  const TABS = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past',     label: 'Past'     },
  ];

  return (
    <DashboardShell sidebar={<StudentSidebar />}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Counseling sessions scheduled by your counselor.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <CalendarDays className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No {tab} sessions</p>
          <p className="text-gray-400 text-sm mt-1">
            {tab === 'upcoming'
              ? 'Your counselor will schedule sessions with you soon.'
              : 'Completed and cancelled sessions will appear here.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{total} session{total !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sessions.map(s => <SessionCard key={s.id} session={s} />)}
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
      )}
    </DashboardShell>
  );
};

export default StudentSessionsPage;

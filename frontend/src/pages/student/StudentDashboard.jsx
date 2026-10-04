import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, UserCheck, TrendingUp, ArrowRight, CheckCircle, AlertCircle, Bell } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import StudentSidebar from '../../components/layout/StudentSidebar.jsx';
import { fetchStudentDashboard } from '../../services/studentService.js';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../utils/api.js';

const EXAM_LABELS = {
  JEE_MAIN: 'JEE Main', JEE_ADVANCED: 'JEE Advanced',
  MHT_CET: 'MHT-CET', NEET_UG: 'NEET UG', NEET_PG: 'NEET PG', OTHER: 'Other',
};

const TYPE_ICON = {
  welcome:            '👋',
  counselor_assigned: '👤',
  predictions_ready:  '🎯',
  cutoff_updated:     '📊',
  admin_message:      '📢',
};

const formatTimeAgo = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  useEffect(() => {
    fetchStudentDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get('/student/notifications', { params: { page: 1 } })
      .then((res) => {
        setNotifications((res.data.data ?? []).slice(0, 4));
        setUnreadCount(res.data.meta?.unreadCount ?? 0);
      })
      .catch(() => {});
  }, []);

  const pct = data?.profileCompleteness ?? 0;

  return (
    <DashboardShell sidebar={<StudentSidebar />}>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's your admission overview.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Profile completeness card */}
            <div
              onClick={() => navigate('/student/profile')}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {pct === 100
                    ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                    : <AlertCircle className="w-5 h-5 text-amber-400" />
                  }
                  <span className="font-semibold text-gray-800">Profile Completeness</span>
                </div>
                <span className="text-sm font-bold text-indigo-600">{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {pct < 100 && (
                <p className="text-xs text-gray-400 mt-2">
                  Complete your profile to unlock personalised admission recommendations.
                </p>
              )}
            </div>

            {/* Stat cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{data?.scoreCount ?? 0}</p>
                  <p className="text-xs text-gray-500">Exam Scores</p>
                </div>
              </div>
              <div
                onClick={() => navigate('/student/predictions')}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition"
              >
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{data?.predictionCount ?? 0}</p>
                  <p className="text-xs text-gray-500">Recommendations</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-24">
                    {data?.counselor?.name || 'Unassigned'}
                  </p>
                  <p className="text-xs text-gray-500">Counselor</p>
                </div>
              </div>
            </div>

            {/* Recent scores */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Recent Exam Scores</h2>
                <button
                  onClick={() => navigate('/student/scores')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {!data?.scores?.length ? (
                <div className="p-10 text-center text-gray-400 text-sm">
                  No exam scores yet.{' '}
                  <button
                    onClick={() => navigate('/student/scores')}
                    className="text-indigo-600 hover:underline"
                  >
                    Add your first score
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.scores.slice(0, 5).map((s) => (
                    <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {EXAM_LABELS[s.exam_type] || s.exam_type}
                        </p>
                        <p className="text-xs text-gray-400">{s.attempt_year}</p>
                      </div>
                      <div className="text-right text-sm text-gray-600 space-y-0.5">
                        {s.percentile != null && <p>{s.percentile}%ile</p>}
                        {s.rank != null && <p>Rank {s.rank}</p>}
                        {s.score != null && <p>{s.score} pts</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-4">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-800">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate('/student/notifications')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="px-6 py-8 flex flex-col items-center text-center">
                  <Bell className="w-7 h-7 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => navigate('/student/notifications')}
                      className={`px-6 py-3 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-indigo-50/30' : ''}`}
                    >
                      <span className="text-lg shrink-0 leading-none mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm line-clamp-1 ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {n.title}
                          </p>
                          <span className="text-[11px] text-gray-400 shrink-0">{formatTimeAgo(n.created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                      </div>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default StudentDashboard;

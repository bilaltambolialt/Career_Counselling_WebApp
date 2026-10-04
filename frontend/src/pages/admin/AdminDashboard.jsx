import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  TrendingUp,
  ArrowRight,
  Clock,
  Coins,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import AdminSidebar from '../../components/layout/AdminSidebar.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { fetchAdminStats } from '../../services/adminService.js';
import api from '../../utils/api.js';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats,           setStats]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [requesting,      setRequesting]      = useState(false);
  const [requestSent,     setRequestSent]     = useState(false);
  const [requestError,    setRequestError]    = useState('');

  useEffect(() => {
    fetchAdminStats()
      .then((res) => setStats(res.data.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRequestTokens = async () => {
    setRequesting(true);
    setRequestError('');
    try {
      await api.post('/admin/request-tokens');
      setRequestSent(true);
    } catch (err) {
      setRequestError(err.response?.data?.message ?? 'Failed to send request. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <DashboardShell sidebar={<AdminSidebar />}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Overview of your institution's activity.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Token balance banner */}
        {!loading && stats && (
          stats.tokensRemaining <= 0 ? (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">No Tokens Available</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    You have used all {stats.tokensAllocated} allocated tokens. You cannot add new students until more tokens are allocated.
                  </p>
                </div>
              </div>
              {requestSent ? (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl whitespace-nowrap">
                  Request sent ✓
                </span>
              ) : (
                <button
                  onClick={handleRequestTokens}
                  disabled={requesting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition disabled:opacity-60 whitespace-nowrap"
                >
                  {requesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
                  Request Tokens
                </button>
              )}
              {requestError && <p className="text-xs text-red-600 mt-1">{requestError}</p>}
            </div>
          ) : stats.tokensRemaining <= 10 ? (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-amber-500" />
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">{stats.tokensRemaining} token{stats.tokensRemaining !== 1 ? 's' : ''} remaining</span>
                  {' '}— Contact the Super Admin to allocate more before you run out.
                </p>
              </div>
              {!requestSent && (
                <button
                  onClick={handleRequestTokens}
                  disabled={requesting}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl transition disabled:opacity-60 whitespace-nowrap"
                >
                  {requesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />}
                  Request More
                </button>
              )}
              {requestSent && <span className="text-xs text-emerald-700 font-medium whitespace-nowrap">Request sent ✓</span>}
            </div>
          ) : (
            <div className="mb-6 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
              <Coins className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">{stats.tokensRemaining} tokens remaining</span>
                {' '}({stats.tokensUsed} of {stats.tokensAllocated} used) — each token lets you add 1 student.
              </p>
            </div>
          )
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-24 animate-pulse"
              />
            ))
          ) : (
            <>
              <StatCard
                icon={Users}
                label="Total Students"
                value={stats?.students}
                color="bg-sky-500"
              />
              <StatCard
                icon={UserCheck}
                label="Counselors"
                value={stats?.counselors}
                color="bg-purple-500"
              />
              <StatCard
                icon={TrendingUp}
                label="Predictions Run"
                value={stats?.predictions}
                color="bg-emerald-500"
              />
            </>
          )}
        </div>

        {/* Recent Students */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Recent Students
            </h2>
            <button
              onClick={() => navigate('/admin/students')}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !stats?.recentStudents?.length ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              No students yet.{' '}
              <button
                onClick={() => navigate('/admin/students/new')}
                className="text-indigo-600 hover:underline"
              >
                Add first student
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium">Name</th>
                    <th className="text-left px-6 py-3 font-medium">Email</th>
                    <th className="text-left px-6 py-3 font-medium">Category</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recentStudents.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/admin/students/${s.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition"
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {s.name}
                      </td>
                      <td className="px-6 py-3 text-gray-500">{s.email}</td>
                      <td className="px-6 py-3 text-gray-500">
                        {s.category || '—'}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge active={s.is_active} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
};

export default AdminDashboard;

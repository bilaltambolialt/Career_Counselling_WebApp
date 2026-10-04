import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import CounselorSidebar from '../../components/layout/CounselorSidebar.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../utils/api.js';

const CounselorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.get('/counselor/dashboard')
      .then(res => setData(res.data.data))
      .catch(err => setError(err.response?.data?.message ?? 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell sidebar={<CounselorSidebar />}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Counselor Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Welcome back, {user?.name} — manage your assigned students and generate reports.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading dashboard…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {data && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{data.assignedCount}</p>
                <p className="text-xs text-gray-500">Assigned Students</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">—</p>
                <p className="text-xs text-gray-500">Reports Generated</p>
              </div>
            </div>
          </div>

          {/* Recent students */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Recent Students</h2>
              <button
                onClick={() => navigate('/counselor/students')}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {data.recentStudents.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No students assigned yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.recentStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {s.category ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
};

export default CounselorDashboard;

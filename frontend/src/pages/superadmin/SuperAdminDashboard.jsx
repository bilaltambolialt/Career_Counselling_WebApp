import { useState, useEffect } from 'react';
import { Building2, Users, UserCheck, IndianRupee, CalendarDays, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import SuperAdminSidebar from '../../components/layout/SuperAdminSidebar.jsx';
import api from '../../utils/api.js';

const StatCard = ({ label, value, icon: Icon, color, loading, raw }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      {loading ? (
        <div className="h-6 w-16 bg-gray-100 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-bold text-gray-900">
          {raw ? (value ?? '—') : (typeof value === 'number' ? value.toLocaleString() : (value ?? '—'))}
        </p>
      )}
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/superadmin/dashboard')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { label: 'Total Tenants',      value: stats?.totalAdmins,      icon: Building2,    color: 'bg-slate-100 text-slate-700' },
    { label: 'Total Students',     value: stats?.totalStudents,     icon: Users,        color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Total Counselors',   value: stats?.totalCounselors,   icon: UserCheck,    color: 'bg-purple-50 text-purple-600' },
    {
      label: 'Revenue Generated',
      value: stats?.totalRevenue != null
        ? `₹${stats.totalRevenue.toLocaleString('en-IN')}`
        : '—',
      icon: IndianRupee,
      color: 'bg-amber-50 text-amber-600',
      raw: true,
    },
    { label: 'Sessions Created',   value: stats?.totalSessions,    icon: CalendarDays, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <DashboardShell sidebar={<SuperAdminSidebar />}>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Platform-wide overview — all tenants and analytics.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map(s => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Recent admins */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Tenants</h2>
          <button
            onClick={() => navigate('/superadmin/admins')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Institution</th>
                <th className="text-left px-5 py-3 font-medium">Admin</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !stats?.recentAdmins?.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No tenants registered yet.
                  </td>
                </tr>
              ) : (
                stats.recentAdmins.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-medium text-gray-800">{a.organization_name}</td>
                    <td className="px-5 py-3 text-gray-600">{a.name}</td>
                    <td className="px-5 py-3 text-gray-500">{a.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
};

export default SuperAdminDashboard;

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronRight } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import AdminSidebar from '../../components/layout/AdminSidebar.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { fetchCounselors } from '../../services/adminService.js';

const CounselorsPage = () => {
  const navigate = useNavigate();
  const [counselors, setCounselors] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = { page, limit: 15 };
    if (search) params.search = search;

    fetchCounselors(params)
      .then((res) => {
        setCounselors(res.data.data ?? []);
        setMeta(res.data.meta ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => setError('Failed to load counselors.'))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (v) => { setSearch(v); setPage(1); };

  return (
    <DashboardShell sidebar={<AdminSidebar />}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Counselors</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {meta.total} counselor{meta.total !== 1 ? 's' : ''} in your institution
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/counselors/new')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Counselor
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
          />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-medium">Name</th>
                  <th className="text-left px-6 py-3 font-medium">Email</th>
                  <th className="text-left px-6 py-3 font-medium">Phone</th>
                  <th className="text-left px-6 py-3 font-medium">Students</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-6 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !counselors.length ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">
                      No counselors found.{' '}
                      {!search && (
                        <button
                          onClick={() => navigate('/admin/counselors/new')}
                          className="text-purple-600 hover:underline"
                        >
                          Add the first counselor
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  counselors.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/admin/counselors/${c.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition group"
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-6 py-3 text-gray-500">{c.email}</td>
                      <td className="px-6 py-3 text-gray-500">{c.phone || '—'}</td>
                      <td className="px-6 py-3 text-gray-500">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                          {c.student_count ?? 0} assigned
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge active={c.is_active} />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 inline" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination page={page} totalPages={meta.totalPages} onPage={setPage} />
      </div>
    </DashboardShell>
  );
};

export default CounselorsPage;

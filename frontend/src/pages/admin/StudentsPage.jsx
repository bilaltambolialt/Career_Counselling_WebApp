import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronRight, Filter } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import AdminSidebar from '../../components/layout/AdminSidebar.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { fetchStudents } from '../../services/adminService.js';

const CATEGORIES = ['', 'OPEN', 'OBC', 'SC', 'ST', 'EWS'];

const StudentsPage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (category) params.category = category;

    fetchStudents(params)
      .then((res) => {
        setStudents(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(() => setError('Failed to load students.'))
      .finally(() => setLoading(false));
  }, [page, search, category]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 when filters change
  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleCategory = (v) => { setCategory(v); setPage(1); };

  return (
    <DashboardShell sidebar={<AdminSidebar />}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {meta.total} student{meta.total !== 1 ? 's' : ''} in your institution
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/students/new')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={category}
              onChange={(e) => handleCategory(e.target.value)}
              className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.filter(Boolean).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
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
                  <th className="text-left px-6 py-3 font-medium">Category</th>
                  <th className="text-left px-6 py-3 font-medium">Counselor</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-6 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !students.length ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">
                      No students found.{' '}
                      {!search && !category && (
                        <button
                          onClick={() => navigate('/admin/students/new')}
                          className="text-indigo-600 hover:underline"
                        >
                          Add the first student
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/admin/students/${s.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition group"
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {s.name}
                      </td>
                      <td className="px-6 py-3 text-gray-500">{s.email}</td>
                      <td className="px-6 py-3 text-gray-500">{s.phone || '—'}</td>
                      <td className="px-6 py-3 text-gray-500">{s.category || '—'}</td>
                      <td className="px-6 py-3 text-gray-500">
                        {s.counselors?.name || <span className="text-gray-300 italic">Unassigned</span>}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge active={s.is_active} />
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

export default StudentsPage;

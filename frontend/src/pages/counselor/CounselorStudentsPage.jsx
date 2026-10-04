import { useEffect, useState, useCallback } from 'react';
import { Users, Loader2, AlertCircle, Search, ChevronLeft, ChevronRight, FileText, TrendingUp } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import CounselorSidebar from '../../components/layout/CounselorSidebar.jsx';
import api from '../../utils/api.js';

const CounselorStudentsPage = () => {
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [page,      setPage]      = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,     setTotal]     = useState(0);
  const [search,    setSearch]    = useState('');
  const [dlLoading,     setDlLoading]     = useState({});
  const [dlError,       setDlError]       = useState({});
  const [toggling,      setToggling]      = useState({});

  const fetchStudents = useCallback(async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/counselor/students', { params: { page: pg, limit: 20 } });
      const { data: rows, meta } = res.data;
      setStudents(rows ?? []);
      setTotalPages(meta?.totalPages ?? 1);
      setTotal(meta?.total ?? 0);
      setPage(pg);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(1); }, [fetchStudents]);

  const handleDownloadReport = async (student) => {
    setDlLoading(prev => ({ ...prev, [student.id]: true }));
    setDlError(prev =>   ({ ...prev, [student.id]: null }));
    try {
      const res = await api.get(`/counselor/reports/${student.id}`, { responseType: 'blob', timeout: 120000 });

      // Axios throws automatically for non-2xx — if we reach here the PDF is ready
      const url   = URL.createObjectURL(res.data);
      const a     = document.createElement('a');
      const cd    = res.headers['content-disposition'] ?? '';
      const match = cd.match(/filename="?([^"]+)"?/);
      a.href     = url;
      a.download = match ? match[1] : `counselor-report-${student.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      let msg = 'Failed to generate report';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          msg = JSON.parse(text).message ?? msg;
        } catch { /* ignore decode errors */ }
      } else if (err.message) {
        msg = err.message;
      }
      setDlError(prev => ({ ...prev, [student.id]: msg }));
    } finally {
      setDlLoading(prev => ({ ...prev, [student.id]: false }));
    }
  };

  const handleTogglePredictions = async (student) => {
    setToggling(prev => ({ ...prev, [student.id]: true }));
    try {
      const res = await api.patch(`/counselor/students/${student.id}/toggle-predictions`);
      const newValue = res.data.data.predictions_enabled;
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, predictions_enabled: newValue } : s));
    } catch {
      // silently ignore — retry possible
    } finally {
      setToggling(prev => ({ ...prev, [student.id]: false }));
    }
  };

  // Client-side search filter
  const filtered = search.trim()
    ? students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  return (
    <DashboardShell sidebar={<CounselorSidebar />}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Generate detailed counselor reports for each assigned student.
        </p>
      </div>

      {/* Search + total */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        {!loading && (
          <span className="text-sm text-gray-400">
            {total} student{total !== 1 ? 's' : ''} assigned
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading students…
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                {search ? 'No students match your search' : 'No students assigned to you yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {search ? 'Try a different search term' : 'Ask your admin to assign students to your account'}
              </p>
            </div>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Email</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Category</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                    <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Recommendations</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-5 py-3 text-gray-500">{s.email}</td>
                      <td className="px-5 py-3">
                        {s.category ? (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s.category}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleTogglePredictions(s)}
                          disabled={toggling[s.id]}
                          title={s.predictions_enabled ? 'Disable recommendations for this student' : 'Enable recommendations for this student'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-60 ${
                            s.predictions_enabled
                              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {toggling[s.id]
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <TrendingUp className="w-3 h-3" />}
                          {s.predictions_enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={() => handleDownloadReport(s)}
                            disabled={dlLoading[s.id]}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {dlLoading[s.id] ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
                            ) : (
                              <><FileText className="w-3 h-3" /> Detailed Report</>
                            )}
                          </button>
                          {dlError[s.id] && (
                            <span className="text-xs text-red-500">{dlError[s.id]}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !search && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchStudents(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchStudents(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
};

export default CounselorStudentsPage;

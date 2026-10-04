import { useEffect, useState, useCallback } from 'react';
import { Inbox, Phone, Mail, Calendar, ChevronDown, User } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import AdminSidebar from '../../components/layout/AdminSidebar.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../utils/api.js';

const CONCERN_LABELS = {
  career_confusion:     "Career path confusion",
  engineering_or_other: "Engineering vs other field",
  college_selection:    "College selection help",
  after_12:             "What to do after Class 12",
  drop_year:            "Drop year decision",
  branch_selection:     "Engineering branch selection",
  abroad_vs_india:      "Study abroad vs India",
  parents_expectations: "Family expectations",
  other:                "Other",
};

const STATUS_STYLES = {
  new:       { cls: 'bg-sky-50 text-sky-700 border-sky-200',       label: 'New'       },
  contacted: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Contacted' },
  closed:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Closed' },
};

const INQUIRY_ADMIN_EMAIL = 'apekshakamble007@gmail.com';

const InquiriesPage = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [meta, setMeta]           = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [page, setPage]           = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [updating, setUpdating]   = useState(null); // inquiry id being updated

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (filterStatus) params.status = filterStatus;
    api.get('/admin/inquiries', { params })
      .then(r => {
        setInquiries(r.data.data ?? []);
        setMeta(r.data.meta ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => setError('Failed to load inquiries.'))
      .finally(() => setLoading(false));
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id);
    try {
      await api.patch(`/admin/inquiries/${id}`, { status: newStatus });
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    } catch {
      setError('Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  // Only Apeksha can access this page
  if (user?.email !== INQUIRY_ADMIN_EMAIL) {
    return (
      <DashboardShell sidebar={<AdminSidebar />}>
        <div className="p-6 flex items-center justify-center h-64">
          <p className="text-gray-400 text-sm">You do not have access to this page.</p>
        </div>
      </DashboardShell>
    );
  }

  const counts = inquiries.reduce((acc, i) => { acc[i.status] = (acc[i.status] ?? 0) + 1; return acc; }, {});

  return (
    <DashboardShell sidebar={<AdminSidebar />}>
      <div className="p-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Inquiries</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Session requests submitted via the landing page — {meta.total} total
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { key: 'new',       label: 'New',        color: 'sky'     },
            { key: 'contacted', label: 'Contacted',  color: 'amber'   },
            { key: 'closed',    label: 'Closed',     color: 'emerald' },
          ].map(({ key, label, color }) => (
            <div key={key} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-bold text-${color}-700`}>{counts[key] ?? 0}</p>
              <p className={`text-xs font-medium text-${color}-600 mt-0.5`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-3 mb-5">
          {['', 'new', 'contacted', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                filterStatus === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {s === '' ? 'All' : STATUS_STYLES[s].label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium">Student</th>
                  <th className="text-left px-5 py-3 font-medium">Contact</th>
                  <th className="text-left px-5 py-3 font-medium">Qualification</th>
                  <th className="text-left px-5 py-3 font-medium">Concern</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !inquiries.length ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <Inbox className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No inquiries yet.</p>
                    </td>
                  </tr>
                ) : (
                  inquiries.map(inq => (
                    <tr key={inq.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <span className="font-medium text-gray-800 text-sm">{inq.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                            <a href={`mailto:${inq.email}`} className="hover:text-indigo-600 transition">{inq.email}</a>
                          </div>
                          {inq.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                              <a href={`tel:${inq.phone}`} className="hover:text-indigo-600 transition">{inq.phone}</a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 max-w-[140px] truncate">
                        {inq.qualification || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-600 max-w-[180px]">
                        <p className="truncate">{CONCERN_LABELS[inq.concern] ?? inq.concern ?? <span className="text-gray-300">—</span>}</p>
                        {inq.concern_detail && (
                          <p className="text-gray-400 truncate mt-0.5 italic">{inq.concern_detail}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-300" />
                          {new Date(inq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="relative inline-block">
                          <select
                            value={inq.status}
                            onChange={e => handleStatusChange(inq.id, e.target.value)}
                            disabled={updating === inq.id}
                            className={`appearance-none pl-2.5 pr-7 py-1 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none transition disabled:opacity-60 ${STATUS_STYLES[inq.status]?.cls ?? ''}`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                        </div>
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

export default InquiriesPage;

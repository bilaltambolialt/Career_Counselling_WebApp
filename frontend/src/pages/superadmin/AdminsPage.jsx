import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, UserCheck, Loader2, Coins,
  ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, PlusCircle, Pencil, X,
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import SuperAdminSidebar from '../../components/layout/SuperAdminSidebar.jsx';
import api from '../../utils/api.js';

// ── Allocate Tokens Modal ─────────────────────────────────────────────────────
const AllocateModal = ({ admin, onClose, onSuccess }) => {
  const [amount,   setAmount]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const n = parseInt(amount);
    if (!n || n < 1) { setError('Enter a valid number of tokens (≥ 1)'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await api.patch(`/superadmin/admins/${admin.id}/allocate-tokens`, { tokens: n });
      onSuccess(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to allocate tokens');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Allocate Tokens</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-slate-50 rounded-xl text-sm">
          <p className="font-medium text-gray-800">{admin.organization_name}</p>
          <p className="text-gray-500 text-xs mt-0.5">{admin.name} · {admin.email}</p>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="text-gray-500">Allocated: <span className="font-semibold text-gray-800">{admin.tokens_allocated ?? 0}</span></span>
            <span className="text-gray-500">Used: <span className="font-semibold text-gray-800">{admin.tokens_used ?? 0}</span></span>
            <span className="text-gray-500">Remaining: <span className={`font-semibold ${(admin.tokensRemaining ?? 0) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{admin.tokensRemaining ?? 0}</span></span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Each token allows the admin to add 1 student. Tokens are added to the existing balance.
          <span className="block mt-1 text-amber-600 font-medium">₹1,000 per token · Revenue tracked automatically</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Number of Tokens to Add</label>
            <input
              type="number"
              min={1}
              max={10000}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 50"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              autoFocus
            />
            {amount && !isNaN(parseInt(amount)) && parseInt(amount) > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                This will add ₹{(parseInt(amount) * 1000).toLocaleString('en-IN')} in potential revenue.
              </p>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
              Allocate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminsPage = () => {
  const navigate = useNavigate();
  const [admins,        setAdmins]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [total,         setTotal]         = useState(0);
  const [toggling,      setToggling]      = useState({});
  const [allocateAdmin, setAllocateAdmin] = useState(null); // admin being allocated tokens

  const fetchPage = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/superadmin/admins', { params: { page: pg } });
      setAdmins(res.data.data ?? []);
      setTotalPages(res.data.meta?.totalPages ?? 1);
      setTotal(res.data.meta?.total ?? 0);
      setPage(pg);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  const handleToggle = async (admin) => {
    setToggling(t => ({ ...t, [admin.id]: true }));
    try {
      const res = await api.patch(`/superadmin/admins/${admin.id}/toggle-active`);
      const newValue = res.data.data?.is_active;
      setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, is_active: newValue } : a));
    } catch { /* silent */ } finally {
      setToggling(t => ({ ...t, [admin.id]: false }));
    }
  };

  const handleAllocateSuccess = (updated) => {
    setAdmins(prev => prev.map(a =>
      a.id === updated.id
        ? { ...a, tokens_allocated: updated.tokens_allocated, tokens_used: updated.tokens_used, tokensRemaining: updated.tokensRemaining }
        : a
    ));
    setAllocateAdmin(null);
  };

  return (
    <DashboardShell sidebar={<SuperAdminSidebar />}>
      {allocateAdmin && (
        <AllocateModal
          admin={allocateAdmin}
          onClose={() => setAllocateAdmin(null)}
          onSuccess={handleAllocateSuccess}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {total} tenant institution{total !== 1 ? 's' : ''} registered on the platform.
          </p>
        </div>
        <button
          onClick={() => navigate('/superadmin/admins/new')}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-xl transition"
        >
          <PlusCircle className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Institution</th>
                <th className="text-left px-5 py-3 font-medium">Admin Name</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Phone</th>
                <th className="text-left px-5 py-3 font-medium">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Students</span>
                </th>
                <th className="text-left px-5 py-3 font-medium">
                  <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Counselors</span>
                </th>
                <th className="text-left px-5 py-3 font-medium">
                  <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> Tokens Left</span>
                </th>
                <th className="text-left px-5 py-3 font-medium">Plan</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !admins.length ? (
                <tr>
                  <td colSpan={11} className="px-5 py-14 text-center">
                    <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No tenants registered yet.</p>
                    <button
                      onClick={() => navigate('/superadmin/admins/new')}
                      className="mt-4 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                    >
                      Add your first admin
                    </button>
                  </td>
                </tr>
              ) : (
                admins.map(a => {
                  const remaining = a.tokensRemaining ?? ((a.tokens_allocated ?? 0) - (a.tokens_used ?? 0));
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-medium text-gray-800">{a.organization_name}</td>
                      <td className="px-5 py-3 text-gray-700">{a.name}</td>
                      <td className="px-5 py-3 text-gray-500">{a.email}</td>
                      <td className="px-5 py-3 text-gray-500">{a.phone ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-3 text-gray-600">{a.studentCount}</td>
                      <td className="px-5 py-3 text-gray-600">{a.counselorCount}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          remaining > 10
                            ? 'bg-emerald-50 text-emerald-700'
                            : remaining > 0
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          <Coins className="w-3 h-3" />
                          {remaining}
                        </span>
                        <span className="text-gray-300 text-xs ml-1">/ {a.tokens_allocated ?? 0}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                          {a.subscription_plan ?? 'basic'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* Allocate tokens */}
                          <button
                            onClick={() => setAllocateAdmin(a)}
                            title="Allocate tokens"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            Tokens
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => navigate(`/superadmin/admins/${a.id}`)}
                            title="Edit admin"
                            className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {/* Toggle active */}
                          <button
                            onClick={() => handleToggle(a)}
                            disabled={toggling[a.id]}
                            title={a.is_active ? 'Deactivate tenant' : 'Activate tenant'}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-60 ${
                              a.is_active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {toggling[a.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : a.is_active ? (
                              <ToggleRight className="w-3.5 h-3.5" />
                            ) : (
                              <ToggleLeft className="w-3.5 h-3.5" />
                            )}
                            {a.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchPage(page - 1)}
              disabled={page === 1 || loading}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => fetchPage(page + 1)}
              disabled={page === totalPages || loading}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default AdminsPage;

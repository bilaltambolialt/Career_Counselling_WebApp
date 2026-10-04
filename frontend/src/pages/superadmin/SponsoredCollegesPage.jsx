import { useState, useEffect, useMemo } from 'react';
import {
  Star, Search, Filter, Loader2, RefreshCw, BadgeCheck,
  MapPin, ChevronDown, X, IndianRupee, Calendar, Clock,
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import SuperAdminSidebar from '../../components/layout/SuperAdminSidebar.jsx';
import api from '../../utils/api.js';

const FIELD_OPTIONS = [
  'Engineering', 'Medical', 'Law', 'Management',
  'Design / Architecture', 'Pharmacy', 'Agriculture',
  'Commerce', 'Pure Sciences', 'Other',
];

const FIELD_COLOR = {
  Engineering:             'bg-blue-100 text-blue-700',
  Medical:                 'bg-red-100 text-red-700',
  Law:                     'bg-purple-100 text-purple-700',
  Management:              'bg-orange-100 text-orange-700',
  'Design / Architecture': 'bg-pink-100 text-pink-700',
  Pharmacy:                'bg-teal-100 text-teal-700',
  Agriculture:             'bg-green-100 text-green-700',
  Commerce:                'bg-yellow-100 text-yellow-700',
  'Pure Sciences':         'bg-cyan-100 text-cyan-700',
};
const getFieldColor = f => FIELD_COLOR[f] ?? 'bg-gray-100 text-gray-600';

const DURATION_OPTIONS = [
  { label: '1 Month',  days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year',   days: 365 },
  { label: 'Custom',   days: null },
];

const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

const isExpired = (until) => until && new Date(until) < new Date();

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

const fmtAmount = (n) => n != null
  ? `₹${parseFloat(n).toLocaleString('en-IN')}`
  : '—';

// ─── Sponsor Modal ─────────────────────────────────────────────────────────
const SponsorModal = ({ college, onClose, onSuccess }) => {
  const [amount,       setAmount]       = useState('');
  const [duration,     setDuration]     = useState(DURATION_OPTIONS[1]); // 3 months default
  const [customDate,   setCustomDate]   = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  const minDate = addDays(1); // tomorrow

  const getSponsoredUntil = () => {
    if (duration.days !== null) return addDays(duration.days);
    return customDate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sponsoredUntil = getSponsoredUntil();
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount.'); return; }
    if (!sponsoredUntil) { setError('Select a duration.'); return; }
    setError(''); setSubmitting(true);
    try {
      const res = await api.patch(`/superadmin/top-colleges/${college.id}/toggle-sponsored`, {
        amount: parseFloat(amount),
        sponsoredUntil,
      });
      onSuccess(res.data.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to set sponsorship.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <h3 className="font-semibold text-gray-900 text-sm">Set Sponsorship</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* College name */}
          <div className="px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-100 text-sm font-medium text-amber-800">
            {college.college_name}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Sponsorship Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                required
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Sponsorship Duration <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => { setDuration(opt); setCustomDate(''); }}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border transition ${
                    duration.label === opt.label
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom date picker */}
            {duration.days === null && (
              <div className="mt-2 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  min={minDate}
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            )}

            {/* Preview */}
            {getSponsoredUntil() && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expires: <span className="font-medium text-gray-700">{fmtDate(getSponsoredUntil())}</span>
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Sponsorship'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────
const SponsoredCollegesPage = () => {
  const [colleges,    setColleges]   = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [removing,    setRemoving]   = useState(null);
  const [modalTarget, setModal]      = useState(null);
  const [search,      setSearch]     = useState('');
  const [fieldFilter, setField]      = useState('');
  const [showFilter,  setShow]       = useState('all');

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (fieldFilter) params.append('field', fieldFilter);
      const res = await api.get(`/superadmin/top-colleges?${params}`);
      setColleges(res.data.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchColleges(); }, [fieldFilter]); // eslint-disable-line

  const handleRemove = async (college) => {
    setRemoving(college.id);
    try {
      const res = await api.patch(`/superadmin/top-colleges/${college.id}/toggle-sponsored`);
      setColleges(prev => prev.map(c => c.id === college.id ? { ...c, ...res.data.data } : c));
    } catch (err) {
      alert(err?.response?.data?.message ?? 'Failed to remove sponsorship.');
    } finally {
      setRemoving(null);
    }
  };

  const handleSponsorSuccess = (updated) => {
    setColleges(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
  };

  const filtered = useMemo(() => {
    let list = colleges;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.college_name.toLowerCase().includes(q) ||
        c.program.toLowerCase().includes(q)
      );
    }
    if (showFilter === 'sponsored')     list = list.filter(c => c.is_sponsored && !isExpired(c.sponsored_until));
    if (showFilter === 'expired')       list = list.filter(c => c.is_sponsored &&  isExpired(c.sponsored_until));
    if (showFilter === 'not_sponsored') list = list.filter(c => !c.is_sponsored);
    return list;
  }, [colleges, search, showFilter]);

  const activeSponsored  = colleges.filter(c => c.is_sponsored && !isExpired(c.sponsored_until)).length;
  const expiredSponsored = colleges.filter(c => c.is_sponsored &&  isExpired(c.sponsored_until)).length;
  const totalSponsorshipRevenue = colleges
    .filter(c => c.sponsorship_amount != null)
    .reduce((sum, c) => sum + parseFloat(c.sponsorship_amount || 0), 0);

  return (
    <DashboardShell sidebar={<SuperAdminSidebar />}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sponsored Colleges</h1>
              <p className="text-sm text-gray-500">
                Set sponsorship amount and duration — sponsored colleges appear at the top of student results.
              </p>
            </div>
          </div>
          <button onClick={fetchColleges} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Total Colleges</p>
            <p className="text-2xl font-bold text-gray-900">{colleges.length}</p>
          </div>
          <div className="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4">
            <p className="text-xs text-amber-600 mb-1">Active Sponsored</p>
            <p className="text-2xl font-bold text-amber-700">{activeSponsored}</p>
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4">
            <p className="text-xs text-red-500 mb-1">Expired</p>
            <p className="text-2xl font-bold text-red-600">{expiredSponsored}</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-4">
            <p className="text-xs text-emerald-600 mb-1">Sponsorship Revenue</p>
            <p className="text-lg font-bold text-emerald-700">{fmtAmount(totalSponsorshipRevenue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search college or program…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <select value={fieldFilter} onChange={e => setField(e.target.value)}
              className={`appearance-none pl-8 pr-8 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 transition cursor-pointer ${
                fieldFilter ? 'border-amber-300 bg-amber-50 text-amber-700 font-medium' : 'border-gray-200 bg-white text-gray-600'
              }`}>
              <option value="">All Fields</option>
              {FIELD_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={showFilter} onChange={e => setShow(e.target.value)}
              className={`appearance-none pl-3 pr-8 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer transition ${
                showFilter !== 'all' ? 'border-amber-300 bg-amber-50 text-amber-700 font-medium' : 'border-gray-200 bg-white text-gray-600'
              }`}>
              <option value="all">All Status</option>
              <option value="sponsored">Active Sponsored</option>
              <option value="expired">Expired</option>
              <option value="not_sponsored">Not Sponsored</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading colleges…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No colleges found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">College</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Field / Program</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Location</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status & Details</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(college => {
                  const expired = isExpired(college.sponsored_until);
                  const active  = college.is_sponsored && !expired;

                  return (
                    <tr key={college.id}
                      className={`hover:bg-gray-50 transition-colors ${active ? 'bg-amber-50/30' : ''} ${expired ? 'bg-red-50/20' : ''}`}>

                      {/* College name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {active && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                          <div>
                            <p className="font-semibold text-gray-900 text-sm leading-snug">{college.college_name}</p>
                            {college.rank && <p className="text-[11px] text-gray-400">Rank #{college.rank}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Field / Program */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${getFieldColor(college.field)}`}>
                          {college.field}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{college.program}</p>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {(college.location_city || college.location_state) ? (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {[college.location_city, college.location_state].filter(Boolean).join(', ')}
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>

                      {/* Status & Details */}
                      <td className="px-4 py-3.5 text-center">
                        {active ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200">
                              <BadgeCheck className="w-3.5 h-3.5" /> Sponsored
                            </span>
                            {college.sponsorship_amount != null && (
                              <span className="text-[11px] font-semibold text-emerald-700">
                                {fmtAmount(college.sponsorship_amount)}
                              </span>
                            )}
                            {college.sponsored_until && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> Until {fmtDate(college.sponsored_until)}
                              </span>
                            )}
                          </div>
                        ) : expired ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold border border-red-200">
                              Expired
                            </span>
                            {college.sponsorship_amount != null && (
                              <span className="text-[11px] text-gray-500">{fmtAmount(college.sponsorship_amount)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-center">
                        {college.is_sponsored ? (
                          <button
                            onClick={() => handleRemove(college)}
                            disabled={removing === college.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition disabled:opacity-50"
                          >
                            {removing === college.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <X className="w-3 h-3" />}
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => setModal(college)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 transition"
                          >
                            <Star className="w-3 h-3 fill-amber-400" />
                            Set Sponsored
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-gray-400 text-right">
            Showing {filtered.length} of {colleges.length} colleges
          </p>
        )}
      </div>

      {/* Sponsor Modal */}
      {modalTarget && (
        <SponsorModal
          college={modalTarget}
          onClose={() => setModal(null)}
          onSuccess={handleSponsorSuccess}
        />
      )}
    </DashboardShell>
  );
};

export default SponsoredCollegesPage;

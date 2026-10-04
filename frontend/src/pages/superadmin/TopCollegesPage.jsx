import { useEffect, useState, useCallback, useRef } from 'react';
import {
  List, PlusCircle, Upload, Download, Trash2, Loader2,
  Search, Filter, Trophy, MapPin, Building, IndianRupee,
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import SuperAdminSidebar from '../../components/layout/SuperAdminSidebar.jsx';
import api from '../../utils/api.js';

const handleTemplateDownload = async () => {
  try {
    const res = await api.get('/superadmin/top-colleges/template', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const a   = document.createElement('a');
    a.href     = url;
    a.download = 'top_colleges_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    alert('Failed to download template.');
  }
};

const TABS = [
  { id: 'list',   label: 'College List', icon: List },
  { id: 'add',    label: 'Add Entry',    icon: PlusCircle },
  { id: 'upload', label: 'CSV Upload',   icon: Upload },
];

const FIELDS = [
  'Engineering', 'Medical', 'Law', 'Management', 'Design / Architecture',
  'Pharmacy', 'Agriculture', 'Commerce', 'Pure Sciences', 'Other',
];

const COLLEGE_TYPES = ['Government', 'Private', 'Deemed', 'Autonomous', 'Other'];

const FIELD_COLOR = {
  'Engineering':           'bg-blue-50 text-blue-700',
  'Medical':               'bg-red-50 text-red-700',
  'Law':                   'bg-purple-50 text-purple-700',
  'Management':            'bg-orange-50 text-orange-700',
  'Design / Architecture': 'bg-pink-50 text-pink-700',
  'Pharmacy':              'bg-teal-50 text-teal-700',
  'Agriculture':           'bg-green-50 text-green-700',
  'Commerce':              'bg-yellow-50 text-yellow-700',
  'Pure Sciences':         'bg-cyan-50 text-cyan-700',
  'Other':                 'bg-gray-100 text-gray-600',
};

const TYPE_BADGE = {
  'Government':  'bg-emerald-50 text-emerald-700',
  'Private':     'bg-violet-50 text-violet-700',
  'Deemed':      'bg-amber-50 text-amber-700',
  'Autonomous':  'bg-sky-50 text-sky-700',
  'Other':       'bg-gray-100 text-gray-600',
};

const ic = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white';

// ─── Tab: List ────────────────────────────────────────────────
const CollegeList = () => {
  const [colleges,      setColleges]      = useState([]);
  const [meta,          setMeta]          = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [filterField,   setFilterField]   = useState('');
  const [filterType,    setFilterType]    = useState('');
  const [search,        setSearch]        = useState('');
  const [searchInput,   setSearchInput]   = useState('');
  const [deleteId,      setDeleteId]      = useState(null);
  const [deleting,      setDeleting]      = useState(false);
  const [error,         setError]         = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (filterField) params.field       = filterField;
    if (filterType)  params.collegeType = filterType;
    if (search)      params.search      = search;
    api.get('/superadmin/top-colleges', { params })
      .then(r => {
        setColleges(r.data.data ?? []);
        setMeta(r.data.meta ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => setError('Failed to load college list.'))
      .finally(() => setLoading(false));
  }, [page, filterField, filterType, search]);

  useEffect(() => { load(); }, [load]);

  const applySearch = () => { setSearch(searchInput.trim()); setPage(1); };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/superadmin/top-colleges/${deleteId}`);
      setDeleteId(null);
      load();
    } catch {
      setError('Failed to delete entry.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="flex gap-2 flex-1 min-w-48">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applySearch()}
            placeholder="Search college name…"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button onClick={applySearch}
            className="px-3 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>

        <select value={filterField} onChange={e => { setFilterField(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-400">
          <option value="">All Fields</option>
          {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-400">
          <option value="">All Types</option>
          {COLLEGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {(filterField || filterType || search) && (
          <button
            onClick={() => { setFilterField(''); setFilterType(''); setSearch(''); setSearchInput(''); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
            <Filter className="w-3.5 h-3.5" /> Clear
          </button>
        )}

        <button
          onClick={handleTemplateDownload}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors ml-auto">
          <Download className="w-3.5 h-3.5" /> Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
        </div>
      ) : colleges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <Trophy className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No college entries yet</p>
          <p className="text-xs text-gray-400 mt-1">Use "Add Entry" or "CSV Upload" to populate the list.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{meta.total} entr{meta.total !== 1 ? 'ies' : 'y'}</p>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">College</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Field / Program</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">DTE Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fees/yr</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {colleges.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      {c.rank
                        ? <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">{c.rank}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-semibold text-gray-900 leading-snug">{c.college_name}</p>
                      {c.affiliation && <p className="text-xs text-gray-400 mt-0.5">{c.affiliation}</p>}
                      {c.notable_features && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">{c.notable_features}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mb-1 ${FIELD_COLOR[c.field] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c.field}
                      </span>
                      <p className="text-xs text-gray-600">{c.program}</p>
                    </td>
                    <td className="px-4 py-3">
                      {c.dte_code
                        ? <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{c.dte_code}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {c.branch_code
                        ? <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{c.branch_code}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {c.college_type
                        ? <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[c.college_type] ?? 'bg-gray-100 text-gray-600'}`}>{c.college_type}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.location_city && c.location_state
                        ? `${c.location_city}, ${c.location_state}`
                        : c.location_state ?? c.location_city ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {c.annual_fees
                        ? `₹${Number(c.annual_fees).toLocaleString('en-IN')}`
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">Page {meta.page} of {meta.totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  Prev
                </button>
                <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages || loading}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete this entry?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Add Entry ───────────────────────────────────────────
const AddEntry = ({ onAdded }) => {
  const INDIAN_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
    'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
    'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
    'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
    'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
  ];

  const [form, setForm] = useState({
    field: '', program: '', collegeName: '', rank: '',
    locationCity: '', locationState: '', collegeType: '',
    affiliation: '', annualFees: '', notableFeatures: '',
    dteCode: '', branchCode: '',
  });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setSuccess(''); setError('');
    try {
      await api.post('/superadmin/top-colleges', {
        field:            form.field,
        program:          form.program.trim(),
        collegeName:      form.collegeName.trim(),
        rank:             form.rank || undefined,
        locationCity:     form.locationCity.trim() || undefined,
        locationState:    form.locationState || undefined,
        collegeType:      form.collegeType || undefined,
        affiliation:      form.affiliation.trim() || undefined,
        annualFees:       form.annualFees || undefined,
        notableFeatures:  form.notableFeatures.trim() || undefined,
        dteCode:          form.dteCode.trim() || undefined,
        branchCode:       form.branchCode.trim() || undefined,
      });
      setSuccess('College entry added successfully!');
      setForm({ field: '', program: '', collegeName: '', rank: '', locationCity: '', locationState: '', collegeType: '', affiliation: '', annualFees: '', notableFeatures: '', dteCode: '', branchCode: '' });
      onAdded?.();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to add entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Field <span className="text-red-500">*</span>
            </label>
            <select value={form.field} onChange={set('field')} required className={ic}>
              <option value="">Select field…</option>
              {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Program */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Program / Branch <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.program} onChange={set('program')}
              placeholder="e.g. Computer Science, MBBS, LLB"
              required maxLength={150} className={ic}
            />
          </div>
        </div>

        {/* College Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            College Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text" value={form.collegeName} onChange={set('collegeName')}
            placeholder="Full official name of the institution"
            required maxLength={300} className={ic}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Rank */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rank <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="number" value={form.rank} onChange={set('rank')}
              min={1} placeholder="e.g. 1"
              className={ic}
            />
          </div>

          {/* College Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <select value={form.collegeType} onChange={set('collegeType')} className={ic}>
              <option value="">Select…</option>
              {COLLEGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Annual Fees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Annual Fees (₹) <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="number" value={form.annualFees} onChange={set('annualFees')}
              min={0} placeholder="e.g. 250000"
              className={ic}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* DTE Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              DTE Code <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text" value={form.dteCode} onChange={set('dteCode')}
              placeholder="e.g. TR1234, MH0045"
              maxLength={50} className={ic}
            />
          </div>
          {/* Branch Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Branch Code <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text" value={form.branchCode} onChange={set('branchCode')}
              placeholder="e.g. CE, CS, MBBS"
              maxLength={50} className={ic}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
            <input type="text" value={form.locationCity} onChange={set('locationCity')} placeholder="e.g. Mumbai" maxLength={100} className={ic} />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
            <select value={form.locationState} onChange={set('locationState')} className={ic}>
              <option value="">Select state…</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Affiliation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Affiliation / University <span className="text-xs text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text" value={form.affiliation} onChange={set('affiliation')}
            placeholder="e.g. IIT, NIT, AIIMS, University of Mumbai"
            maxLength={200} className={ic}
          />
        </div>

        {/* Notable Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Notable Features <span className="text-xs text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={form.notableFeatures} onChange={set('notableFeatures')}
            rows={2} maxLength={500}
            placeholder="e.g. Top placement record, NAAC A++ accredited, excellent research facilities…"
            className={`${ic} resize-none`}
          />
        </div>

        {success && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">{success}</p>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            {saving ? 'Adding…' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Tab: CSV Upload ──────────────────────────────────────────
const CsvUpload = ({ onUploaded }) => {
  const fileRef = useRef(null);
  const [file,     setFile]     = useState(null);
  const [uploading,setUploading]= useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setResult(null); setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/superadmin/top-colleges/bulk', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onUploaded?.();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      {/* Instructions */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4" /> CSV Format Instructions
        </h3>
        <p className="text-sm text-slate-600 mb-3">
          Upload a CSV file with the following columns. Download the template below for a ready-to-fill example.
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-1.5 pr-4 text-slate-600 font-semibold">Column</th>
                <th className="text-left py-1.5 pr-4 text-slate-600 font-semibold">Required</th>
                <th className="text-left py-1.5 text-slate-600 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['field',            'Yes', `One of: ${['Engineering','Medical','Law','Management','Design / Architecture','Pharmacy','Agriculture','Commerce','Pure Sciences','Other'].join(', ')}`],
                ['program',          'Yes', 'Specific program, e.g. Computer Science Engineering, MBBS, LLB'],
                ['college_name',     'Yes', 'Full name of the institution'],
                ['rank',             'No',  'Integer rank within field+program'],
                ['location_city',    'No',  'City where college is located'],
                ['location_state',   'No',  'State, e.g. Maharashtra'],
                ['college_type',     'No',  'Government | Private | Deemed | Autonomous | Other'],
                ['affiliation',      'No',  'Affiliating university or body'],
                ['annual_fees',      'No',  'Approximate annual fees in INR (numeric)'],
                ['notable_features', 'No',  'Short description or USP'],
                ['dte_code',         'No',  'DTE institution code (e.g. TR1234, MH0045)'],
                ['branch_code',      'No',  'Branch/program code (e.g. CE, CS, MBBS, BP)'],
              ].map(([col, req, note]) => (
                <tr key={col}>
                  <td className="py-1.5 pr-4 font-mono text-slate-700">{col}</td>
                  <td className={`py-1.5 pr-4 font-semibold ${req === 'Yes' ? 'text-red-600' : 'text-gray-400'}`}>{req}</td>
                  <td className="py-1.5 text-slate-500">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={handleTemplateDownload}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" /> Download Template CSV
        </button>
      </div>

      {/* Upload form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Select CSV File</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={e => { setFile(e.target.files[0] || null); setResult(null); setError(''); }}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>
        )}

        {result && (
          <div className={`p-4 rounded-xl border text-sm space-y-1 ${result.skipped > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className={`font-semibold ${result.skipped > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
              {result.inserted} of {result.total} rows inserted
              {result.skipped > 0 && ` · ${result.skipped} skipped`}
            </p>
            {result.errors?.slice(0, 5).map((e, i) => (
              <p key={i} className="text-xs text-amber-700">Row {e.row}: {e.message}</p>
            ))}
            {result.errors?.length > 5 && (
              <p className="text-xs text-amber-600">…and {result.errors.length - 5} more row errors</p>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Upload CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────
const TopCollegesPage = () => {
  const [tab,     setTab]     = useState('list');
  const [refresh, setRefresh] = useState(0);

  return (
    <DashboardShell sidebar={<SuperAdminSidebar />}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Top College Lists</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Curate platform-wide top colleges by field and program. Counselors use this data to guide students.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'list'   && <CollegeList key={refresh} />}
      {tab === 'add'    && <AddEntry    onAdded={() => setRefresh(r => r + 1)} />}
      {tab === 'upload' && <CsvUpload   onUploaded={() => setRefresh(r => r + 1)} />}
    </DashboardShell>
  );
};

export default TopCollegesPage;

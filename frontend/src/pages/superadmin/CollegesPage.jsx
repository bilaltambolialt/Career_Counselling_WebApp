import { useEffect, useState, useRef, useCallback } from 'react';
import {
  List, PlusCircle, Upload, Download, Trash2, ChevronDown, ChevronRight,
  Loader2, Search, X, Building2, GitBranch, CheckCircle2, AlertCircle,
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import SuperAdminSidebar from '../../components/layout/SuperAdminSidebar.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import api from '../../utils/api.js';

// ── Constants ────────────────────────────────────────────────────
const TABS = [
  { id: 'list',    label: 'College List', icon: List },
  { id: 'add',     label: 'Add College',  icon: PlusCircle },
  { id: 'branch',  label: 'Add Branch',   icon: GitBranch },
  { id: 'upload',  label: 'CSV Upload',   icon: Upload },
];

const COLLEGE_TYPES = ['Government', 'Private', 'Aided', 'Autonomous'];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const ic = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white';
const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

const BADGE = {
  Government:  'bg-green-100 text-green-700',
  Private:     'bg-blue-100 text-blue-700',
  Aided:       'bg-amber-100 text-amber-700',
  Autonomous:  'bg-purple-100 text-purple-700',
};

// ── Searchable college picker ────────────────────────────────────
function CollegePicker({ colleges, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);

  const selected = colleges.find(c => c.id === value);
  const filtered = query.trim()
    ? colleges.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.short_name || '').toLowerCase().includes(query.toLowerCase()))
    : colleges;

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(v => !v)}
        className={`${ic} flex items-center justify-between cursor-pointer`}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.name : 'Search and select college…'}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button type="button" onClick={e => { e.stopPropagation(); onChange(''); }}
              className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Type college name…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No colleges found</li>
            ) : filtered.map(c => (
              <li key={c.id}
                onClick={() => { onChange(c.id); setQuery(''); setOpen(false); }}
                className="px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between"
              >
                <span>{c.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[c.college_type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {c.college_type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Highlight matching text ──────────────────────────────────────
function Highlight({ text = '', query = '' }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-800 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB: College List
// ════════════════════════════════════════════════════════════════
function CollegeList({ colleges, loading, onDeleteCollege, onDeleteBranch, onRefresh }) {
  const [search,    setSearch]    = useState('');
  const [expanded,  setExpanded]  = useState({});
  const [confirmC,  setConfirmC]  = useState(null); // college to delete
  const [confirmB,  setConfirmB]  = useState(null); // branch to delete
  const [deleting,  setDeleting]  = useState(false);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const filtered = colleges.filter(c =>
    !search.trim() ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.short_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.state || '').toLowerCase().includes(search.toLowerCase()) ||
    c.college_type.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteCollege = async () => {
    setDeleting(true);
    try { await onDeleteCollege(confirmC.id); }
    finally { setDeleting(false); setConfirmC(null); }
  };

  const handleDeleteBranch = async () => {
    setDeleting(true);
    try { await onDeleteBranch(confirmB.id); }
    finally { setDeleting(false); setConfirmB(null); }
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Colleges', value: colleges.length, color: 'text-indigo-600' },
          { label: 'Government',     value: colleges.filter(c => c.college_type === 'Government').length,  color: 'text-green-600' },
          { label: 'Private',        value: colleges.filter(c => c.college_type === 'Private').length,     color: 'text-blue-600'  },
          { label: 'Total Branches', value: colleges.reduce((s, c) => s + (c.college_branches?.length ?? 0), 0), color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search colleges…"
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? 'No colleges match your search.' : 'No colleges yet. Add one above.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(college => {
            const branches = college.college_branches ?? [];
            const isOpen   = !!expanded[college.id];
            return (
              <div key={college.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* College row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => toggle(college.id)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors">
                    {isOpen
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">
                        <Highlight text={college.name} query={search} />
                      </p>
                      {college.short_name && (
                        <span className="text-xs text-gray-400">({college.short_name})</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[college.college_type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {college.college_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[college.location, college.state].filter(Boolean).join(', ') || '—'}
                      {college.affiliation ? ` · ${college.affiliation}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {branches.length} branch{branches.length !== 1 ? 'es' : ''}
                    </span>
                    <button onClick={() => setConfirmC(college)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete college">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Branches (expanded) */}
                {isOpen && (
                  <div className="border-t border-gray-50 bg-gray-50/60 px-6 py-3">
                    {branches.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-1">No branches added yet.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 uppercase tracking-wide">
                            <th className="text-left font-semibold pb-2">Branch Name</th>
                            <th className="text-left font-semibold pb-2">Code</th>
                            <th className="text-left font-semibold pb-2">Seats</th>
                            <th className="text-left font-semibold pb-2">Status</th>
                            <th className="pb-2" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {branches.map(b => (
                            <tr key={b.id}>
                              <td className="py-1.5 text-gray-700 font-medium">{b.branch_name}</td>
                              <td className="py-1.5 text-gray-500">{b.branch_code || '—'}</td>
                              <td className="py-1.5 text-gray-500">{b.total_seats ?? '—'}</td>
                              <td className="py-1.5">
                                <span className={`px-1.5 py-0.5 rounded font-medium ${b.is_active ? 'text-green-700 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>
                                  {b.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-1.5 text-right">
                                <button onClick={() => setConfirmB(b)}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete branch">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete college confirm */}
      <ConfirmModal
        isOpen={!!confirmC}
        title="Delete College"
        message={`Delete "${confirmC?.name}" and all its branches? This will also remove it from any cutoff records referencing it.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDeleteCollege}
        onCancel={() => setConfirmC(null)}
      />

      {/* Delete branch confirm */}
      <ConfirmModal
        isOpen={!!confirmB}
        title="Delete Branch"
        message={`Delete branch "${confirmB?.branch_name}"?`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDeleteBranch}
        onCancel={() => setConfirmB(null)}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB: Add College
// ════════════════════════════════════════════════════════════════
function AddCollege({ onSuccess }) {
  const empty = {
    name: '', short_name: '', college_type: '', state: '', location: '',
    affiliation: '', website: '', branch_name: '', branch_code: '', total_seats: '',
  };
  const [form,    setForm]    = useState(empty);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState({ ok: '', err: '' });

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ ok: '', err: '' });
    if (!form.name.trim())    return setMsg({ ok: '', err: 'College name is required.' });
    if (!form.college_type)   return setMsg({ ok: '', err: 'College type is required.' });

    setSaving(true);
    try {
      await api.post('/superadmin/colleges', form);
      setMsg({ ok: `"${form.name}" added successfully.`, err: '' });
      setForm(empty);
      onSuccess();
    } catch (err) {
      setMsg({ ok: '', err: err.response?.data?.message ?? 'Failed to add college.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Required fields note */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700">
        <span className="font-semibold">Required fields:</span> College Name, College Type.
        All other fields are optional but recommended for accurate cutoff matching.
      </div>

      {/* ── College Details ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-500" /> College Details
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={lbl}>College Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={set('name')} required
              placeholder="e.g. Government College of Engineering, Pune"
              className={ic} />
          </div>

          <div>
            <label className={lbl}>Short Name / Abbreviation</label>
            <input value={form.short_name} onChange={set('short_name')}
              placeholder="e.g. GCEP" className={ic} />
          </div>

          <div>
            <label className={lbl}>College Type <span className="text-red-500">*</span></label>
            <select value={form.college_type} onChange={set('college_type')} required className={ic}>
              <option value="">Select type</option>
              {COLLEGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>State</label>
            <select value={form.state} onChange={set('state')} className={ic}>
              <option value="">Select state</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>City / Location</label>
            <input value={form.location} onChange={set('location')}
              placeholder="e.g. Pune" className={ic} />
          </div>

          <div>
            <label className={lbl}>Affiliation / University</label>
            <input value={form.affiliation} onChange={set('affiliation')}
              placeholder="e.g. SPPU, VTU, Anna University" className={ic} />
          </div>

          <div>
            <label className={lbl}>Website URL</label>
            <input value={form.website} onChange={set('website')} type="url"
              placeholder="https://college.edu" className={ic} />
          </div>
        </div>
      </div>

      {/* ── Optional First Branch ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-purple-500" /> First Branch <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <label className={lbl}>Branch Name</label>
            <input value={form.branch_name} onChange={set('branch_name')}
              placeholder="e.g. Computer Engineering" className={ic} />
          </div>
          <div>
            <label className={lbl}>Branch Code</label>
            <input value={form.branch_code} onChange={set('branch_code')}
              placeholder="e.g. CO" className={ic} />
          </div>
          <div>
            <label className={lbl}>Total Seats</label>
            <input value={form.total_seats} onChange={set('total_seats')} type="number" min="1"
              placeholder="e.g. 60" className={ic} />
          </div>
        </div>
      </div>

      {msg.ok  && <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{msg.ok}</div>}
      {msg.err && <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3"><AlertCircle className="w-4 h-4 flex-shrink-0" />{msg.err}</div>}

      <button type="submit" disabled={saving}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><PlusCircle className="w-4 h-4" /> Add College</>}
      </button>
    </form>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB: Add Branch
// ════════════════════════════════════════════════════════════════
function AddBranch({ colleges, onSuccess }) {
  const empty = { college_id: '', branch_name: '', branch_code: '', total_seats: '' };
  const [form,   setForm]   = useState(empty);
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState({ ok: '', err: '' });

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ ok: '', err: '' });
    if (!form.college_id)       return setMsg({ ok: '', err: 'Please select a college.' });
    if (!form.branch_name.trim()) return setMsg({ ok: '', err: 'Branch name is required.' });

    setSaving(true);
    try {
      await api.post('/superadmin/colleges/branches', form);
      setMsg({ ok: `Branch "${form.branch_name}" added successfully.`, err: '' });
      setForm(empty);
      onSuccess();
    } catch (err) {
      setMsg({ ok: '', err: err.response?.data?.message ?? 'Failed to add branch.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-xs text-purple-700">
        <span className="font-semibold">Required fields:</span> College (select existing), Branch Name.
        Branch Code and Total Seats are optional.
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className={lbl}>College <span className="text-red-500">*</span></label>
          <CollegePicker colleges={colleges} value={form.college_id}
            onChange={v => setForm(p => ({ ...p, college_id: v }))} />
        </div>

        <div>
          <label className={lbl}>Branch Name <span className="text-red-500">*</span></label>
          <input value={form.branch_name} onChange={set('branch_name')} required
            placeholder="e.g. Mechanical Engineering" className={ic} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Branch Code</label>
            <input value={form.branch_code} onChange={set('branch_code')}
              placeholder="e.g. ME" className={ic} />
          </div>
          <div>
            <label className={lbl}>Total Seats</label>
            <input value={form.total_seats} onChange={set('total_seats')} type="number" min="1"
              placeholder="e.g. 60" className={ic} />
          </div>
        </div>
      </div>

      {msg.ok  && <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{msg.ok}</div>}
      {msg.err && <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3"><AlertCircle className="w-4 h-4 flex-shrink-0" />{msg.err}</div>}

      <button type="submit" disabled={saving}
        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><GitBranch className="w-4 h-4" /> Add Branch</>}
      </button>
    </form>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB: CSV Upload
// ════════════════════════════════════════════════════════════════
function CsvUpload({ onSuccess }) {
  const [file,      setFile]      = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState(null);
  const fileRef                   = useRef(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/superadmin/colleges/bulk', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onSuccess();
    } catch (err) {
      setResult({ upload_error: err.response?.data?.message ?? 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const res = await api.get('/superadmin/colleges/template', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a   = document.createElement('a');
    a.href = url; a.download = 'colleges_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* CSV column reference */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">CSV Column Reference</p>
          <button onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition">
            <Download className="w-3.5 h-3.5" /> Download Template
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {['Column', 'Required', 'Valid Values / Notes'].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ['college_name',  'Yes', 'Full college name. Used to match duplicates (case-insensitive).'],
                ['short_name',    'No',  'Abbreviation, e.g. GCEP'],
                ['college_type',  'Yes', 'Government · Private · Aided · Autonomous'],
                ['state',         'No',  'Indian state name, e.g. Maharashtra'],
                ['location',      'No',  'City, e.g. Pune'],
                ['affiliation',   'No',  'University name, e.g. SPPU, VTU'],
                ['website',       'No',  'Full URL, e.g. https://college.edu'],
                ['branch_name',   'No',  'Branch name for this row. Leave blank if adding college only.'],
                ['branch_code',   'No',  'Short code, e.g. CO, ME, CE'],
                ['total_seats',   'No',  'Integer, e.g. 60'],
              ].map(([col, req, note]) => (
                <tr key={col} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-indigo-700">{col}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${req === 'Yes' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                      {req}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Tip: One row per branch. Repeat the same <code className="bg-gray-100 px-1 rounded">college_name</code> on multiple rows to add multiple branches to the same college.
        </p>
      </div>

      {/* Upload area */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Upload CSV File</p>

        <label className="block border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-xl p-8 text-center cursor-pointer transition-colors group">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300 group-hover:text-indigo-400 transition-colors" />
          <p className="text-sm text-gray-500">{file ? file.name : 'Click to select a CSV file'}</p>
          <p className="text-xs text-gray-400 mt-1">Max 5 MB</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => { setFile(e.target.files[0] || null); setResult(null); }} />
        </label>

        {file && (
          <button onClick={handleUpload} disabled={uploading}
            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50">
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload & Process</>}
          </button>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3 pt-2">
            {result.upload_error ? (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{result.upload_error}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Colleges Added',  value: result.inserted_colleges, color: 'bg-green-50 text-green-700 border-green-200' },
                    { label: 'Branches Added',  value: result.inserted_branches, color: 'bg-blue-50 text-blue-700 border-blue-200'  },
                    { label: 'Duplicates',      value: result.duplicates,         color: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { label: 'Errors',          value: result.errors?.length ?? 0, color: 'bg-red-50 text-red-700 border-red-200'   },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.color}`}>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-xs mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {result.errors?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-red-700 mb-2">Errors ({result.errors.length})</p>
                    <ul className="space-y-1">
                      {result.errors.map((e, i) => (
                        <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function CollegesPage() {
  const [tab,      setTab]      = useState('list');
  const [colleges, setColleges] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const loadColleges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/superadmin/colleges');
      setColleges(res.data.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadColleges(); }, [loadColleges]);

  const handleDeleteCollege = async (id) => {
    await api.delete(`/superadmin/colleges/${id}`);
    await loadColleges();
  };

  const handleDeleteBranch = async (id) => {
    await api.delete(`/superadmin/colleges/branches/${id}`);
    await loadColleges();
  };

  return (
    <DashboardShell sidebar={<SuperAdminSidebar />}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Colleges &amp; Branches</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage the platform-wide college and branch master data used by cutoff matching.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
              {id === 'list' && colleges.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {colleges.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'list' && (
          <CollegeList
            colleges={colleges}
            loading={loading}
            onDeleteCollege={handleDeleteCollege}
            onDeleteBranch={handleDeleteBranch}
            onRefresh={loadColleges}
          />
        )}
        {tab === 'add' && (
          <AddCollege onSuccess={() => { loadColleges(); }} />
        )}
        {tab === 'branch' && (
          <AddBranch colleges={colleges} onSuccess={() => { loadColleges(); setTab('list'); }} />
        )}
        {tab === 'upload' && (
          <CsvUpload onSuccess={() => { loadColleges(); }} />
        )}
      </div>
    </DashboardShell>
  );
}

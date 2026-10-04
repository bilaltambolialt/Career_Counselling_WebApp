import { useEffect, useState, useCallback, useRef } from 'react';
import { List, PlusCircle, Upload, Download, Trash2, Filter, Loader2, Search, X, ChevronDown } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import SuperAdminSidebar from '../../components/layout/SuperAdminSidebar.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { fetchColleges, fetchCollegeBranches } from '../../services/collegeService.js';
import api from '../../utils/api.js';

const TABS = [
  { id: 'list',   label: 'Cutoff List', icon: List },
  { id: 'add',    label: 'Add Entry',   icon: PlusCircle },
  { id: 'upload', label: 'CSV Upload',  icon: Upload },
];

const CATEGORIES  = ['OPEN', 'OBC', 'SC', 'ST', 'EWS', 'VJ', 'NT', 'SEBC'];
const ROUNDS      = [1, 2, 3, 4, 5];
const YEARS       = [2025, 2024, 2023, 2022];

// ─── Searchable College Select ────────────────────────────────
const CollegeSearchSelect = ({ colleges, value, onChange, required, inputCls }) => {
  const [query, setQuery]     = useState('');
  const [open, setOpen]       = useState(false);
  const containerRef          = useRef(null);

  const selectedCollege = colleges.find(c => String(c.id) === String(value));
  const displayName     = selectedCollege ? (selectedCollege.short_name || selectedCollege.name) : '';

  const filtered = query.trim()
    ? colleges.filter(c =>
        (c.short_name || c.name || '').toLowerCase().includes(query.toLowerCase())
      )
    : colleges;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (college) => {
    onChange(String(college.id));
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <div
        onClick={() => setOpen(o => !o)}
        className={`${inputCls} flex items-center justify-between gap-2 cursor-pointer select-none`}
      >
        <span className={`truncate flex-1 ${!displayName ? 'text-gray-400' : 'text-gray-800'}`}>
          {displayName || 'Select college'}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-gray-600 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Hidden native select for required validation */}
      {required && (
        <select
          required
          value={value}
          onChange={() => {}}
          tabIndex={-1}
          className="absolute inset-0 opacity-0 pointer-events-none"
          aria-hidden="true"
        >
          <option value="" />
          {colleges.map(c => <option key={c.id} value={c.id}>{c.short_name || c.name}</option>)}
        </select>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search colleges…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options list */}
          <ul className="max-h-52 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No colleges found</li>
            ) : (
              filtered.map(c => (
                <li
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition ${
                    String(c.id) === String(value)
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {c.short_name || c.name}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Highlight matched text ───────────────────────────────────
const Highlight = ({ text, query }) => {
  if (!query || !text) return <>{text ?? '—'}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
};

// ─── Tab: List ────────────────────────────────────────────────
const PAGE_SIZE = 20;

const CutoffList = () => {
  // All fetched rows (for the current server-side filters)
  const [allCutoffs,      setAllCutoffs]      = useState([]);
  const [serverMeta,      setServerMeta]      = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [serverPage,      setServerPage]      = useState(1);
  const [filterYear,      setFilterYear]      = useState('');
  const [filterCategory,  setFilterCategory]  = useState('');
  const [search,          setSearch]          = useState('');
  const [clientPage,      setClientPage]      = useState(1);
  const [deleteTarget,    setDeleteTarget]    = useState(null);
  const [deleting,        setDeleting]        = useState(false);

  // Reset client page whenever search text changes
  useEffect(() => { setClientPage(1); }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page: serverPage, limit: 100 }; // fetch larger batch so client-search has more rows
    if (filterYear)     params.year     = filterYear;
    if (filterCategory) params.category = filterCategory;
    api.get('/superadmin/cutoff', { params })
      .then(r => {
        setAllCutoffs(r.data.data ?? []);
        setServerMeta(r.data.meta ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => setError('Failed to load cutoff data.'))
      .finally(() => setLoading(false));
  }, [serverPage, filterYear, filterCategory]);

  useEffect(() => { load(); }, [load]);

  // Client-side filter by search query (college name, short_name, branch name, city)
  const q = search.trim().toLowerCase();
  const filtered = q
    ? allCutoffs.filter(c => {
        const college = (c.colleges?.short_name || c.colleges?.name || '').toLowerCase();
        const branch  = (c.college_branches?.branch_name || '').toLowerCase();
        const city    = (c.city || '').toLowerCase();
        return college.includes(q) || branch.includes(q) || city.includes(q);
      })
    : allCutoffs;

  // Client-side pagination over filtered results
  const totalFiltered  = filtered.length;
  const totalClientPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safePage       = Math.min(clientPage, totalClientPages);
  const pageSlice      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/superadmin/cutoff/${deleteTarget.id}`);
      setDeleteTarget(null);
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

      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search bar */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search college, branch or city…"
            className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Year filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); setServerPage(1); setClientPage(1); setSearch(''); }}
            className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white appearance-none"
          >
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Category filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setServerPage(1); setClientPage(1); setSearch(''); }}
            className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white appearance-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Result count badge */}
        {!loading && (
          <div className="flex items-center ml-auto text-xs text-gray-400">
            {q
              ? <span><span className="font-semibold text-gray-600">{totalFiltered}</span> result{totalFiltered !== 1 ? 's' : ''} for "<span className="text-indigo-600">{search}</span>"</span>
              : <span><span className="font-semibold text-gray-600">{serverMeta.total ?? allCutoffs.length}</span> entries</span>
            }
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">College</th>
                <th className="text-left px-5 py-3 font-medium">Branch</th>
                <th className="text-left px-5 py-3 font-medium">Exam</th>
                <th className="text-left px-5 py-3 font-medium">Year</th>
                <th className="text-left px-5 py-3 font-medium">Round</th>
                <th className="text-left px-5 py-3 font-medium">Category</th>
                <th className="text-left px-5 py-3 font-medium">City</th>
                <th className="text-left px-5 py-3 font-medium">Percentile</th>
                <th className="text-left px-5 py-3 font-medium">Rank</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !pageSlice.length ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-gray-400 text-sm">
                    {q
                      ? <>No results matching <span className="font-medium text-gray-600">"{search}"</span>.</>
                      : 'No cutoff entries found.'}
                  </td>
                </tr>
              ) : (
                pageSlice.map(c => {
                  const collegeName = c.colleges?.short_name || c.colleges?.name || '';
                  const branchName  = c.college_branches?.branch_name || '';
                  const cityName    = c.city || '';
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-medium text-gray-800">
                        <Highlight text={collegeName} query={search} />
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        <Highlight text={branchName} query={search} />
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700">
                          {c.exam_type ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{c.year}</td>
                      <td className="px-5 py-3 text-gray-600">{c.round}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                          {c.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        <Highlight text={cityName || null} query={search} />
                      </td>
                      <td className="px-5 py-3 text-gray-600">{c.cutoff_percentile ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{c.cutoff_rank ?? '—'}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination: client-side when searching, server-side otherwise */}
      {q ? (
        <Pagination page={safePage} totalPages={totalClientPages} onPage={setClientPage} />
      ) : (
        <Pagination page={serverPage} totalPages={serverMeta.totalPages} onPage={p => { setServerPage(p); setClientPage(1); }} />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Cutoff Entry?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

const COLLEGE_TYPES = ['Government', 'Private', 'Aided', 'Autonomous'];

// ─── Tab: Add Entry ───────────────────────────────────────────
const AddCutoffEntry = () => {
  const [colleges,       setColleges]       = useState([]);
  const [branches,       setBranches]       = useState([]);
  const [collegeMode,    setCollegeMode]    = useState('existing');
  const [branchMode,     setBranchMode]     = useState('existing');
  const [form, setForm] = useState({
    collegeId: '', branchId: '',
    newCollegeName: '', collegeType: 'Private',
    newBranchName: '',
    year: '', round: '', category: '', examType: '', city: '',
    cutoffPercentile: '', cutoffRank: '', cutoffScore: '',
  });
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchColleges({ limit: 200 })
      .then(r => setColleges(r.data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (collegeMode !== 'existing' || !form.collegeId) { setBranches([]); return; }
    fetchCollegeBranches(form.collegeId)
      .then(r => setBranches(r.data.data ?? []))
      .catch(() => setBranches([]));
    setForm(f => ({ ...f, branchId: '' }));
  }, [form.collegeId, collegeMode]);

  const set = field => e => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setSuccess(''); setError('');
  };

  const setField = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setSuccess(''); setError('');
  };

  const switchCollegeMode = (mode) => {
    setCollegeMode(mode);
    setBranchMode('existing');
    setForm(f => ({ ...f, collegeId: '', newCollegeName: '', collegeType: 'Private', branchId: '', newBranchName: '' }));
    setBranches([]);
    setSuccess(''); setError('');
  };

  const switchBranchMode = (mode) => {
    setBranchMode(mode);
    setForm(f => ({ ...f, branchId: '', newBranchName: '' }));
    setSuccess(''); setError('');
  };

  const buildPayload = () => {
    const base = {
      year: form.year, round: form.round, category: form.category,
      examType: form.examType, city: form.city,
      cutoffPercentile: form.cutoffPercentile,
      cutoffRank: form.cutoffRank,
      cutoffScore: form.cutoffScore,
    };
    if (collegeMode === 'new') {
      return { ...base, newCollegeName: form.newCollegeName, collegeType: form.collegeType, newBranchName: form.newBranchName };
    }
    const branchPart = branchMode === 'new'
      ? { newBranchName: form.newBranchName }
      : { branchId: form.branchId };
    return { ...base, collegeId: form.collegeId, ...branchPart };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/superadmin/cutoff', buildPayload());
      setSuccess('Cutoff entry added successfully.');
      setForm(f => ({ ...f, cutoffPercentile: '', cutoffRank: '', cutoffScore: '', round: '', category: '' }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white';
  const modeBtnCls = (active) =>
    `px-3 py-1.5 text-xs font-medium rounded-lg transition ${
      active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
    }`;

  return (
    <div className="max-w-2xl">
      {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{success}</div>}
      {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">

        {/* College section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-600">College <span className="text-red-500">*</span></label>
            <div className="flex gap-1">
              <button type="button" className={modeBtnCls(collegeMode === 'existing')} onClick={() => switchCollegeMode('existing')}>Select existing</button>
              <button type="button" className={modeBtnCls(collegeMode === 'new')}      onClick={() => switchCollegeMode('new')}>+ Add new</button>
            </div>
          </div>
          {collegeMode === 'existing' ? (
            <CollegeSearchSelect
              colleges={colleges}
              value={form.collegeId}
              onChange={(val) => setField('collegeId', val)}
              required
              inputCls={inputCls}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <input
                required type="text" value={form.newCollegeName} onChange={set('newCollegeName')}
                placeholder="Full college name" className={inputCls}
              />
              <select value={form.collegeType} onChange={set('collegeType')} className={inputCls}>
                {COLLEGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Branch section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-600">Branch <span className="text-red-500">*</span></label>
            {(collegeMode === 'new' || form.collegeId) && (
              <div className="flex gap-1">
                {collegeMode === 'existing' && (
                  <button type="button" className={modeBtnCls(branchMode === 'existing')} onClick={() => switchBranchMode('existing')}>Select existing</button>
                )}
                <button type="button" className={modeBtnCls(branchMode === 'new' || collegeMode === 'new')} onClick={() => switchBranchMode('new')}>+ Add new</button>
              </div>
            )}
          </div>
          {(collegeMode === 'new' || branchMode === 'new') ? (
            <input
              required type="text" value={form.newBranchName} onChange={set('newBranchName')}
              placeholder="Branch name, e.g. Computer Engineering" className={inputCls}
            />
          ) : (
            <select required value={form.branchId} onChange={set('branchId')} className={inputCls} disabled={!branches.length}>
              <option value="">{branches.length ? 'Select branch' : 'Select a college first'}</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
            </select>
          )}
        </div>

        {/* Year + Round + Category */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Year <span className="text-red-500">*</span></label>
            <select required value={form.year} onChange={set('year')} className={inputCls}>
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Round <span className="text-red-500">*</span></label>
            <select required value={form.round} onChange={set('round')} className={inputCls}>
              <option value="">Round</option>
              {ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Category <span className="text-red-500">*</span></label>
            <select required value={form.category} onChange={set('category')} className={inputCls}>
              <option value="">Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Exam Type + City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Exam Type <span className="text-red-500">*</span></label>
            <select required value={form.examType} onChange={set('examType')} className={inputCls}>
              <option value="">Select exam type</option>
              <option value="JEE_MAIN">JEE Main</option>
              <option value="JEE_ADVANCED">JEE Advanced</option>
              <option value="MHT_CET">MHT-CET</option>
              <option value="NEET_UG">NEET UG</option>
              <option value="NEET_PG">NEET PG</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">City <span className="text-gray-400">(optional)</span></label>
            <input
              type="text" value={form.city} onChange={set('city')}
              placeholder="e.g. Mumbai, Pune, Delhi" className={inputCls}
            />
          </div>
        </div>

        {/* Score fields */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Closing Percentile</label>
            <input type="number" step="0.01" min="0" max="100" value={form.cutoffPercentile} onChange={set('cutoffPercentile')} placeholder="e.g. 98.5" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Closing Rank</label>
            <input type="number" min="1" value={form.cutoffRank} onChange={set('cutoffRank')} placeholder="e.g. 5000" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Closing Score</label>
            <input type="number" min="0" value={form.cutoffScore} onChange={set('cutoffScore')} placeholder="e.g. 280" className={inputCls} />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit" disabled={submitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60"
          >
            {submitting ? 'Adding…' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Tab: CSV Upload ──────────────────────────────────────────
const CsvUpload = () => {
  const fileRef = useRef(null);
  const [file,     setFile]     = useState(null);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = e => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError(''); setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/superadmin/cutoff/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data.data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const res = await api.get('/superadmin/cutoff/template', { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'cutoff_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-xl">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-800">CSV Template</p>
          <p className="text-xs text-indigo-600 mt-0.5">Download and fill the template before uploading.</p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-xl transition"
        >
          <Download className="w-4 h-4" /> Template
        </button>
      </div>

      {/* Column reference */}
      <div className="mb-6 rounded-2xl border border-gray-100 overflow-hidden text-xs">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
          <p className="font-semibold text-gray-600 uppercase tracking-wide text-[11px]">CSV Column Reference</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2 font-semibold text-gray-500">Column</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-500">Required</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-500">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              { col: 'college_name',  req: true,  desc: 'Exact college name as in the system' },
              { col: 'branch_name',   req: true,  desc: 'Exact branch name as in the system' },
              { col: 'year',          req: true,  desc: 'Cutoff year, e.g. 2024' },
              { col: 'round',         req: true,  desc: 'Allotment round number (1–5)' },
              { col: 'category',      req: true,  desc: 'OPEN / OBC / SC / ST / EWS / NT / VJ/ SEBC ' },
              { col: 'exam_type',     req: true,  desc: 'JEE_MAIN / JEE_ADVANCED / MHT_CET / NEET_UG / NEET_PG / OTHER' },
              { col: 'city',          req: false, desc: 'City of the college (optional)' },
              { col: 'percentile',    req: false, desc: 'Cutoff percentile — at least one of percentile/rank/score required' },
              { col: 'rank',          req: false, desc: 'Cutoff rank' },
              { col: 'score',         req: false, desc: 'Cutoff score' },
              { col: 'dte_code',      req: false, desc: 'DTE institution code (optional reference)' },
              { col: 'course_code',   req: false, desc: 'DTE course / branch code (optional reference)' },
            ].map(({ col, req, desc }) => (
              <tr key={col} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <code className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">{col}</code>
                </td>
                <td className="px-4 py-2">
                  {req
                    ? <span className="text-red-500 font-semibold">Yes</span>
                    : <span className="text-gray-400">No</span>}
                </td>
                <td className="px-4 py-2 text-gray-500">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <label className="block text-xs font-medium text-gray-600 mb-3">Select CSV File</label>
        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition">
          <Upload className="w-8 h-8 text-gray-300 mb-2" />
          <span className="text-sm text-gray-400">{file ? file.name : 'Click to select a .csv file'}</span>
          {file && <span className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</span>}
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </label>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
            <p className="font-semibold text-emerald-800 mb-2">Upload Complete</p>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div><p className="text-xl font-bold text-emerald-700">{result.total}</p><p className="text-xs text-emerald-600">Total rows</p></div>
              <div><p className="text-xl font-bold text-emerald-700">{result.inserted}</p><p className="text-xs text-emerald-600">Inserted</p></div>
              <div><p className="text-xl font-bold text-gray-400">{result.duplicates ?? 0}</p><p className="text-xs text-gray-400">Duplicates</p></div>
              <div><p className="text-xl font-bold text-amber-600">{result.skipped}</p><p className="text-xs text-amber-500">Skipped</p></div>
            </div>
            {(result.autoCreated?.colleges > 0 || result.autoCreated?.branches > 0) && (
              <div className="mt-2 pt-2 border-t border-emerald-200 text-xs text-emerald-700">
                Auto-created:
                {result.autoCreated.colleges > 0 && <span className="ml-1 font-semibold">{result.autoCreated.colleges} college{result.autoCreated.colleges > 1 ? 's' : ''}</span>}
                {result.autoCreated.branches > 0 && <span className="ml-1 font-semibold">{result.autoCreated.branches} branch{result.autoCreated.branches > 1 ? 'es' : ''}</span>}
              </div>
            )}
            {result.errors?.length > 0 && (
              <div className="mt-3 border-t border-emerald-200 pt-3">
                <p className="text-xs font-semibold text-red-600 mb-1">Errors ({result.errors.length} rows):</p>
                <ul className="text-xs text-red-600 space-y-0.5 max-h-32 overflow-y-auto">
                  {result.errors.map((e, i) => <li key={i}>Row {e.row}: {e.message}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Upload CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const CutoffPage = () => {
  const [tab, setTab] = useState('list');

  return (
    <DashboardShell sidebar={<SuperAdminSidebar />}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Cutoff Data</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Platform-wide centralized cutoff data — visible to all students.
          </p>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                tab === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {tab === 'list'   && <CutoffList />}
        {tab === 'add'    && <AddCutoffEntry />}
        {tab === 'upload' && <CsvUpload />}
      </div>
    </DashboardShell>
  );
};

export default CutoffPage;
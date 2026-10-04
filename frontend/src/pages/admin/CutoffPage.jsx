import { useEffect, useState, useCallback, useRef } from 'react';
import { List, PlusCircle, Upload, Download, Trash2, Search, Filter } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import AdminSidebar from '../../components/layout/AdminSidebar.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import {
  fetchCutoffs,
  createCutoff,
  bulkUploadCutoff,
  downloadCutoffTemplate,
  deleteCutoff,
} from '../../services/adminService.js';
import { fetchColleges, fetchCollegeBranches } from '../../services/collegeService.js';

const TABS = [
  { id: 'list',   label: 'Cutoff List',  icon: List },
  { id: 'add',    label: 'Add Entry',    icon: PlusCircle },
  { id: 'upload', label: 'CSV Upload',   icon: Upload },
];

const CATEGORIES = ['OPEN', 'OBC', 'SC', 'ST', 'EWS'];
const ROUNDS     = [1, 2, 3, 4, 5];
const YEARS      = [2025, 2024, 2023, 2022];

// ─── Tab: List ────────────────────────────────────────────────
const CutoffList = () => {
  const [cutoffs, setCutoffs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filterYear, setFilterYear] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (filterYear) params.year = filterYear;
    if (filterCategory) params.category = filterCategory;
    fetchCutoffs(params)
      .then((res) => {
        setCutoffs(res.data.data ?? []);
        setMeta(res.data.meta ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => setError('Failed to load cutoff data.'))
      .finally(() => setLoading(false));
  }, [page, filterYear, filterCategory]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCutoff(deleteTarget.id);
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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}
            className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white appearance-none"
          >
            <option value="">All Years</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white appearance-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
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
              ) : !cutoffs.length ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No cutoff entries found.
                  </td>
                </tr>
              ) : (
                cutoffs.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-medium text-gray-800">{c.colleges?.short_name || c.colleges?.name}</td>
                    <td className="px-5 py-3 text-gray-600">{c.college_branches?.branch_name}</td>
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
                    <td className="px-5 py-3 text-gray-600">{c.city ?? <span className="text-gray-300">—</span>}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={meta.totalPages} onPage={setPage} />

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

// ─── Tab: Add Entry ───────────────────────────────────────────
const AddCutoffEntry = () => {
  const [colleges, setColleges] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    collegeId: '',
    branchId: '',
    year: '',
    round: '',
    category: '',
    examType: '',
    city: '',
    cutoffPercentile: '',
    cutoffRank: '',
    cutoffScore: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchColleges({ limit: 100 })
      .then((res) => setColleges(res.data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.collegeId) { setBranches([]); return; }
    fetchCollegeBranches(form.collegeId)
      .then((res) => setBranches(res.data.data ?? []))
      .catch(() => setBranches([]));
    setForm((f) => ({ ...f, branchId: '' }));
  }, [form.collegeId]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSubmitting(true);
    try {
      await createCutoff(form);
      setSuccess('Cutoff entry added successfully.');
      setForm((f) => ({
        ...f,
        cutoffPercentile: '',
        cutoffRank: '',
        cutoffScore: '',
        round: '',
        category: '',
      }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white';

  return (
    <div className="max-w-2xl">
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        {/* College + Branch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              College <span className="text-red-500">*</span>
            </label>
            <select required value={form.collegeId} onChange={set('collegeId')} className={inputCls}>
              <option value="">Select college</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>{c.short_name || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Branch <span className="text-red-500">*</span>
            </label>
            <select required value={form.branchId} onChange={set('branchId')} className={inputCls} disabled={!branches.length}>
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branch_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Year + Round + Category */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Year <span className="text-red-500">*</span>
            </label>
            <select required value={form.year} onChange={set('year')} className={inputCls}>
              <option value="">Year</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Round <span className="text-red-500">*</span>
            </label>
            <select required value={form.round} onChange={set('round')} className={inputCls}>
              <option value="">Round</option>
              {ROUNDS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select required value={form.category} onChange={set('category')} className={inputCls}>
              <option value="">Category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Exam Type + City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Exam Type</label>
            <select value={form.examType} onChange={set('examType')} className={inputCls}>
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
              type="text"
              value={form.city}
              onChange={set('city')}
              placeholder="e.g. Mumbai, Pune, Delhi"
              className={inputCls}
            />
          </div>
        </div>

        {/* Score fields */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Closing Percentile</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.cutoffPercentile}
              onChange={set('cutoffPercentile')}
              placeholder="e.g. 98.5"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Closing Rank</label>
            <input
              type="number"
              min="1"
              value={form.cutoffRank}
              onChange={set('cutoffRank')}
              placeholder="e.g. 5000"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Closing Score</label>
            <input
              type="number"
              min="0"
              value={form.cutoffScore}
              onChange={set('cutoffScore')}
              placeholder="e.g. 280"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
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
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await bulkUploadCutoff(fd);
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
    const res = await downloadCutoffTemplate();
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cutoff_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-xl">
      {/* Download template */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-800">CSV Template</p>
          <p className="text-xs text-indigo-600 mt-0.5">
            Download and fill the template before uploading.
          </p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-xl transition"
        >
          <Download className="w-4 h-4" />
          Template
        </button>
      </div>

      {/* Upload area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <label className="block text-xs font-medium text-gray-600 mb-3">
          Select CSV File
        </label>
        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition">
          <Upload className="w-8 h-8 text-gray-300 mb-2" />
          <span className="text-sm text-gray-400">
            {file ? file.name : 'Click to select a .csv file'}
          </span>
          {file && (
            <span className="text-xs text-gray-400 mt-1">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
            <p className="font-semibold text-emerald-800 mb-2">Upload Complete</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-emerald-700">{result.total}</p>
                <p className="text-xs text-emerald-600">Total rows</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-700">{result.inserted}</p>
                <p className="text-xs text-emerald-600">Inserted</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-600">{result.skipped}</p>
                <p className="text-xs text-amber-500">Skipped</p>
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div className="mt-3 border-t border-emerald-200 pt-3">
                <p className="text-xs font-semibold text-red-600 mb-1">
                  Errors ({result.errors.length} rows):
                </p>
                <ul className="text-xs text-red-600 space-y-0.5 max-h-32 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <li key={i}>Row {e.row}: {e.message}</li>
                  ))}
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
            <Upload className="w-4 h-4" />
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
    <DashboardShell sidebar={<AdminSidebar />}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Cutoff Data</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage historical closing cutoffs for the admission analysis engine.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                tab === id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
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

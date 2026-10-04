import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Edit2, X, Save, FileText } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import StudentSidebar from '../../components/layout/StudentSidebar.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import {
  fetchExamScores, addExamScore, updateExamScore, deleteExamScore,
} from '../../services/studentService.js';

const EXAM_TYPES = ['JEE_MAIN', 'JEE_ADVANCED', 'MHT_CET', 'NEET_UG', 'NEET_PG', 'OTHER'];
const EXAM_LABELS = {
  JEE_MAIN: 'JEE Main', JEE_ADVANCED: 'JEE Advanced',
  MHT_CET: 'MHT-CET', NEET_UG: 'NEET UG', NEET_PG: 'NEET PG', OTHER: 'Other',
};
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);
const EMPTY_FORM = {
  exam_type: '', score: '', percentile: '', rank: '', attempt_year: '', attempt_number: '1',
};

const ExamScoresPage = () => {
  const [scores, setScores]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [editId, setEditId]             = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchExamScores()
      .then((res) => setScores(res.data.data ?? []))
      .catch(() => setError('Failed to load scores.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFormError('');
  };

  const openAdd = () => {
    setEditId(null); setForm(EMPTY_FORM); setFormError(''); setShowForm(true);
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({
      exam_type: s.exam_type, score: s.score ?? '', percentile: s.percentile ?? '',
      rank: s.rank ?? '', attempt_year: s.attempt_year, attempt_number: s.attempt_number ?? 1,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.score && !form.percentile && !form.rank) {
      setFormError('Provide at least one of: Score, Percentile, or Rank.');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) { await updateExamScore(editId, form); } else { await addExamScore(form); }
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save score.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteExamScore(deleteTarget.id); setDeleteTarget(null); load(); }
    catch { setError('Failed to delete score.'); }
    finally { setDeleting(false); }
  };

  const ic = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white';

  return (
    <DashboardShell sidebar={<StudentSidebar />}>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exam Scores</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Add your entrance exam results to receive personalised admission recommendations.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Score
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">{editId ? 'Edit Score' : 'Add New Score'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{formError}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Exam Type <span className="text-red-500">*</span>
                  </label>
                  <select required value={form.exam_type} onChange={set('exam_type')} className={ic}>
                    <option value="">Select exam</option>
                    {EXAM_TYPES.map((t) => <option key={t} value={t}>{EXAM_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Attempt Year <span className="text-red-500">*</span>
                  </label>
                  <select required value={form.attempt_year} onChange={set('attempt_year')} className={ic}>
                    <option value="">Select year</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Score</label>
                  <input type="number" step="0.01" min="0" value={form.score} onChange={set('score')} placeholder="e.g. 280" className={ic} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Percentile</label>
                  <input type="number" step="0.01" min="0" max="100" value={form.percentile} onChange={set('percentile')} placeholder="e.g. 98.5" className={ic} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Rank</label>
                  <input type="number" min="1" value={form.rank} onChange={set('rank')} placeholder="e.g. 5000" className={ic} />
                </div>
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Attempt #</label>
                <input type="number" min="1" max="5" value={form.attempt_number} onChange={set('attempt_number')} className={ic} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60">
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving…' : editId ? 'Update' : 'Add Score'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Scores list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !scores.length ? (
            <div className="p-14 text-center text-gray-400 text-sm">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              No exam scores added yet.{' '}
              <button onClick={openAdd} className="text-indigo-600 hover:underline">Add your first score</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {scores.map((s) => (
                <div key={s.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {EXAM_LABELS[s.exam_type] || s.exam_type}
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        {s.attempt_year} &middot; Attempt {s.attempt_number}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[
                        s.percentile != null && (s.percentile + '%ile'),
                        s.rank       != null && ('Rank ' + s.rank),
                        s.score      != null && (s.score + ' pts'),
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-gray-300 hover:text-indigo-500 transition rounded-lg hover:bg-indigo-50">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-gray-300 hover:text-red-500 transition rounded-lg hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Score?"
        message={"Delete your " + (EXAM_LABELS[deleteTarget?.exam_type] || '') + " score from " + deleteTarget?.attempt_year + "? This cannot be undone."}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardShell>
  );
};

export default ExamScoresPage;

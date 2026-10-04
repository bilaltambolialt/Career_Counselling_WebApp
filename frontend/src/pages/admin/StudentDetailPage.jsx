import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, UserCheck, UserX, Save, X } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import AdminSidebar from '../../components/layout/AdminSidebar.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import {
  fetchStudent,
  updateStudent,
  deactivateStudent,
  assignCounselor,
  fetchCounselors,
} from '../../services/adminService.js';

const CATEGORIES = ['OPEN', 'OBC', 'SC', 'ST', 'EWS'];

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-gray-50 last:border-0">
    <span className="w-40 text-xs font-medium text-gray-400 uppercase tracking-wide flex-shrink-0">
      {label}
    </span>
    <span className="text-sm text-gray-800">{value || '—'}</span>
  </div>
);

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const [selectedCounselor, setSelectedCounselor] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchStudent(id),
      fetchCounselors({ limit: 100 }),
    ])
      .then(([sRes, cRes]) => {
        const s = sRes.data.data;
        setStudent(s);
        setEditForm({
          name: s.name,
          phone: s.phone || '',
          category: s.category || '',
        });
        setSelectedCounselor(s.assigned_counselor_id || '');
        setCounselors(cRes.data.data ?? []);
      })
      .catch(() => setError('Failed to load student.'))
      .finally(() => setLoading(false));
  }, [id]);

  const setEdit = (field) => (e) => {
    let val = e.target.value;
    if (field === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
    setEditForm((f) => ({ ...f, [field]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateStudent(id, editForm);
      setStudent(res.data.data);
      setEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update student.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deactivateStudent(id);
      navigate('/admin/students');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to deactivate student.');
      setDeactivateModal(false);
    } finally {
      setDeactivating(false);
    }
  };

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const res = await assignCounselor(id, selectedCounselor || null);
      setStudent(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to assign counselor.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell sidebar={<AdminSidebar />}>
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell sidebar={<AdminSidebar />}>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate('/admin/students')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {student?.name}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{student?.email}</p>
              <div className="mt-2">
                <StatusBadge active={student?.is_active} />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {student?.is_active && (
                <>
                  {editing ? (
                    <>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => setDeactivateModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition"
                  >
                    <UserX className="w-3.5 h-3.5" /> Deactivate
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Student Information
          </h2>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={setEdit('name')}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={setEdit('phone')}
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select
                  value={editForm.category}
                  onChange={setEdit('category')}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                >
                  <option value="">—</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <InfoRow label="Phone" value={student?.phone} />
              <InfoRow label="Category" value={student?.category} />
              <InfoRow
                label="Must Change PW"
                value={student?.must_change_password ? 'Yes (pending)' : 'No'}
              />
              <InfoRow
                label="Created"
                value={student?.created_at ? new Date(student.created_at).toLocaleDateString('en-IN') : '—'}
              />
            </div>
          )}
        </div>

        {/* Assign Counselor */}
        {student?.is_active && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-gray-400" />
              Counselor Assignment
            </h2>
            <div className="flex gap-3 items-center flex-wrap">
              <select
                value={selectedCounselor}
                onChange={(e) => setSelectedCounselor(e.target.value)}
                className="flex-1 min-w-48 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="">Unassigned</option>
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60"
              >
                {assigning ? 'Saving…' : 'Update Assignment'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deactivate confirm modal */}
      <ConfirmModal
        open={deactivateModal}
        title="Deactivate Student?"
        message={`${student?.name} will lose access to the platform. This can be reversed by an admin.`}
        confirmLabel="Deactivate"
        danger
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateModal(false)}
      />
    </DashboardShell>
  );
};

export default StudentDetailPage;

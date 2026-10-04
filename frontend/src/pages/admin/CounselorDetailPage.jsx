import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, UserX, Save, X, Users } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import AdminSidebar from '../../components/layout/AdminSidebar.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import {
  fetchCounselor,
  updateCounselor,
  deactivateCounselor,
} from '../../services/adminService.js';

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-gray-50 last:border-0">
    <span className="w-40 text-xs font-medium text-gray-400 uppercase tracking-wide flex-shrink-0">
      {label}
    </span>
    <span className="text-sm text-gray-800">{value || '—'}</span>
  </div>
);

const CounselorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [counselor, setCounselor] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const [editing,   setEditing]   = useState(false);
  const [editForm,  setEditForm]  = useState({});
  const [saving,    setSaving]    = useState(false);

  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deactivating,    setDeactivating]    = useState(false);

  useEffect(() => {
    fetchCounselor(id)
      .then((res) => {
        const c = res.data.data;
        setCounselor(c);
        setEditForm({
          name:  c.name  || '',
          phone: c.phone || '',
        });
      })
      .catch(() => setError('Failed to load counselor.'))
      .finally(() => setLoading(false));
  }, [id]);

  const setField = (field) => (e) => {
    let val = e.target.value;
    if (field === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
    setEditForm((f) => ({ ...f, [field]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateCounselor(id, editForm);
      setCounselor((prev) => ({ ...prev, ...res.data.data }));
      setEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update counselor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deactivateCounselor(id);
      navigate('/admin/counselors');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to deactivate counselor.');
      setDeactivateModal(false);
    } finally {
      setDeactivating(false);
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

  const assignedStudents = counselor?.assignedStudents ?? [];

  return (
    <DashboardShell sidebar={<AdminSidebar />}>
      <div className="p-6 max-w-3xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate('/admin/counselors')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Counselors
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
              <h1 className="text-xl font-bold text-gray-900">{counselor?.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{counselor?.email}</p>
              <div className="mt-2">
                <StatusBadge active={counselor?.is_active} />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {counselor?.is_active && (
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
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition disabled:opacity-60"
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
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Counselor Information</h2>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={setField('name')}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={setField('phone')}
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            </div>
          ) : (
            <div>
              <InfoRow label="Phone" value={counselor?.phone} />
              <InfoRow
                label="Must Change PW"
                value={counselor?.must_change_password ? 'Yes (pending)' : 'No'}
              />
              <InfoRow
                label="Created"
                value={counselor?.created_at ? new Date(counselor.created_at).toLocaleDateString('en-IN') : '—'}
              />
            </div>
          )}
        </div>

        {/* Assigned Students */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            Assigned Students
            <span className="ml-1 text-xs font-normal text-gray-400">
              ({assignedStudents.length})
            </span>
          </h2>

          {assignedStudents.length === 0 ? (
            <p className="text-sm text-gray-400">No students assigned to this counselor yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {assignedStudents.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/admin/students/${s.id}`)}
                  className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.category && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {s.category}
                      </span>
                    )}
                    <StatusBadge active={s.is_active} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deactivate confirm modal */}
      <ConfirmModal
        open={deactivateModal}
        title="Deactivate Counselor?"
        message={`${counselor?.name} will lose access to the platform. All ${assignedStudents.length} assigned student${assignedStudents.length !== 1 ? 's' : ''} will be unassigned.`}
        confirmLabel="Deactivate"
        danger
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateModal(false)}
      />
    </DashboardShell>
  );
};

export default CounselorDetailPage;

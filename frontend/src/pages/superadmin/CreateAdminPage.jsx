import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import SuperAdminSidebar from '../../components/layout/SuperAdminSidebar.jsx';
import api from '../../utils/api.js';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

const CreateAdminPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', email: '', organizationName: '',
    phone: '', city: '', state: '', password: '',
  });
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading,    setLoading]    = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/superadmin/admins/${id}`)
      .then(r => {
        const a = r.data.data;
        setForm({
          name:             a.name             ?? '',
          email:            a.email            ?? '',
          organizationName: a.organization_name ?? '',
          phone:            a.phone            ?? '',
          city:             a.city             ?? '',
          state:            a.state            ?? '',
          password:         '',
        });
      })
      .catch(() => setError('Failed to load admin details.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = field => e => {
    let val = e.target.value;
    if (field === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
    setForm(f => ({ ...f, [field]: val }));
    setError(''); setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.phone && form.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/superadmin/admins/${id}`, {
          name: form.name, organizationName: form.organizationName,
          phone: form.phone, city: form.city, state: form.state,
        });
        setSuccess('Admin updated successfully.');
      } else {
        await api.post('/superadmin/admins', form);
        navigate('/superadmin/admins');
      }
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} admin.`);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white disabled:bg-gray-50 disabled:text-gray-400';

  return (
    <DashboardShell sidebar={<SuperAdminSidebar />}>
      <div className="p-6 max-w-2xl mx-auto">

        <button
          onClick={() => navigate('/superadmin/admins')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tenants
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isEdit ? 'Edit Admin' : 'Add Admin'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEdit
                  ? 'Update the institution admin details below.'
                  : 'Create a new institution admin and tenant.'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Name + Organization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Admin Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" required
                      value={form.name} onChange={set('name')}
                      placeholder="e.g. Rajesh Kumar"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Institution Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" required
                      value={form.organizationName} onChange={set('organizationName')}
                      placeholder="e.g. Sunrise Academy"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email" required
                    value={form.email} onChange={set('email')}
                    placeholder="admin@institution.com"
                    disabled={isEdit}
                    className={inputCls}
                  />
                  {isEdit && (
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed after creation.</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone} onChange={set('phone')}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    className={inputCls}
                  />
                  {form.phone.length > 0 && form.phone.length < 10 && (
                    <p className="text-xs text-amber-500 mt-1">{10 - form.phone.length} more digit{10 - form.phone.length !== 1 ? 's' : ''} needed</p>
                  )}
                </div>

                {/* City + State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <input
                      type="text"
                      value={form.city} onChange={set('city')}
                      placeholder="e.g. Mumbai"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                    <select value={form.state} onChange={set('state')} className={inputCls}>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password — create only */}
                {!isEdit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" required
                      value={form.password} onChange={set('password')}
                      placeholder="Min. 8 characters"
                      className={`${inputCls} font-mono`}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Share this with the admin so they can log in to their portal.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/superadmin/admins')}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={submitting}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-xl transition disabled:opacity-60"
                  >
                    {submitting
                      ? (isEdit ? 'Saving…' : 'Creating…')
                      : (isEdit ? 'Save Changes' : 'Create Admin')}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
};

export default CreateAdminPage;

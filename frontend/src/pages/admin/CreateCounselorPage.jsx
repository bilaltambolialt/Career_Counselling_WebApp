import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import AdminSidebar from '../../components/layout/AdminSidebar.jsx';
import { createCounselor } from '../../services/adminService.js';

const CreateCounselorPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => {
    let val = e.target.value;
    if (field === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
    setForm((f) => ({ ...f, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createCounselor(form);
      navigate('/admin/counselors');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create counselor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell sidebar={<AdminSidebar />}>
      <div className="p-6 max-w-xl mx-auto">
        <button
          onClick={() => navigate('/admin/counselors')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Counselors
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Add Counselor</h1>
              <p className="text-sm text-gray-500">
                They will be prompted to change password on first login.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Dr. Priya Patel"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="counselor@example.com"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="10-digit mobile number"
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]{10}"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Temporary Password <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                Share this with the counselor. They'll be asked to change it on login.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/counselors')}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition disabled:opacity-60"
              >
                {submitting ? 'Creating…' : 'Create Counselor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
};

export default CreateCounselorPage;

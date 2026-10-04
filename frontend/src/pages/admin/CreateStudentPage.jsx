import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Coins, Loader2 } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell.jsx';
import AdminSidebar from '../../components/layout/AdminSidebar.jsx';
import { createStudent, fetchCounselors } from '../../services/adminService.js';
import api from '../../utils/api.js';

const CATEGORIES = ['OPEN', 'OBC', 'SC', 'ST', 'EWS'];

const CreateStudentPage = () => {
  const navigate = useNavigate();
  const [counselors, setCounselors] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    category: '',
    counselorId: '',
  });
  const [error,         setError]         = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [noTokens,      setNoTokens]      = useState(false);
  const [requesting,    setRequesting]    = useState(false);
  const [requestSent,   setRequestSent]   = useState(false);

  useEffect(() => {
    fetchCounselors({ limit: 100 })
      .then((res) => setCounselors(res.data.data ?? []))
      .catch(() => {});
    // Pre-check token balance
    api.get('/admin/dashboard').then(r => {
      if ((r.data.data?.tokensRemaining ?? 1) <= 0) setNoTokens(true);
    }).catch(() => {});
  }, []);

  const handleRequestTokens = async () => {
    setRequesting(true);
    try {
      await api.post('/admin/request-tokens');
      setRequestSent(true);
    } catch { /* silent */ } finally {
      setRequesting(false);
    }
  };

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
      await createStudent(form);
      navigate('/admin/students');
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || 'Failed to create student.';
      if (status === 403) {
        setNoTokens(true);
        setError('');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell sidebar={<AdminSidebar />}>
      <div className="p-6 max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate('/admin/students')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Add Student</h1>
              <p className="text-sm text-gray-500">
                Student will be prompted to change password on first login.
              </p>
            </div>
          </div>

          {noTokens && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Coins className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">No Tokens Available</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    You have used all allocated tokens. Contact the Super Admin to allocate more tokens before adding new students.
                  </p>
                  {requestSent ? (
                    <p className="text-xs font-medium text-emerald-700 mt-2">Request sent to Super Admin ✓</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestTokens}
                      disabled={requesting}
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                    >
                      {requesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />}
                      Request Tokens from Super Admin
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Ravi Sharma"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="student@example.com"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Phone */}
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
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Password */}
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
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                Share this with the student. They'll be asked to change it on login.
              </p>
            </div>

            {/* Category + Counselor row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={set('category')}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Assign Counselor
                </label>
                <select
                  value={form.counselorId}
                  onChange={set('counselorId')}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                >
                  <option value="">Unassigned</option>
                  {counselors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/students')}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || noTokens}
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60"
              >
                {submitting ? 'Creating…' : 'Create Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
};

export default CreateStudentPage;

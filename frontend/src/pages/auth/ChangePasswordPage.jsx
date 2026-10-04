import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, LogOut, CheckCircle } from 'lucide-react';
import { changePassword } from '../../services/authService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLE_REDIRECTS } from '../../constants/roles.js';

const ChangePasswordPage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // forced=true  → came from must_change_password gate (show temporary-password language)
  // forced=false → user chose to change password voluntarily
  const forced = user?.mustChangePassword ?? searchParams.get('forced') === 'true';

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(form.currentPassword, form.newPassword, form.confirmPassword);
      updateUser({ mustChangePassword: false });
      if (forced) {
        navigate(ROLE_REDIRECTS[user?.role] || '/login', { replace: true });
      } else {
        setSuccess(true);
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      // Show the server message; fall back to the raw error detail if available
      const msg = err?.response?.data?.message
        || err?.response?.data?.error
        || err?.message
        || 'Failed to change password. Check your backend console for details.';
      console.error('[ChangePassword] Error:', err?.response?.data ?? err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const inputCls =
    'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-10';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8 relative">

        {/* Logout button — top right */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title="Logout"
          className="absolute top-5 right-5 flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          {loggingOut ? 'Logging out…' : 'Logout'}
        </button>

        {/* Icon + heading */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {forced ? 'Set Your Password' : 'Change Password'}
          </h1>
          {user && (
            <div className="mt-2 px-3 py-1 bg-indigo-50 rounded-full text-xs font-medium text-indigo-700 capitalize">
              {user.role?.replace('_', ' ')} — {user.name || user.email}
            </div>
          )}
          <p className="text-sm text-gray-500 mt-2 text-center">
            {forced
              ? 'A temporary password was set for this account. Please change it to continue.'
              : 'Enter your current password, then choose a new one.'}
          </p>
        </div>

        {/* Success state (voluntary only) */}
        {success && (
          <div className="mb-6 flex flex-col items-center gap-3 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-700">Password changed successfully!</p>
            <button
              onClick={() => navigate(ROLE_REDIRECTS[user?.role] || '/login')}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Go to dashboard
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {forced ? 'Temporary Password' : 'Current Password'}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={form.currentPassword}
                onChange={set('currentPassword')}
                placeholder={forced ? 'Enter your temporary password' : 'Enter your current password'}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={form.newPassword}
                onChange={set('newPassword')}
                placeholder="Min. 8 characters"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              placeholder="Repeat new password"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {submitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;

import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import api from '../../utils/api.js';

const ResetPasswordPage = () => {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const token                   = searchParams.get('token') || '';

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [status,          setStatus]          = useState('idle'); // idle | loading | success | error
  const [errMsg,          setErrMsg]          = useState('');

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-sm w-full text-center">
          <img src={logo} alt="ICGC" className="h-8 w-auto object-contain mx-auto mb-5" />
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Invalid link</h2>
          <p className="text-sm text-gray-500 mb-5">This reset link is missing its token. Please request a new one.</p>
          <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline font-medium">
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrMsg('Passwords do not match.'); setStatus('error'); return;
    }
    if (newPassword.length < 8) {
      setErrMsg('Password must be at least 8 characters.'); setStatus('error'); return;
    }
    setStatus('loading'); setErrMsg('');
    try {
      await api.post('/auth/reset-password', { token, newPassword, confirmPassword });
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setErrMsg(err?.response?.data?.message || 'Failed to reset password. The link may have expired.');
      setStatus('error');
    }
  };

  const inputCls = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <img src={logo} alt="ICGC" className="h-10 w-auto object-contain" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {status === 'success' ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password reset!</h2>
              <p className="text-gray-500 text-sm">Your password has been updated. Redirecting to login…</p>
              <Link to="/login" className="mt-4 inline-block text-sm text-indigo-600 hover:underline font-medium">
                Go to login now
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Set new password</h2>
                <p className="text-gray-500 text-sm mt-1">Choose a strong password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      required
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className={`${inputCls} pr-10`}
                      disabled={status === 'loading'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm new password</label>
                  <div className="relative">
                    <input
                      required
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      className={`${inputCls} pr-10`}
                      disabled={status === 'loading'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {status === 'error' && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{errMsg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting…
                    </span>
                  ) : 'Reset password'}
                </button>
              </form>

              {status === 'error' && errMsg.toLowerCase().includes('expired') && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline font-medium">
                    Request a new reset link
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

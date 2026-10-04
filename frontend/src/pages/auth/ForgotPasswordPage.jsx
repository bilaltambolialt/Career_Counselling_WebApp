import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import api from '../../utils/api.js';

const ForgotPasswordPage = () => {
  const [email,  setEmail]  = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | sent | error
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrMsg('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setStatus('sent');
    } catch (err) {
      setErrMsg(err?.response?.data?.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <img src={logo} alt="ICGC" className="h-10 w-auto object-contain" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {status === 'sent' ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                If <span className="font-medium text-gray-700">{email}</span> is registered,
                you'll receive a password reset link shortly. Check your spam folder if it doesn't arrive.
              </p>
              <p className="text-xs text-gray-400 mt-3">The link expires in 1 hour.</p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to login
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Forgot your password?</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      disabled={status === 'loading'}
                    />
                  </div>
                </div>

                {/* Error */}
                {status === 'error' && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    {errMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-60"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : 'Send reset link'}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-gray-100">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

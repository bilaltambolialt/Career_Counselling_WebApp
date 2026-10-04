import { Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useLoginForm } from '../../hooks/useLoginForm.js';
import logo from '../../assets/images/logo.png';

/**
 * Shared layout for all role-specific login pages.
 *
 * Props:
 *   role         - 'student' | 'admin' | 'counselor' | 'super_admin'
 *   redirectPath - path after successful login
 *   branding     - { icon, portalName, tagline, features[], footerNote }
 *   theme        - { leftGradient, submitBtn, inputFocus, linkText, badgeCls, featureIconCls }
 */
const RoleLoginPage = ({ role, redirectPath, branding, theme, hideBack = false }) => {
  const {
    email, setEmail,
    password, setPassword,
    showPassword, togglePassword,
    error, isLoading,
    handleSubmit,
  } = useLoginForm(role, redirectPath);

  return (
    <div className="min-h-screen flex">
      {/* ══════════════════════════════════════════
          LEFT PANEL — Role branding (desktop only)
      ══════════════════════════════════════════ */}
      <div
        className={`hidden lg:flex lg:w-5/12 xl:w-[42%] bg-gradient-to-br ${theme.leftGradient}
          flex-col justify-between p-12 relative overflow-hidden`}
      >
        {/* Decorative blur blobs */}
        <div className="absolute -top-28 -right-28 w-80 h-80 rounded-full bg-white opacity-5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-28 w-80 h-80 rounded-full bg-white opacity-5 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src={logo} alt="ICGC Logo" className="h-9 w-auto object-contain brightness-0 invert" />
          <span className="text-white font-bold text-lg">ICGC</span>
        </div>

        {/* Central content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
          {/* Role badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 w-fit
            bg-white/15 backdrop-blur border border-white/20`}
          >
            <span className="text-lg leading-none">{branding.icon}</span>
            <span className="text-white text-sm font-semibold">{branding.portalName}</span>
          </div>

          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            {branding.tagline}
          </h1>

          {/* Features */}
          {branding.features?.length > 0 && (
            <ul className="mt-8 space-y-3">
              {branding.features.map((feat) => (
                <li key={feat} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/80 text-sm">{feat}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/40 text-xs">{branding.footerNote}</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — Login form
      ══════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile: Logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <img src={logo} alt="ICGC Logo" className="h-8 w-auto object-contain" />
            <span className="font-bold text-gray-900">ICGC</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${theme.badgeCls}`}>
              <span>{branding.icon}</span>
              <span>{branding.portalName}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
            <p className="text-gray-500 text-sm mt-1">{branding.formSubtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`form-input ${theme.inputFocus}`}
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="form-label mb-0">Password</label>
                <Link
                  to={`/forgot-password?role=${role}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`form-input pr-10 ${theme.inputFocus}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                text-white font-medium text-sm transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${theme.submitBtn}`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                `Sign in to ${branding.portalName}`
              )}
            </button>
          </form>

          {/* Back to portal selector */}
          {!hideBack && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to portal selection
              </Link>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Don&apos;t have credentials?{' '}
            <span className="text-gray-500">Contact your administrator.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleLoginPage;

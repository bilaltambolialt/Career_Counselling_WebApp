import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Menu, X, KeyRound } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLE_LABELS, ROLE_COLORS } from '../../constants/roles.js';
import NotificationBell from './NotificationBell.jsx';

/**
 * Base shell layout for all dashboard pages.
 * Includes a mobile hamburger menu that opens a slide-in sidebar drawer.
 * Drawer auto-closes on route change (no sidebar changes needed).
 */
const DashboardShell = ({ children, sidebar }) => {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close drawer when the route changes (user tapped a nav link)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top Navbar ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">

          {/* Left: Hamburger (mobile) + Logo */}
          <div className="flex items-center gap-3">
            {sidebar && (
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                aria-label="Open navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <img src={logo} alt="ICGC" className="h-12 w-auto object-contain" />
            
          </div>

          {/* Right: Bell + User info + Change Password + Logout */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden sm:flex flex-col items-end ml-1">
              <span className="text-sm font-medium text-gray-900 leading-none">
                {user?.name}
              </span>
              <span
                className={`text-xs mt-0.5 px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[user?.role]}`}
              >
                {ROLE_LABELS[user?.role]}
              </span>
            </div>

            <Link
              to="/change-password"
              title="Change password"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              <span className="hidden lg:block">Change Password</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar — hidden on mobile, shown lg+ */}
        {sidebar && (
          <div className="hidden lg:block w-56 flex-shrink-0">
            {sidebar}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* ── Mobile Drawer ── */}
      {sidebar && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
              mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className={`fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-2xl
              transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
              mobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <img src={logo} alt="ICGC" className="h-7 w-auto object-contain" />
                <span className="font-semibold text-gray-900 text-sm">ICGC</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User info strip */}
            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/60 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[user?.role]}`}>
                {ROLE_LABELS[user?.role]}
              </span>
            </div>

            {/* Sidebar content (nav links) */}
            <div className="flex-1 overflow-y-auto">
              {sidebar}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardShell;

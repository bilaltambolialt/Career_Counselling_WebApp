import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, CalendarDays, LogOut, GitCompareArrows } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import { useAuth } from '../../hooks/useAuth.js';

const NAV = [
  { label: 'Dashboard',       to: '/counselor/dashboard',      icon: LayoutDashboard },
  { label: 'My Students',    to: '/counselor/students',       icon: Users },
  { label: 'Sessions',       to: '/counselor/sessions',       icon: CalendarDays },
  { label: 'Compare Colleges', to: '/counselor/compare-colleges', icon: GitCompareArrows },
  { label: 'Notifications',  to: '/counselor/notifications',  icon: Bell },
];

const CounselorSidebar = () => {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-full shrink-0 flex flex-col bg-white border-r border-gray-100 min-h-full">
      {/* Logo */}
      

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
};

export default CounselorSidebar;

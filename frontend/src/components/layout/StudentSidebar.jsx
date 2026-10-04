import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, FileText, TrendingUp, Download, Bell, CalendarDays, LogOut, Compass } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import { useAuth } from '../../hooks/useAuth.js';

const NAV = [
  { to: '/student/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/profile',         icon: User,            label: 'My Profile' },
  { to: '/student/scores',          icon: FileText,        label: 'Exam Scores' },
  { to: '/student/predictions',     icon: TrendingUp,      label: 'Recommendations' },
  { to: '/student/explore',         icon: Compass,         label: 'Explore Colleges' },
  { to: '/student/reports',         icon: Download,        label: 'Reports' },
  { to: '/student/sessions',        icon: CalendarDays,    label: 'Sessions' },
  { to: '/student/notifications',   icon: Bell,            label: 'Notifications' },
];

const StudentSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-full bg-white border-r border-gray-100 flex flex-col min-h-full">
      {/* Logo / Brand */}
      

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;

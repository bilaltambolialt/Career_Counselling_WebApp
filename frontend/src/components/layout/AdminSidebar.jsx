import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Bell,
  Inbox,
  ChevronRight,
} from 'lucide-react';
import logo from '../../assets/images/logo.png';
import { useAuth } from '../../hooks/useAuth.js';

const NAV_ITEMS = [
  { label: 'Dashboard',     path: '/admin/dashboard',     icon: LayoutDashboard },
  { label: 'Students',      path: '/admin/students',      icon: Users },
  { label: 'Counselors',    path: '/admin/counselors',    icon: UserCheck },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell },
];

const INQUIRY_ADMIN_EMAIL = 'apekshakamble007@gmail.com';

const AdminSidebar = () => {
  const { user } = useAuth();

  const navItems = [
    ...NAV_ITEMS,
    ...(user?.email === INQUIRY_ADMIN_EMAIL
      ? [{ label: 'Inquiries', path: '/admin/inquiries', icon: Inbox }]
      : []),
  ];

  return (
    <aside className="w-full flex-shrink-0 flex flex-col bg-white border-r border-gray-100 min-h-full">
      
      <nav className="flex flex-col gap-1 px-3 py-4">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight className="w-3 h-3 text-indigo-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;

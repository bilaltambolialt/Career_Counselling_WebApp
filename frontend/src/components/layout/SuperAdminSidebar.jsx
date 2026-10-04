import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Database,
  Trophy,
  Star,
  // School, // hidden — re-enable with Colleges nav item
  ChevronRight,
} from 'lucide-react';
import logo from '../../assets/images/logo.png';

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/superadmin/dashboard',    icon: LayoutDashboard },
  { label: 'Tenants',      path: '/superadmin/admins',       icon: Building2 },
  // { label: 'Colleges', path: '/superadmin/colleges', icon: School }, // hidden — re-enable when needed
  { label: 'Cutoff Data',  path: '/superadmin/cutoff',       icon: Database },
  { label: 'Top Colleges', path: '/superadmin/top-colleges', icon: Trophy },
  { label: 'Sponsored',    path: '/superadmin/sponsored',    icon: Star },
];

const SuperAdminSidebar = () => (
  <aside className="w-full flex-shrink-0 flex flex-col bg-white border-r border-gray-100 min-h-full">
    
      
    <nav className="flex flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-slate-100 text-slate-800'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-slate-700' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              />
              <span className="flex-1">{label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3 text-slate-500" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default SuperAdminSidebar;

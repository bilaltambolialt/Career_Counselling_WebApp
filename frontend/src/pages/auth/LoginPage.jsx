import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import logo from '../../assets/images/logo.png';

// Portal cards — each links to its dedicated login page
const PORTALS = [
  {
    role: 'student',
    path: '/login/student',
    icon: '🎓',
    label: 'Student',
    description: 'Access predictions, college tracker, and reports.',
    gradient: 'from-sky-500 to-blue-600',
    hoverBorder: 'hover:border-blue-400',
    hoverShadow: 'hover:shadow-blue-100',
    badgeCls: 'bg-blue-100 text-blue-700',
    arrowCls: 'text-blue-500 group-hover:text-blue-700',
  },
  {
    role: 'counselor',
    path: '/login/counselor',
    icon: '👨‍💼',
    label: 'Counselor',
    description: 'Manage assigned students and schedule sessions.',
    gradient: 'from-purple-500 to-purple-700',
    hoverBorder: 'hover:border-purple-400',
    hoverShadow: 'hover:shadow-purple-100',
    badgeCls: 'bg-purple-100 text-purple-700',
    arrowCls: 'text-purple-500 group-hover:text-purple-700',
  },
  {
    role: 'admin',
    path: '/login/admin',
    icon: '🛡️',
    label: 'Admin',
    description: 'Manage your institution, students, and analytics.',
    gradient: 'from-indigo-600 to-indigo-800',
    hoverBorder: 'hover:border-indigo-400',
    hoverShadow: 'hover:shadow-indigo-100',
    badgeCls: 'bg-indigo-100 text-indigo-700',
    arrowCls: 'text-indigo-500 group-hover:text-indigo-700',
  },
  {
    role: 'super_admin',
    path: '/login/superadmin',
    icon: '⚡',
    label: 'Super Admin',
    description: 'Platform-wide administration and revenue oversight.',
    gradient: 'from-slate-600 to-slate-800',
    hoverBorder: 'hover:border-slate-400',
    hoverShadow: 'hover:shadow-slate-100',
    badgeCls: 'bg-slate-100 text-slate-700',
    arrowCls: 'text-slate-500 group-hover:text-slate-700',
  },
];

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">

      {/* ── Header ── */}
      <div className="flex flex-col items-center mb-12 animate-slide-up">
        <img src={logo} alt="ICGC Logo" className="h-16 w-auto object-contain mb-4" />
        
        <p className="text-gray-500 mt-2 text-center text-sm max-w-xs">
          Indian Career Guidance Council — data-driven college admission guidance
        </p>
      </div>

      {/* ── Portal selector heading ── */}
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-gray-800">Which portal are you accessing?</h2>
        <p className="text-gray-400 text-sm mt-1">Select your role to continue to your login page.</p>
      </div>

      {/* ── Portal cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl animate-fade-in">
        {PORTALS.map((portal) => (
          <button
            key={portal.role}
            onClick={() => navigate(portal.path)}
            className={`group relative flex items-center gap-4 p-5 bg-white rounded-2xl
              border-2 border-gray-100 ${portal.hoverBorder}
              shadow-sm hover:shadow-lg ${portal.hoverShadow}
              transition-all duration-200 text-left`}
          >
            {/* Colored icon strip */}
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${portal.gradient}
                flex items-center justify-center flex-shrink-0 shadow-sm`}
            >
              <span className="text-xl leading-none">{portal.icon}</span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-gray-900">{portal.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${portal.badgeCls}`}>
                  Portal
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-snug">{portal.description}</p>
            </div>

            {/* Arrow */}
            <ArrowRight
              className={`w-4 h-4 flex-shrink-0 transition-all duration-200
                group-hover:translate-x-0.5 ${portal.arrowCls}`}
            />
          </button>
        ))}
      </div>

      {/* ── Footer ── */}
      <p className="text-xs text-gray-400 mt-12 text-center">
        Indian Career Guidance Council (ICGC) &mdash; All rights reserved.
      </p>
    </div>
  );
};

export default LoginPage;

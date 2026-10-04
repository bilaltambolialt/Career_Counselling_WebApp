import RoleLoginPage from '../../components/auth/RoleLoginPage.jsx';

// ── All Tailwind class strings must be complete (not dynamic) so the
//    scanner includes them in the build. Define them here in the source file.

const BRANDING = {
  icon: '🎓',
  portalName: 'Student Portal',
  tagline: 'Your admission journey starts here.',
  formSubtitle: 'Access your predictions, colleges, and reports.',
  features: [
    'Data-driven college admission analysis & recommendations',
    'Multi-college tracker & comparison',
    'Downloadable probability reports',
    'Book counselor sessions',
  ],
  footerNote: 'Your data is private and isolated to your institution.',
};

const THEME = {
  leftGradient: 'from-sky-600 via-sky-700 to-blue-800',
  submitBtn: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500',
  inputFocus: 'focus:ring-blue-500',
  badgeCls: 'bg-blue-100 text-blue-700',
};

const StudentLoginPage = () => (
  <RoleLoginPage
    role="student"
    redirectPath="/student/dashboard"
    branding={BRANDING}
    theme={THEME}
    hideBack
  />
);

export default StudentLoginPage;

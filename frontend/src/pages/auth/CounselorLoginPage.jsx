import RoleLoginPage from '../../components/auth/RoleLoginPage.jsx';

const BRANDING = {
  icon: '👨‍💼',
  portalName: 'Counselor Portal',
  tagline: 'Help students reach their dream colleges.',
  formSubtitle: 'Access your students, sessions, and reports.',
  features: [
    'Manage your assigned students',
    'Schedule & track counseling sessions',
    'Generate detailed analytical reports',
    'Publish notifications to students',
  ],
  footerNote: 'You can only access students assigned to you.',
};

const THEME = {
  leftGradient: 'from-purple-700 via-purple-800 to-indigo-900',
  submitBtn: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 focus:ring-purple-500',
  inputFocus: 'focus:ring-purple-500',
  badgeCls: 'bg-purple-100 text-purple-700',
};

const CounselorLoginPage = () => (
  <RoleLoginPage
    role="counselor"
    redirectPath="/counselor/dashboard"
    branding={BRANDING}
    theme={THEME}
  />
);

export default CounselorLoginPage;

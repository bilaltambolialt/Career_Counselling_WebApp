import RoleLoginPage from '../../components/auth/RoleLoginPage.jsx';

const BRANDING = {
  icon: '🛡️',
  portalName: 'Admin Portal',
  tagline: 'Manage your institution end-to-end.',
  formSubtitle: 'Access your tenant dashboard and management tools.',
  features: [
    'Student & counselor management',
    'Cutoff data upload (CSV + manual)',
    'Tenant analytics & reporting',
    'Notification management',
  ],
  footerNote: 'All data is strictly isolated to your tenant.',
};

const THEME = {
  leftGradient: 'from-indigo-950 via-indigo-900 to-purple-900',
  submitBtn: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:ring-indigo-500',
  inputFocus: 'focus:ring-indigo-500',
  badgeCls: 'bg-indigo-100 text-indigo-700',
};

const AdminLoginPage = () => (
  <RoleLoginPage
    role="admin"
    redirectPath="/admin/dashboard"
    branding={BRANDING}
    theme={THEME}
  />
);

export default AdminLoginPage;

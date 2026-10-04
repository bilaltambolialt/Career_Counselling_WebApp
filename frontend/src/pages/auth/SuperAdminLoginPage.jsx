import RoleLoginPage from '../../components/auth/RoleLoginPage.jsx';

const BRANDING = {
  icon: '⚡',
  portalName: 'Super Admin',
  tagline: 'Platform administration & oversight.',
  formSubtitle: 'Access the platform-wide control panel.',
  features: [
    'Manage all admin tenants',
    'Platform-wide analytics & revenue',
    'Sponsored college management',
    'Global notification broadcasting',
  ],
  footerNote: 'Restricted access — authorized personnel only.',
};

const THEME = {
  leftGradient: 'from-slate-900 via-slate-800 to-gray-900',
  submitBtn: 'bg-slate-700 hover:bg-slate-800 active:bg-slate-900 focus:ring-slate-500',
  inputFocus: 'focus:ring-slate-500',
  badgeCls: 'bg-slate-100 text-slate-700',
};

const SuperAdminLoginPage = () => (
  <RoleLoginPage
    role="super_admin"
    redirectPath="/superadmin/dashboard"
    branding={BRANDING}
    theme={THEME}
  />
);

export default SuperAdminLoginPage;

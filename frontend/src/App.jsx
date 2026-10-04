import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { ROLE_REDIRECTS } from './constants/roles.js';

// ── Auth / Login pages ────────────────────────────────────
import LoginPage from './pages/auth/LoginPage.jsx';               // Portal selector
import StudentLoginPage from './pages/auth/StudentLoginPage.jsx';
import AdminLoginPage from './pages/auth/AdminLoginPage.jsx';
import CounselorLoginPage from './pages/auth/CounselorLoginPage.jsx';
import SuperAdminLoginPage from './pages/auth/SuperAdminLoginPage.jsx';
import ChangePasswordPage from './pages/auth/ChangePasswordPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';

// ── Route guard ───────────────────────────────────────────
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';

// ── Student (Phase 4–8) ───────────────────────────────────
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import ProfilePage from './pages/student/ProfilePage.jsx';
import ExamScoresPage from './pages/student/ExamScoresPage.jsx';
import PredictionsPage from './pages/student/PredictionsPage.jsx';
import ReportsPage from './pages/student/ReportsPage.jsx';
import NotificationsPage from './pages/student/NotificationsPage.jsx';
import StudentSessionsPage from './pages/student/StudentSessionsPage.jsx';
import ExploreCollegesPage from './pages/student/ExploreCollegesPage.jsx';

// ── Admin ─────────────────────────────────────────────────
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import StudentsPage from './pages/admin/StudentsPage.jsx';
import CreateStudentPage from './pages/admin/CreateStudentPage.jsx';
import StudentDetailPage from './pages/admin/StudentDetailPage.jsx';
import CounselorsPage from './pages/admin/CounselorsPage.jsx';
import CreateCounselorPage from './pages/admin/CreateCounselorPage.jsx';
import CounselorDetailPage from './pages/admin/CounselorDetailPage.jsx';
import AdminNotificationsPage from './pages/admin/NotificationsPage.jsx';
import InquiriesPage from './pages/admin/InquiriesPage.jsx';

// ── Counselor (Phase 6–8) ─────────────────────────────────
import CounselorDashboard from './pages/counselor/CounselorDashboard.jsx';
import CounselorStudentsPage from './pages/counselor/CounselorStudentsPage.jsx';
import CounselorNotificationsPage from './pages/counselor/CounselorNotificationsPage.jsx';
import CounselorSessionsPage from './pages/counselor/CounselorSessionsPage.jsx';
import CounselorCompareCollegesPage from './pages/counselor/CounselorCompareCollegesPage.jsx';

// ── Super Admin ───────────────────────────────────────────
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard.jsx';
import SuperAdminAdminsPage from './pages/superadmin/AdminsPage.jsx';
import CreateAdminPage from './pages/superadmin/CreateAdminPage.jsx';
import SuperAdminCutoffPage from './pages/superadmin/CutoffPage.jsx';
import TopCollegesPage from './pages/superadmin/TopCollegesPage.jsx';
import SponsoredCollegesPage from './pages/superadmin/SponsoredCollegesPage.jsx';
// import CollegesPage from './pages/superadmin/CollegesPage.jsx'; // hidden — re-enable when needed

// ── Landing Page ──────────────────────────────────────────
import LandingPage from './pages/landing/LandingPage.jsx';

// ─────────────────────────────────────────────────────────

/**
 * Wraps a login route so an already-authenticated user
 * is redirected to their own dashboard instead of seeing the login page.
 */
const PublicRoute = ({ element }) => {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated
    ? <Navigate to={ROLE_REDIRECTS[user.role]} replace />
    : element;
};

// ─────────────────────────────────────────────────────────

const App = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Wait for session restore before rendering routes
  if (isLoading) return null;

  return (
    <Routes>

      {/* ══════════════════════════════════════════
          PUBLIC — Login pages
      ══════════════════════════════════════════ */}

      {/* Portal selector — choose your role */}
      <Route path="/login" element={<PublicRoute element={<LoginPage />} />} />

      {/* Role-specific login pages */}
      <Route path="/login/student"    element={<PublicRoute element={<StudentLoginPage />} />} />
      <Route path="/login/admin"      element={<PublicRoute element={<AdminLoginPage />} />} />
      <Route path="/login/counselor"  element={<PublicRoute element={<CounselorLoginPage />} />} />
      <Route path="/login/superadmin" element={<PublicRoute element={<SuperAdminLoginPage />} />} />

      {/* Forgot / Reset password — fully public */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* ══════════════════════════════════════════
          SEMI-PROTECTED — Change Password
          (any authenticated role, no mustChangePassword block)
      ══════════════════════════════════════════ */}
      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* ══════════════════════════════════════════
          PROTECTED — Student (Phase 4)
      ══════════════════════════════════════════ */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/profile"   element={<ProfilePage />} />
        <Route path="/student/scores"       element={<ExamScoresPage />} />
        <Route path="/student/predictions" element={<PredictionsPage />} />
        <Route path="/student/reports"        element={<ReportsPage />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
        <Route path="/student/sessions"      element={<StudentSessionsPage />} />
        <Route path="/student/explore"       element={<ExploreCollegesPage />} />
      </Route>

      {/* ══════════════════════════════════════════
          PROTECTED — Admin (Phase 3)
      ══════════════════════════════════════════ */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin/dashboard"         element={<AdminDashboard />} />
        <Route path="/admin/students"          element={<StudentsPage />} />
        <Route path="/admin/students/new"      element={<CreateStudentPage />} />
        <Route path="/admin/students/:id"      element={<StudentDetailPage />} />
        <Route path="/admin/counselors"        element={<CounselorsPage />} />
        <Route path="/admin/counselors/new"    element={<CreateCounselorPage />} />
        <Route path="/admin/counselors/:id"    element={<CounselorDetailPage />} />
        <Route path="/admin/notifications"     element={<AdminNotificationsPage />} />
        <Route path="/admin/inquiries"         element={<InquiriesPage />} />
      </Route>

      {/* ══════════════════════════════════════════
          PROTECTED — Counselor
      ══════════════════════════════════════════ */}
      <Route element={<ProtectedRoute allowedRoles={['counselor']} />}>
        <Route path="/counselor/dashboard"      element={<CounselorDashboard />} />
        <Route path="/counselor/students"       element={<CounselorStudentsPage />} />
        <Route path="/counselor/notifications"  element={<CounselorNotificationsPage />} />
        <Route path="/counselor/sessions"        element={<CounselorSessionsPage />} />
        <Route path="/counselor/compare-colleges" element={<CounselorCompareCollegesPage />} />
      </Route>

      {/* ══════════════════════════════════════════
          PROTECTED — Super Admin
      ══════════════════════════════════════════ */}
      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/admins"        element={<SuperAdminAdminsPage />} />
        <Route path="/superadmin/admins/new"    element={<CreateAdminPage />} />
        <Route path="/superadmin/admins/:id"    element={<CreateAdminPage />} />
        {/* <Route path="/superadmin/colleges" element={<CollegesPage />} /> */}{/* hidden — re-enable when needed */}
        <Route path="/superadmin/cutoff"        element={<SuperAdminCutoffPage />} />
        <Route path="/superadmin/top-colleges"  element={<TopCollegesPage />} />
        <Route path="/superadmin/sponsored"     element={<SponsoredCollegesPage />} />
      </Route>

      {/* ══════════════════════════════════════════
          ROOT & FALLBACK
      ══════════════════════════════════════════ */}

      {/* Landing page is now the root */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to={ROLE_REDIRECTS[user.role]} replace />
            : <LandingPage />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
};

export default App;

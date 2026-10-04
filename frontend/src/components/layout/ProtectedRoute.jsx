import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * Protects routes by role.
 * - Redirects unauthenticated users to /login
 * - Redirects wrong-role users to their own dashboard
 * - Shows loading spinner while session is being restored
 *
 * Usage:
 *   <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
 *     <Route path="dashboard" element={<AdminDashboard />} />
 *   </Route>
 */

const ROLE_HOME = {
  super_admin: '/superadmin/dashboard',
  admin: '/admin/dashboard',
  counselor: '/counselor/dashboard',
  student: '/student/dashboard',
};

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's own role home instead of showing 403
    const home = ROLE_HOME[user.role] || '/login';
    return <Navigate to={home} replace />;
  }

  // Force password change on first login (student & counselor)
  if (allowedRoles && user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

/**
 * Hook to access authentication context.
 * Must be used inside <AuthProvider>.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

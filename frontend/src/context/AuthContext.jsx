import { createContext, useState, useEffect, useCallback } from 'react';
import { loginUser, logoutUser, fetchMe } from '../services/authService.js';
import { ROLE_REDIRECTS } from '../constants/roles.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // { id, name, email, role, tenantId, ... }
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while checking stored session

  // ─── Restore session from localStorage on mount ───────────
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch {
        // Corrupted storage — clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    setIsLoading(false);
  }, []);

  // ─── Login ────────────────────────────────────────────────
  const login = useCallback(async (email, password, role) => {
    const { token: newToken, user: newUser } = await loginUser(email, password, role);

    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    return newUser;
  }, []);

  // ─── Logout ───────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      // Always clear React state regardless of server response.
      // logoutUser's finally block always clears localStorage.
      setToken(null);
      setUser(null);
    }
  }, []);

  // ─── Refresh user profile ─────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await fetchMe();
      setUser(freshUser);
      localStorage.setItem('auth_user', JSON.stringify(freshUser));
    } catch {
      // Session expired — clear auth
      await logout();
    }
  }, [logout]);

  // ─── Patch specific user fields without an API call ───────
  // Used by ChangePasswordPage to clear mustChangePassword locally
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('auth_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

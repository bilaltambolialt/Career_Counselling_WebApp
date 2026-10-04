import api from '../utils/api.js';

/**
 * Login with email, password and role.
 * Returns { token, user } on success.
 */
export const loginUser = async (email, password, role) => {
  const response = await api.post('/auth/login', { email, password, role });
  return response.data.data; // { token, user }
};

/**
 * Fetch the currently authenticated user's profile.
 */
export const fetchMe = async () => {
  const response = await api.get('/auth/me');
  return response.data.data;
};

/**
 * Logout — server is stateless; client clears storage.
 */
export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
};

/**
 * Change password for the authenticated user.
 */
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  const response = await api.post('/auth/change-password', {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return response.data;
};

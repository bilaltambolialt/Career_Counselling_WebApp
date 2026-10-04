import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Request interceptor — inject auth token ─────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle 401 globally + auto-retry network errors ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Retry once on pure network errors (no response received at all).
    // Covers IPv6→IPv4 fallback on Windows and transient --watch restarts.
    if (!error.response && !error.config?._retried) {
      error.config._retried = true;
      await new Promise((r) => setTimeout(r, 400)); // brief pause before retry
      return api(error.config);
    }

    if (error.response?.status === 401) {
      // Skip redirect on the login endpoint itself — wrong credentials should
      // surface as an inline error, not a redirect loop.
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';

// ─── Axios Instance ─────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token Helpers ──────────────────────────────────
const TOKEN_KEY = 'eduportal_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

// ─── Request Interceptor (attach JWT) ───────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor (handle 401) ──────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only trigger session expiration for explicit auth verification requests
    const isAuthEndpoint = error.config?.url?.includes('/auth/me') || error.config?.url?.includes('/auth/verify');
    if (error.response?.status === 401 && isAuthEndpoint) {
      clearToken();
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  },
);

export default api;

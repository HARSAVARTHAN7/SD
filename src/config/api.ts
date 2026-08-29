/**
 * Centralized API configuration for Edu-Portal
 * Backend URL: https://sd-backend-g5j3.onrender.com
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'https://sd-backend-g5j3.onrender.com';

export const BACKEND_URL = 'https://sd-backend-g5j3.onrender.com';

/**
 * Helper to construct full backend API URLs
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

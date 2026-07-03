import axios from 'axios';
import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

api.interceptors.request.use(
  async (config) => {
    const mockToken = localStorage.getItem('mock_bearer_token');
    if (mockToken) {
      config.headers.Authorization = `Bearer ${mockToken}`;
      return config;
    }
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;
    const mockToken = localStorage.getItem('mock_bearer_token');
    if (mockToken && error.response?.status === 401) {
      localStorage.removeItem('mock_bearer_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && auth.currentUser) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          // Force refresh the token since we got a 401
          const token = await auth.currentUser.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (retryError) {
          console.error("Token refresh retry failed:", retryError);
          await auth.signOut();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(retryError);
        }
      } else {
        // Already retried once and still got 401, sign out to prevent infinite loops
        console.warn("API request failed with 401 twice. Logging out.");
        await auth.signOut();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export function unwrap<T>(response: { data: { success?: boolean; data: T } }): T {
  return response.data.data;
}

export default api;

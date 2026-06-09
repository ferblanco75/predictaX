import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      // Clear Zustand store so isLoggedIn becomes false immediately
      import('@/lib/stores/app-store').then(({ useAppStore }) => {
        useAppStore.getState().logout();
      });
      window.location.href = '/auth';
    }
    // Surface backend detail message as the error message
    const detail = error.response?.data?.detail;
    if (detail && typeof detail === 'string') {
      return Promise.reject(new Error(detail));
    }
    return Promise.reject(error);
  }
);

export default api;

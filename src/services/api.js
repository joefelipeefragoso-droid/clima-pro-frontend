import axios from 'axios';
import { clearAuthData, getStoredUser } from '../auth/authSession';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
});

api.interceptors.request.use((config) => {
  const user = getStoredUser();
  if (user?.email) config.headers['x-user-email'] = user.email;
  if (user?.role) config.headers['x-user-role'] = user.role;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthRoute = error.config?.url?.includes('/login') || error.config?.url?.includes('/auth/');

    if ((status === 401 || status === 403) && !isAuthRoute) {
      clearAuthData();
      window.location.replace('/login');
    }

    return Promise.reject(error);
  }
);

export default api;

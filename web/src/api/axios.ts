import axios from 'axios';

const getAuthState = () => {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return { accessToken: null, user: null };
    return JSON.parse(raw)?.state ?? { accessToken: null, user: null };
  } catch {
    return { accessToken: null, user: null };
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const { accessToken } = getAuthState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { user } = getAuthState();
      const refreshToken = localStorage.getItem('refresh_token');
      if (!user?.id || !refreshToken) {
        window.location.href = '/login';
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      isRefreshing = true;
      try {
        const res = await api.post('/auth/refresh', { userId: user.id, refreshToken });
        const { accessToken: newToken, refreshToken: newRefresh } = res.data?.data || res.data;
        const stored = localStorage.getItem('auth-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.state.accessToken = newToken;
          localStorage.setItem('auth-storage', JSON.stringify(parsed));
        }
        localStorage.setItem('refresh_token', newRefresh);
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;

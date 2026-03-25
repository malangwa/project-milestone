import api from './axios';

export const authApi = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (data: { userId: string; refreshToken: string }) =>
    api.post('/auth/refresh', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

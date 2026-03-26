import api from './axios';

export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  updateMe: (data: any) => api.patch('/users/me', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  createUser: (data: { name: string; email: string; password: string; role?: string }) => api.post('/users', data),
};

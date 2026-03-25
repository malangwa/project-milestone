import api from './axios';

export const expensesApi = {
  getByProject: (projectId: string) => api.get(`/expenses/project/${projectId}`),
  getOne: (id: string) => api.get(`/expenses/${id}`),
  create: (data: object) => api.post('/expenses', data),
  update: (id: string, data: object) => api.patch(`/expenses/${id}`, data),
  approve: (id: string) => api.patch(`/expenses/${id}/approve`),
  reject: (id: string) => api.patch(`/expenses/${id}/reject`),
  remove: (id: string) => api.delete(`/expenses/${id}`),
};

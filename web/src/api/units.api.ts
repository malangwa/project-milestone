import api from './axios';

export const unitsApi = {
  getAll: () => api.get('/units'),
  getOne: (id: string) => api.get(`/units/${id}`),
  create: (data: object) => api.post('/units', data),
  update: (id: string, data: object) => api.patch(`/units/${id}`, data),
  remove: (id: string) => api.delete(`/units/${id}`),
};

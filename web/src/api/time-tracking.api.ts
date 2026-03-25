import api from './axios';

export const timeTrackingApi = {
  getByProject: (projectId: string) => api.get(`/time-tracking/project/${projectId}`),
  getProjectTotal: (projectId: string) => api.get(`/time-tracking/project/${projectId}/total`),
  getMine: () => api.get('/time-tracking/me'),
  create: (data: object) => api.post('/time-tracking', data),
  update: (id: string, data: object) => api.patch(`/time-tracking/${id}`, data),
  remove: (id: string) => api.delete(`/time-tracking/${id}`),
};

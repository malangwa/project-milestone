import api from './axios';

export const resourcesApi = {
  getByProject: (projectId: string) => api.get(`/resources/project/${projectId}`),
  getOne: (id: string) => api.get(`/resources/${id}`),
  create: (data: object) => api.post('/resources', data),
  update: (id: string, data: object) => api.patch(`/resources/${id}`, data),
  remove: (id: string) => api.delete(`/resources/${id}`),
};

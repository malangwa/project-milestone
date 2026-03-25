import api from './axios';

export const issuesApi = {
  getByProject: (projectId: string) => api.get(`/issues/project/${projectId}`),
  getOne: (id: string) => api.get(`/issues/${id}`),
  create: (data: object) => api.post('/issues', data),
  update: (id: string, data: object) => api.patch(`/issues/${id}`, data),
  remove: (id: string) => api.delete(`/issues/${id}`),
};

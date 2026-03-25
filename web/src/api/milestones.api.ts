import api from './axios';

export const milestonesApi = {
  getByProject: (projectId: string) => api.get(`/milestones/project/${projectId}`),
  getOne: (id: string) => api.get(`/milestones/${id}`),
  create: (data: object) => api.post('/milestones', data),
  update: (id: string, data: object) => api.patch(`/milestones/${id}`, data),
  remove: (id: string) => api.delete(`/milestones/${id}`),
};

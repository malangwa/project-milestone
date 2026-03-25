import api from './axios';

export const tasksApi = {
  getByProject: (projectId: string) => api.get(`/tasks/project/${projectId}`),
  getByMilestone: (milestoneId: string) => api.get(`/tasks/milestone/${milestoneId}`),
  getOne: (id: string) => api.get(`/tasks/${id}`),
  create: (data: object) => api.post('/tasks', data),
  update: (id: string, data: object) => api.patch(`/tasks/${id}`, data),
  remove: (id: string) => api.delete(`/tasks/${id}`),
};

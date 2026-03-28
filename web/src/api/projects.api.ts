import api from './axios';

export const projectsApi = {
  getAll: () => api.get('/projects'),
  getOne: (id: string) => api.get(`/projects/${id}`),
  create: (data: object) => api.post('/projects', data),
  update: (id: string, data: object) => api.patch(`/projects/${id}`, data),
  remove: (id: string) => api.delete(`/projects/${id}`),
  getMembers: (id: string) => api.get(`/projects/${id}/members`),
  addMember: (id: string, data: { email: string; role?: string }) => api.post(`/projects/${id}/members`, data),
  removeMember: (id: string, memberUserId: string) => api.delete(`/projects/${id}/members/${memberUserId}`),
};

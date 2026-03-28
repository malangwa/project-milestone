import api from './axios';

export const materialRequestsApi = {
  getByProject: (projectId: string) => api.get(`/projects/${projectId}/material-requests`),
  create: (projectId: string, data: object) => api.post(`/projects/${projectId}/material-requests`, data),
  approve: (id: string) => api.patch(`/material-requests/${id}/approve`),
  reject: (id: string) => api.patch(`/material-requests/${id}/reject`),
};

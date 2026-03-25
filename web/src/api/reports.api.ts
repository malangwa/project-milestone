import api from './axios';

export const reportsApi = {
  getOverview: () => api.get('/reports/overview'),
  getProjectSummary: (projectId: string) => api.get(`/reports/project/${projectId}`),
};

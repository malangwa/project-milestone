import api from './axios';

export const auditApi = {
  getAll: (limit = 100) => api.get(`/audit-logs?limit=${limit}`),
  getByEntity: (entityType: string, entityId: string) => api.get(`/audit-logs/${entityType}/${entityId}`),
};

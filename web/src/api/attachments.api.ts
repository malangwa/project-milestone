import api from './axios';

export const attachmentsApi = {
  getByEntity: (entityType: string, entityId: string) =>
    api.get(`/attachments?entityType=${entityType}&entityId=${entityId}`),
  create: (data: object) => api.post('/attachments', data),
  getOne: (id: string) => api.get(`/attachments/${id}`),
  remove: (id: string) => api.delete(`/attachments/${id}`),
};

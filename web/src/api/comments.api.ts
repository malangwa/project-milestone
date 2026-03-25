import api from './axios';

export const commentsApi = {
  getByEntity: (entityType: string, entityId: string) =>
    api.get(`/comments?entityType=${entityType}&entityId=${entityId}`),
  create: (data: { entityType: string; entityId: string; content: string }) =>
    api.post('/comments', data),
  remove: (id: string) => api.delete(`/comments/${id}`),
};

import api from './axios';

export const attachmentsApi = {
  getByEntity: (entityType: string, entityId: string) =>
    api.get(`/attachments?entityType=${entityType}&entityId=${entityId}`),

  upload: (file: File, entityType: string, entityId: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description?.trim()) {
      formData.append('description', description.trim());
    }
    return api.post(`/attachments/upload?entityType=${entityType}&entityId=${entityId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },

  getDownloadUrl: (id: string) =>
    api.get(`/attachments/${id}/download-url`),

  getOne: (id: string) => api.get(`/attachments/${id}`),

  remove: (id: string) => api.delete(`/attachments/${id}`),
};

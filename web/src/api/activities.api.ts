import api from './axios';

export const activitiesApi = {
  getByProject: (projectId: string, limit = 50) =>
    api.get(`/activities/project/${projectId}?limit=${limit}`),
};

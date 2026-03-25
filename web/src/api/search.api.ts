import api from './axios';

export const searchApi = {
  search: (q: string) => api.get(`/search?q=${encodeURIComponent(q)}`),
};

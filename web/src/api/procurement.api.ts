import api from './axios';

export const suppliersApi = {
  getAll: () => api.get('/suppliers'),
  getOne: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: object) => api.post('/suppliers', data),
  update: (id: string, data: object) => api.patch(`/suppliers/${id}`, data),
  remove: (id: string) => api.delete(`/suppliers/${id}`),
};

export const purchaseOrdersApi = {
  getByProject: (projectId: string) => api.get(`/projects/${projectId}/purchase-orders`),
  getOne: (id: string) => api.get(`/purchase-orders/${id}`),
  create: (projectId: string, data: object) => api.post(`/projects/${projectId}/purchase-orders`, data),
  approve: (id: string) => api.patch(`/purchase-orders/${id}/approve`),
  send: (id: string) => api.patch(`/purchase-orders/${id}/send`),
  cancel: (id: string) => api.patch(`/purchase-orders/${id}/cancel`),
};

export const supplierInvoicesApi = {
  getByPurchaseOrder: (purchaseOrderId: string) => api.get(`/purchase-orders/${purchaseOrderId}/invoices`),
  getOne: (id: string) => api.get(`/invoices/${id}`),
  create: (purchaseOrderId: string, data: object) => api.post(`/purchase-orders/${purchaseOrderId}/invoices`, data),
  verify: (id: string) => api.patch(`/invoices/${id}/verify`),
  approve: (id: string) => api.patch(`/invoices/${id}/approve`),
  pay: (id: string) => api.patch(`/invoices/${id}/pay`),
  reject: (id: string) => api.patch(`/invoices/${id}/reject`),
};

export const goodsReceiptsApi = {
  getByPurchaseOrder: (purchaseOrderId: string) => api.get(`/purchase-orders/${purchaseOrderId}/receipts`),
  getOne: (id: string) => api.get(`/receipts/${id}`),
  create: (purchaseOrderId: string, data: object) => api.post(`/purchase-orders/${purchaseOrderId}/receipts`, data),
};

export const inventoryApi = {
  getByProject: (projectId: string) => api.get(`/projects/${projectId}/inventory`),
  getMovements: (projectId: string) => api.get(`/projects/${projectId}/inventory/movements`),
  adjust: (projectId: string, data: object) => api.post(`/projects/${projectId}/inventory/adjust`, data),
  transfer: (projectId: string, stockItemId: string, data: object) =>
    api.post(`/projects/${projectId}/inventory/${stockItemId}/transfer`, data),
  getGlobal: () => api.get('/inventory/global'),
};

import api from './api';

const adminService = {
  getPendingUsers: () => api.get('/admin/pending-users'),
  approveUser: (userId) => api.post('/admin/approve-user', { userId }),
  rejectUser: (userId) => api.post('/admin/reject-user', { userId }),
  assignRole: (data) => api.patch('/admin/assign-role', data),
  blockUser: (userId) => api.patch(`/admin/users/${userId}/block`),
  unblockUser: (userId) => api.patch(`/admin/users/${userId}/unblock`),

  getWhitelist: () => api.get('/admin/whitelist'),
  addToWhitelist: (data) => api.post('/admin/whitelist', data),
  removeFromWhitelist: (id) => api.delete(`/admin/whitelist/${id}`),

  getAccessRequests: (status) => api.get('/admin/access-requests', { params: { status } }),
  approveAccessRequest: (requestId) => api.post(`/admin/access-requests/${requestId}/approve`),
  rejectAccessRequest: (requestId, note) => api.post(`/admin/access-requests/${requestId}/reject`, { adminNote: note }),
};

export default adminService;
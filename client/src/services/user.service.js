import api from './api';

const userService = {
  listUsers: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.patch('/users/password', data),
  restrictUser: (id) => api.patch(`/users/restrict/${id}`),
  removeUser: (id) => api.delete(`/users/${id}`),
  // ✅ FIX #1: was '/leaderboard' — route is mounted at /api/qp/leaderboard
  getLeaderboard: () => api.get('/qp/leaderboard'),
  getPendingUsers: () => api.get('/admin/pending-users'),
  approveUser: (userId) => api.post('/admin/approve-user', { userId }),
  assignRole: (data) => api.patch('/admin/assign-role', data),
};

export default userService;
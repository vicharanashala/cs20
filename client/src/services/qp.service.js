import api from './api';

const qpService = {
  getMyScore: () => api.get('/qp/my-score'),
  getHistory: () => api.get('/qp/history'),
  // ✅ FIX #1: was '/leaderboard' — route is mounted at /api/qp/leaderboard
  getLeaderboard: () => api.get('/qp/leaderboard'),
};

export default qpService;
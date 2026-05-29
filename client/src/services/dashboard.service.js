import api from './api';

const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
};

export default dashboardService;

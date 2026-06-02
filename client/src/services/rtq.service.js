import api from './api';

const rtqService = {
  list: (params) => api.get('/rtq', { params }),
  get: (id) => api.get(`/rtq/${id}`),
  submitQuestion: (data) => api.post('/rtq/question', data),
  addAnswer: (id, data) => api.post(`/rtq/${id}/answer`, data),
  upvoteAnswer: (answerId) => api.post(`/rtq/answer/upvote/${answerId}`),
  approveAnswer: (answerId) => api.patch(`/rtq/approve-answer/${answerId}`),
  markAccepted: (id) => api.patch(`/rtq/mark-accepted/${id}`),
  remove: (id) => api.delete(`/rtq/${id}`),
  report: (id) => api.post(`/rtq/report/${id}`),
  convertToFAQ: (id) => api.post(`/rtq/convert/${id}`),
  updateStatus: (id, status) => api.patch(`/rtq/status/${id}`, { status }),
};

export default rtqService;
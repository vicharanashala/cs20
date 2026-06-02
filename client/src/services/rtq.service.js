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
  convertToFAQ: (id, data) => api.post(`/rtq/convert/${id}`, data),
  updateStatus: (id, status) => api.patch(`/rtq/status/${id}`, { status }),
  rejectAnswer: (answerId) => api.patch(`/rtq/reject-answer/${answerId}`),
  rejectQuestion: (id) => api.patch(`/rtq/reject-question/${id}`),
  reviewQuestion: (id) => api.patch(`/rtq/review-question/${id}`),
  reviewAnswer: (answerId) => api.patch(`/rtq/review-answer/${answerId}`),
};

export default rtqService;
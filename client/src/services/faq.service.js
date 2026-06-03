import api from './api';

const faqService = {
  list: (params) => api.get('/faq', { params }),
  get: (id) => api.get(`/faq/${id}`),
  create: (data) => api.post('/faq', data),
  update: (id, data) => api.put(`/faq/${id}`, data),
  remove: (id) => api.delete(`/faq/${id}`),
  upvote: (id) => api.post(`/faq/upvote/${id}`),
  reviewFAQ: (id) => api.patch(`/faq/review-faq/${id}`),
  toggleTrendingFAQ: (id) => api.patch(`/faq/toggle-trending/${id}`),
  getCategories: () => api.get('/faq/categories'),
  listCategoriesRanked: () => api.get('/faq/categories/ranked'),
  upvoteCategory: (categoryName) => api.post(`/faq/categories/upvote/${encodeURIComponent(categoryName)}`),
  requestConversion: (rtqId, suggestedAnswer) => api.post('/faq/request-conversion', { rtqId, suggestedAnswer }),
  listConversionRequests: (status) => api.get('/faq/conversion-requests', { params: { status } }),
  approveConversionRequest: (id) => api.patch(`/faq/conversion-requests/${id}/approve`),
  rejectConversionRequest: (id, adminNote) => api.patch(`/faq/conversion-requests/${id}/reject`, { adminNote }),
};

export default faqService;
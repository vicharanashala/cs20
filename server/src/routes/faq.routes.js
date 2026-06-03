import { Router } from 'express';
import { listFAQs, getFAQ, createFAQ, updateFAQ, deleteFAQ, upvoteFAQ, getCategories, markFAQForReview, toggleTrendingFAQ } from '../controllers/faq.controller.js';
import { createConversionRequest, listConversionRequests, approveConversionRequest, rejectConversionRequest } from '../controllers/faq-conversion.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();
router.get('/', listFAQs);
router.get('/categories', getCategories);
router.get('/conversion-requests', authenticate, authorizeRoles('senior', 'admin'), listConversionRequests);
router.patch('/review-faq/:id', authenticate, authorizeRoles('moderator', 'senior', 'admin'), markFAQForReview);
router.patch('/toggle-trending/:id', authenticate, authorizeRoles('moderator', 'senior', 'admin'), toggleTrendingFAQ);
router.patch('/conversion-requests/:id/approve', authenticate, authorizeRoles('senior', 'admin'), approveConversionRequest);
router.patch('/conversion-requests/:id/reject', authenticate, authorizeRoles('senior', 'admin'), rejectConversionRequest);
router.get('/:id', getFAQ);
router.post('/', authenticate, authorizeRoles('senior', 'admin'), createFAQ);
router.post('/request-conversion', authenticate, authorizeRoles('moderator', 'senior'), createConversionRequest);
router.put('/:id', authenticate, authorizeRoles('senior', 'admin'), updateFAQ);
router.delete('/:id', authenticate, authorizeRoles('senior', 'admin'), deleteFAQ);
router.post('/upvote/:id', authenticate, upvoteFAQ);

export default router;
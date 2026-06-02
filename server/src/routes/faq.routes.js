import { Router } from 'express';
import { listFAQs, getFAQ, createFAQ, updateFAQ, deleteFAQ, upvoteFAQ, getCategories, markFAQForReview, toggleTrendingFAQ } from '../controllers/faq.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();
router.get('/', authenticate, listFAQs);
router.get('/categories', authenticate, getCategories);
router.patch('/review-faq/:id', authenticate, authorizeRoles('moderator', 'senior', 'admin'), markFAQForReview);
router.patch('/toggle-trending/:id', authenticate, authorizeRoles('moderator', 'senior', 'admin'), toggleTrendingFAQ);
router.get('/:id', authenticate, getFAQ);
router.post('/', authenticate, authorizeRoles('senior', 'admin'), createFAQ);
router.put('/:id', authenticate, authorizeRoles('senior', 'admin'), updateFAQ);
router.delete('/:id', authenticate, authorizeRoles('senior', 'admin'), deleteFAQ);
router.post('/upvote/:id', authenticate, upvoteFAQ);

export default router;
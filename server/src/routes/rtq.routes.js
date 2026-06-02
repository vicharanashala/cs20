import { Router } from 'express';
import {
  listRTQs, getRTQ, submitQuestion, addAnswer, upvoteAnswer,
  approveAnswer, markAccepted, removeRTQ, reportRTQ, convertToFAQ,
  updateRTQStatus, rejectAnswer, rejectQuestion, markRTQForReview,
  markAnswerForReview
} from '../controllers/rtq.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { requireNotRestricted } from '../middleware/qp.middleware.js';

const router = Router();

// FIX #2: All specific static paths must come before any /:id dynamic segments
router.get('/', authenticate, listRTQs);
router.post('/question', authenticate, authorizeRoles('student', 'moderator', 'senior'), requireNotRestricted, submitQuestion);
router.post('/answer/upvote/:answerId', authenticate, upvoteAnswer);
router.patch('/approve-answer/:answerId', authenticate, authorizeRoles('moderator', 'senior', 'admin'), approveAnswer);
router.patch('/mark-accepted/:id', authenticate, authorizeRoles('moderator', 'senior', 'admin'), markAccepted);
router.post('/convert/:id', authenticate, authorizeRoles('senior', 'admin'), convertToFAQ);
router.post('/report/:id', authenticate, reportRTQ);
router.patch('/status/:questionId', authenticate, updateRTQStatus);
router.patch('/reject-answer/:answerId', authenticate, authorizeRoles('moderator', 'senior', 'admin'), rejectAnswer);
router.patch('/reject-question/:id', authenticate, authorizeRoles('moderator', 'senior', 'admin'), rejectQuestion);
router.patch('/review-question/:id', authenticate, authorizeRoles('moderator', 'senior', 'admin'), markRTQForReview);
router.patch('/review-answer/:answerId', authenticate, authorizeRoles('moderator', 'senior', 'admin'), markAnswerForReview);

// Dynamic /:id routes last
router.get('/:id', authenticate, getRTQ);
router.post('/:id/answer', authenticate, requireNotRestricted, addAnswer);
router.delete('/:id', authenticate, authorizeRoles('senior', 'admin'), removeRTQ);

export default router;

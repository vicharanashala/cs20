import { Router } from 'express';
import { listCategoriesWithUpvotes, upvoteCategory } from '../controllers/categoryUpvote.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/ranked', authenticate, listCategoriesWithUpvotes);
router.post('/upvote/:categoryName', authenticate, upvoteCategory);

export default router;

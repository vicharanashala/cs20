import { Router } from 'express';
import { listNotifications, markNotificationRead, unreadCount, deleteNotificationCtrl } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', authenticate, listNotifications);
router.patch('/read/:id', authenticate, markNotificationRead);
router.delete('/:id', authenticate, deleteNotificationCtrl);
router.get('/unread-count', authenticate, unreadCount);

export default router;
import { Router } from 'express';
import {
  listUsers, getUser, updateProfile, changePassword,
  restrictUser, removeUser
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();
router.get('/', authenticate, listUsers);
// FIX #10: /leaderboard is handled globally in app.js via qp.controller — removed duplicate here
router.get('/:id', authenticate, getUser);
router.put('/profile', authenticate, updateProfile);
router.patch('/password', authenticate, changePassword);
router.patch('/restrict/:id', authenticate, authorizeRoles('senior', 'admin'), restrictUser);
router.delete('/:id', authenticate, authorizeRoles('admin'), removeUser);

export default router;

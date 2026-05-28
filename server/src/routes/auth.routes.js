import { Router } from 'express';
import { signup, verifyOtp, login, me, logout, requestReAccessUser } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/request-reaccess', requestReAccessUser);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

export default router;
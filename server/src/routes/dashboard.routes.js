import { Router } from 'express';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalUsers, unreadCount, leaderboard] = await Promise.all([
      User.countDocuments({ status: 'active' }),
      Notification.countDocuments({ userId: req.user._id, read: false }),
      User.find({ status: 'active' }).select('_id').sort({ qp: -1 }).lean(),
    ]);

    const rank = leaderboard.findIndex(u => u._id.toString() === req.user._id.toString()) + 1;

    res.json({ totalUsers, unreadCount, rank });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

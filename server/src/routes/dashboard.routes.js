import { Router } from 'express';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import RTQ from '../models/RTQ.model.js';
import FAQ from '../models/FAQ.model.js';
import QPTransaction from '../models/QPTransaction.model.js';
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

router.get('/activity', authenticate, async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentRTQs, recentFAQs, recentUsers, recentTransactions] = await Promise.all([
      RTQ.find({ createdAt: { $gte: since } })
        .populate('postedBy', 'name role')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      FAQ.find({ createdAt: { $gte: since } })
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      User.find({ createdAt: { $gte: since }, status: 'active' })
        .select('name role createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      QPTransaction.find({ createdAt: { $gte: since } })
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const activity = [
      ...recentRTQs.map(r => ({ type: 'rtq', id: r._id, question: r.question, user: r.postedBy, createdAt: r.createdAt })),
      ...recentFAQs.map(f => ({ type: 'faq', id: f._id, question: f.question, user: f.createdBy, createdAt: f.createdAt })),
      ...recentUsers.map(u => ({ type: 'user', id: u._id, name: u.name, role: u.role, createdAt: u.createdAt })),
      ...recentTransactions.map(t => ({ type: 'qp', amount: t.amount, type2: t.type, reason: t.reason, user: t.userId, createdAt: t.createdAt })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);

    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const [rtqByDay, faqByDay, userByDay] = await Promise.all([
      RTQ.aggregate([
        { $match: { createdAt: { $gte: new Date(now - 6 * 86400000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      FAQ.aggregate([
        { $match: { createdAt: { $gte: new Date(now - 6 * 86400000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(now - 6 * 86400000), status: 'active' } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
    ]);

    const toMap = (arr) => {
      const m = {};
      arr.forEach(({ _id, count }) => { m[_id] = count; });
      return m;
    };

    res.json({
      activity,
      trends: {
        rtq: days.map(d => ({ date: d, count: toMap(rtqByDay)[d] || 0 })),
        faq: days.map(d => ({ date: d, count: toMap(faqByDay)[d] || 0 })),
        users: days.map(d => ({ date: d, count: toMap(userByDay)[d] || 0 })),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

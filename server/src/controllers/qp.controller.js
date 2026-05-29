import { getQP, getQPHistory } from '../services/qp.service.js';
import User from '../models/User.model.js';
import QPTransaction from '../models/QPTransaction.model.js';

export async function getMyScore(req, res) {
  try {
    const qp = await getQP(req.user._id);
    res.json(qp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getHistory(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const [total, history] = await Promise.all([
      QPTransaction.countDocuments({ userId: req.user._id }),
      QPTransaction.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);
    res.json({ data: history, pagination: { page: pageNum, limit: limitNum, total } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getLeaderboard(req, res) {
  try {
    const users = await User.find({ status: 'active' })
      .select('name username role qp')
      .sort({ qp: -1 })
      .limit(50);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}
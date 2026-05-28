import User from '../models/User.model.js';
import QPTransaction from '../models/QPTransaction.model.js';
import { QP_THRESHOLDS } from '../../../shared/constants.js';
import { notifyUser } from './notification.service.js';

// FIX #4: Store positive amount in both earn and deduct transactions; type encodes direction
async function recordTransaction(userId, type, amount, reason, referenceId = null) {
  const positiveAmount = Math.abs(amount);
  const qpDelta = type === 'earn' ? positiveAmount : -positiveAmount;

  await QPTransaction.create({ userId, type, amount: positiveAmount, reason, referenceId });
  await User.findByIdAndUpdate(userId, { $inc: { qp: qpDelta } });

  const updated = await User.findById(userId);

  // FIX #13: Check auto-promotion after every QP award
  if (type === 'earn' && updated.role === 'student' && updated.qp >= QP_THRESHOLDS.AUTO_PROMOTE_MODERATOR) {
    await notifyUser(
      userId, 'student', 'promotion_eligible',
      `You have reached ${updated.qp} QP and are eligible for Moderator promotion!`,
      0, userId
    );
  }

  return updated.qp;
}

export async function awardQP(userId, amount, reason, referenceId = null) {
  return await recordTransaction(userId, 'earn', amount, reason, referenceId);
}

export async function deductQP(userId, amount, reason, referenceId = null) {
  return await recordTransaction(userId, 'deduct', amount, reason, referenceId);
}

export async function getQP(userId) {
  const user = await User.findById(userId);
  return user ? user.qp : 0;
}

export async function getQPHistory(userId) {
  return await QPTransaction.find({ userId }).sort({ createdAt: -1 }).limit(50);
}

export async function checkAutoPromotion(userId) {
  const user = await User.findById(userId);
  if (!user || user.role !== 'student') return null;
  if (user.qp >= QP_THRESHOLDS.AUTO_PROMOTE_MODERATOR) {
    return { eligible: true, currentQP: user.qp, threshold: QP_THRESHOLDS.AUTO_PROMOTE_MODERATOR };
  }
  return { eligible: false, currentQP: user.qp, threshold: QP_THRESHOLDS.AUTO_PROMOTE_MODERATOR };
}

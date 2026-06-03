import Notification from '../models/Notification.model.js';

export async function createNotification({ userId, role, type, message, qpImpact = 0, referenceId = null }) {
  return await Notification.create({ userId, role, type, message, qpImpact, referenceId });
}

export async function getNotifications(userId) {
  return await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
}

export async function markAsRead(notificationId, userId) {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
}

export async function deleteNotification(notificationId, userId) {
  return await Notification.findOneAndDelete({ _id: notificationId, userId });
}

export async function getUnreadCount(userId) {
  return await Notification.countDocuments({ userId, read: false });
}

export async function notifyUser(userId, role, type, message, qpImpact = 0, referenceId = null) {
  return await createNotification({ userId, role, type, message, qpImpact, referenceId });
}
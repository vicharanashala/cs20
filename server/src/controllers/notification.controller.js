import { getNotifications, markAsRead, deleteNotification, getUnreadCount } from '../services/notification.service.js';

export async function listNotifications(req, res) {
  try {
    const notifications = await getNotifications(req.user._id);
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const result = await markAsRead(req.params.id, req.user._id);
    if (!result) return res.status(404).json({ message: 'Notification not found' });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function unreadCount(req, res) {
  try {
    const count = await getUnreadCount(req.user._id);
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteNotificationCtrl(req, res) {
  try {
    const result = await deleteNotification(req.params.id, req.user._id);
    if (!result) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}
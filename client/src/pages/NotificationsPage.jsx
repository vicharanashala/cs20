// ✅ FIX #2: import useCallback
import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notification.service';
import { timeAgo } from '../utils/helpers';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIX #3: wrap load in useCallback to avoid stale closure in useEffect
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIX #3: add load to dependency array
  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.read).map(n => notificationService.markAsRead(n._id))
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    const icons = {
      question_accepted: '✓',
      question_rejected: '✗',
      answer_added: '💬',
      answer_approved: '✓',
      answer_removed: '✗',
      answer_selected_for_faq: '⭐',
      question_added_to_faq: '📌',
      question_removed: '🗑',
      new_answer: '💬',
      account_approved: '✅',
      role_changed: '🔄',
      promotion_eligible: '🎉',
    };
    return icons[type] || '🔔';
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Notifications</h1>
          {unread > 0 && <p className="text-sm text-muted">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-primary font-medium hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="card p-8 text-center text-muted">No notifications yet.</div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <div
              key={notif._id}
              className={`card p-4 flex gap-3 ${notif.read ? 'opacity-60' : 'border-l-4 border-l-primary'}`}
            >
              <span className="text-xl">{getIcon(notif.type)}</span>
              <div className="flex-1">
                <p className="text-sm text-primary">{notif.message}</p>
                {/* ✅ FIX #4: was (notif.qpImpact !== 0) which rendered when field
                    was undefined/null. Now guards against null/undefined first. */}
                {notif.qpImpact != null && notif.qpImpact !== 0 && (
                  <p className={`text-xs font-semibold mt-0.5 ${notif.qpImpact > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {notif.qpImpact > 0 ? '+' : ''}{notif.qpImpact} QP
                  </p>
                )}
                <p className="text-xs text-muted mt-1">{timeAgo(notif.createdAt)}</p>
              </div>
              {!notif.read && (
                <button
                  onClick={() => handleMarkRead(notif._id)}
                  className="text-xs text-muted hover:text-primary self-start"
                >
                  ✓
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notification.service';
import { timeAgo } from '../utils/helpers';
import { SkeletonRow } from '../components/SkeletonLoader';
import Breadcrumb from '../components/Breadcrumb';
import BackToTop from '../components/BackToTop';
import { Check } from 'lucide-react';

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
      <Breadcrumb items={[{ label: 'Notifications' }]} />
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
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-8 text-center text-muted">No notifications yet.</div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div
              key={notif._id}
              className={`card p-4 flex gap-4 items-center transition-all duration-200 hover:shadow-md ${
                notif.read 
                  ? 'bg-slate-50/50 opacity-70 border border-slate-100' 
                  : 'border-l-4 border-l-primary bg-white shadow-sm'
              }`}
            >
              {/* Premium Colorful Icon Wrapper */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-colors duration-200 ${
                notif.read 
                  ? 'bg-slate-100 text-slate-400' 
                  : notif.qpImpact > 0 
                  ? 'bg-green-50 text-green-600 border border-green-100' 
                  : notif.qpImpact < 0 
                  ? 'bg-red-50 text-red-600 border border-red-100' 
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              }`}>
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary font-medium leading-relaxed break-words">{notif.message}</p>
                {notif.qpImpact != null && notif.qpImpact !== 0 && (
                  <p className={`text-xs font-semibold mt-0.5 ${notif.qpImpact > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {notif.qpImpact > 0 ? '+' : ''}{notif.qpImpact} QP
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1 tracking-wider uppercase">{timeAgo(notif.createdAt)}</p>
              </div>

              {!notif.read && (
                <button
                  onClick={() => handleMarkRead(notif._id)}
                  className="p-2 rounded-full border border-slate-200 hover:border-primary hover:bg-slate-50 text-muted-foreground hover:text-primary transition-all duration-200 flex-shrink-0"
                  title="Mark as Read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <BackToTop />
    </div>
  );
}

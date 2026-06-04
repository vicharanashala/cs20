import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notification.service';
import { timeAgo } from '../utils/helpers';
import { SkeletonRow } from '../components/SkeletonLoader';
import Breadcrumb from '../components/Breadcrumb';
import BackToTop from '../components/BackToTop';
import {
  CheckCircle, XCircle, MessageCircle, Star, Pin,
  Trash2, Bell, UserCheck, RefreshCw, Trophy, Check,
  TrendingUp, TrendingDown
} from 'lucide-react';

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

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete all notifications? This cannot be undone.')) return;
    try {
      await Promise.all(notifications.map(n => notificationService.deleteNotification(n._id)));
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    const icons = {
      question_accepted: CheckCircle,
      question_rejected: XCircle,
      answer_added: MessageCircle,
      answer_approved: CheckCircle,
      answer_removed: Trash2,
      answer_selected_for_faq: Star,
      question_added_to_faq: Pin,
      question_removed: Trash2,
      new_answer: MessageCircle,
      account_approved: Check,
      role_changed: RefreshCw,
      promotion_eligible: Trophy,
      qp_earned: TrendingUp,
      qp_deducted: TrendingDown,
    };
    const Comp = icons[type] || Bell;
    return <Comp className="w-4 h-4 shrink-0" />;
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'Notifications' }]} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell className="w-6 h-6 text-accent" />
            Notifications
          </h1>
          {unread > 0 ? (
            <p className="page-subtitle">
              You have <span className="font-semibold text-accent">{unread}</span> unread notification{unread > 1 ? 's' : ''}
            </p>
          ) : (
            <p className="page-subtitle">You are all caught up!</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button onClick={handleMarkAllRead} className="btn-outline-sm flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={handleDeleteAll} className="btn-ghost-sm text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              Delete all
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center text-accent">
            <Bell className="w-6 h-6" />
          </div>
          <p className="font-medium text-primary">No notifications yet</p>
          <p className="text-xs text-muted max-w-xs">We'll let you know when someone upvotes your questions or answers are approved.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div
              key={notif._id}
              className={`card p-4 flex gap-4 items-center transition-all duration-200 hover:shadow-md ${
                notif.read 
                  ? 'bg-white/40 opacity-75 border border-border/40' 
                  : 'border-l-4 border-l-accent bg-white shadow-sm'
              }`}
            >
              {/* Premium Colorful Icon Wrapper */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-colors duration-200 ${
                notif.read 
                  ? 'bg-slate-100 text-slate-400' 
                  : notif.qpImpact > 0 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                  : notif.qpImpact < 0 
                  ? 'bg-red-50 text-red-600 border border-red-100' 
                  : 'bg-accent-50 text-accent-700 border border-accent-100'
              }`}>
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary font-medium leading-relaxed break-words">{notif.message}</p>
                {notif.qpImpact != null && notif.qpImpact !== 0 && (
                  <p className={`text-xs font-semibold mt-0.5 ${notif.qpImpact > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {notif.qpImpact > 0 ? '+' : ''}{notif.qpImpact} QP
                  </p>
                )}
                <p className="text-[10px] text-muted mt-1.5 tracking-wider uppercase font-medium">{timeAgo(notif.createdAt)}</p>
              </div>

              {!notif.read ? (
                <button
                  onClick={() => handleMarkRead(notif._id)}
                  className="p-2 rounded-xl border border-border/60 hover:border-accent hover:bg-accent-50/50 text-muted hover:text-accent transition-all duration-200 flex-shrink-0"
                  title="Mark as Read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => handleDelete(notif._id)}
                  className="p-2 rounded-xl border border-border/60 hover:border-red-300 hover:bg-red-50 text-muted hover:text-red-500 transition-all duration-200 flex-shrink-0"
                  title="Delete notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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

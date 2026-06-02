import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import notificationService from '../services/notification.service';
import { timeAgo } from '../utils/helpers';
import { Bell, LogOut } from 'lucide-react';

export default function Nav({ refreshUser }) {
  const { user, logout } = useAuth();
  const { qp } = useQP();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [qpAnimate, setQpAnimate] = useState(false);
  const prevQpRef = useRef(qp);
  const bellRef = useRef(null);

  useEffect(() => {
    if (prevQpRef.current !== qp && user) {
      setQpAnimate(true);
      prevQpRef.current = qp;
      const t = setTimeout(() => setQpAnimate(false), 800);
      return () => clearTimeout(t);
    }
  }, [qp, user]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const [count, notifs] = await Promise.all([
          notificationService.getUnreadCount(),
          notificationService.getNotifications().catch(() => ({ notifications: [] }))
        ]);
        setUnreadCount(count.count || 0);
        const all = notifs.notifications || notifs || [];
        setRecentNotifs(all.slice(0, 5));
      } catch {
        // silent
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (bellOpen) {
      notificationService.getNotifications()
        .then(data => {
          const all = data.notifications || data || [];
          setRecentNotifs(all.slice(0, 5));
        })
        .catch(() => {});
    }
  }, [bellOpen, unreadCount]);

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      const all = recentNotifs;
      await Promise.all(
        all.filter(n => !n.read).map(n => notificationService.markAsRead(n._id))
      );
      setUnreadCount(0);
      setRecentNotifs(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // silent
    }
    setBellOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/faq', label: 'FAQs' },
    { to: '/rtq', label: 'RTQ' },
    ...(user?.role === 'student' || user?.role === 'moderator'
      ? [{ to: '/raise-question', label: 'Ask' }]
      : []),
    ...(user?.role === 'senior' || user?.role === 'admin'
      ? [{ to: '/add-faq', label: 'Add FAQ' }, { to: '/history', label: 'History' }]
      : []),
    { to: '/users', label: 'Users' },
    { to: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-0.5">
          <Link
            to="/dashboard"
            className="brand-font text-primary mr-6 text-xl tracking-tight hover:opacity-70 transition-opacity font-bold"
          >
            PippaQ
          </Link>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive(link.to)
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted hover:text-primary hover:bg-slate-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(v => !v)}
              className="relative p-2 rounded-lg text-muted hover:text-primary hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="dropdown absolute right-0 top-full mt-2 w-80 animate-in z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-semibold text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {recentNotifs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted">No notifications yet</div>
                  ) : (
                    recentNotifs.map(notif => (
                      <div
                        key={notif._id}
                        className={`px-4 py-3 border-b border-border last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${
                          !notif.read ? 'bg-primary/[0.03]' : 'opacity-70'
                        }`}
                        onClick={() => { setBellOpen(false); navigate('/notifications'); }}
                      >
                        <p className="text-sm text-primary leading-snug">{notif.message}</p>
                        <p className="text-xs text-muted mt-0.5">{timeAgo(notif.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-border bg-slate-50/50">
                  <button
                    onClick={() => { setBellOpen(false); navigate('/notifications'); }}
                    className="text-xs text-primary hover:underline font-medium w-full text-center"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={`text-sm font-semibold px-2.5 py-1 rounded-lg transition-all duration-300 ${
            qpAnimate
              ? 'bg-emerald-100 text-emerald-700 scale-105'
              : 'text-primary bg-slate-100'
          }`}>
            {qp} QP
          </div>

          <div className="text-xs text-muted px-1">@{user?.username}</div>

          <button
            onClick={handleLogout}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
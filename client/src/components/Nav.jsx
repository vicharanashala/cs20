import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import notificationService from '../services/notification.service';
import { timeAgo } from '../utils/helpers';

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
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <Link to="/dashboard" className="brand-font text-primary mr-5 text-xl tracking-tight hover:opacity-80 transition-opacity">PippaQ</Link>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-primary hover:bg-surface'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(v => !v)}
              className="relative p-2 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors"
              title="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-xl overflow-hidden z-50">
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
                <div className="max-h-80 overflow-y-auto">
                  {recentNotifs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted">No notifications yet</div>
                  ) : (
                    recentNotifs.map(notif => (
                      <div
                        key={notif._id}
                        className={`px-4 py-3 border-b border-border last:border-0 hover:bg-surface cursor-pointer ${
                          !notif.read ? 'bg-primary/5' : 'opacity-70'
                        }`}
                        onClick={() => navigate('/notifications')}
                      >
                        <p className="text-sm text-primary leading-snug">{notif.message}</p>
                        <p className="text-xs text-muted mt-0.5">{timeAgo(notif.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-border bg-surface">
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

          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md transition-all duration-300 ${
              qpAnimate ? 'bg-green-100 text-green-700 scale-110' : 'text-muted'
            }`}
          >
            {qp} QP
          </span>
          <span className="text-xs text-muted">@{user?.username}</span>
          <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1.5">Logout</button>
        </div>
      </div>
    </nav>
  );
}

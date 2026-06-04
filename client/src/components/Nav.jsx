import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import notificationService from '../services/notification.service';
import { timeAgo } from '../utils/helpers';
import { Bell, LogOut, Menu, X, Zap } from 'lucide-react';
import Avatar from './Avatar';

export default function Nav({ refreshUser }) {
  const { user, logout } = useAuth();
  const { qp } = useQP();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [qpAnimate, setQpAnimate] = useState(false);
  const prevQpRef = useRef(qp);
  const bellRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

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
      ? [{ to: '/track', label: 'Track' }, { to: '/raise-question', label: 'Ask' }]
      : []),
    ...(user?.role === 'senior' || user?.role === 'admin'
      ? [{ to: '/add-faq', label: 'Add FAQ' }, { to: '/history', label: 'History' }]
      : []),
    { to: '/users', label: 'Users' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Left: Brand + Desktop Links */}
        <div className="flex items-center gap-1">
          <Link
            to="/about"
            className="flex items-center gap-2 mr-5 hover:opacity-80 transition-opacity"
          >
            <img src="/PippaQ1.webp" alt="PippaQ Logo" className="w-7 h-7 object-contain" />
            <span className="font-brand text-gradient text-xl tracking-tight font-bold">
              PippaQ
            </span>
          </Link>
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive(link.to)
                    ? 'text-accent-600 bg-accent-50/70 font-semibold'
                    : 'text-muted hover:text-primary hover:bg-slate-50'
                }`}
              >
                {link.label}
                {isActive(link.to) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gradient-to-r from-accent to-violet-500" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Notification Bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(v => !v)}
              className="relative p-2 rounded-xl text-muted hover:text-primary hover:bg-slate-100 transition-all duration-150"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center leading-none shadow-sm min-w-[18px] h-[18px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="dropdown absolute right-0 top-full mt-2 w-80 animate-slideDown z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                  <span className="text-sm font-semibold text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-accent hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {recentNotifs.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted">No notifications yet</div>
                  ) : (
                    recentNotifs.map(notif => (
                      <div
                        key={notif._id}
                        className={`px-4 py-3 border-b border-border/30 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${
                          !notif.read ? 'bg-accent-50/30' : 'opacity-60'
                        }`}
                        onClick={() => { setBellOpen(false); navigate('/notifications'); }}
                      >
                        <div className="flex items-start gap-2">
                          {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-primary leading-snug">{notif.message}</p>
                            <p className="text-xs text-muted mt-0.5">{timeAgo(notif.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-border/50 bg-slate-50/30">
                  <button
                    onClick={() => { setBellOpen(false); navigate('/notifications'); }}
                    className="text-xs text-accent hover:underline font-semibold w-full text-center"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* QP Badge */}
          <button
            onClick={() => navigate('/qp-history')}
            className={`hidden sm:flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg transition-all duration-300 hover:opacity-80 cursor-pointer ${
              qpAnimate
                ? 'qp-glow bg-accent-100 text-accent-700'
                : 'bg-gradient-to-r from-accent-50 to-violet-50 text-accent-700 border border-accent-200/50'
            }`}
            title="View QP History"
          >
            <Zap className="w-3.5 h-3.5 fill-accent-500 text-accent-500" />
            {qp} QP
          </button>

          {/* User info */}
          <Link to="/profile" className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors">
            <Avatar name={user?.name} role={user?.role} size="xs" />
            <span className="text-xs text-muted font-medium">@{user?.username}</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex btn-ghost text-xs px-2.5 py-1.5 items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-muted hover:text-primary hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-white/95 backdrop-blur-xl animate-slideDown">
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive(link.to)
                    ? 'text-accent-600 bg-accent-50/70 font-semibold'
                    : 'text-muted hover:text-primary hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="divider my-2" />
            <div className="flex items-center justify-between px-3 py-2">
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-all duration-150">
                <Avatar name={user?.name} role={user?.role} size="sm" />
                <div>
                  <p className="text-sm font-medium text-primary leading-tight">{user?.name}</p>
                  <p className="text-xs text-muted">@{user?.username}</p>
                </div>
              </Link>
              <button
                onClick={() => navigate('/qp-history')}
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r from-accent-50 to-violet-50 text-accent-700 border border-accent-200/50 hover:opacity-85 transition-all duration-150"
              >
                <Zap className="w-3.5 h-3.5 fill-accent-500 text-accent-500" />
                {qp} QP
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
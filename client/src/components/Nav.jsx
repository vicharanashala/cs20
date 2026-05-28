import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';

// FIX #16: New persistent navigation bar
export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    { to: '/notifications', label: 'Notifications' },
    { to: '/users', label: 'Users' },
    { to: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <Link to="/dashboard" className="font-bold text-primary mr-4 text-sm">Q&A</Link>
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
          <span className="text-xs text-muted">{user?.qp || 0} QP</span>
          <span className="text-xs text-muted">@{user?.username}</span>
          <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1.5">Logout</button>
        </div>
      </div>
    </nav>
  );
}

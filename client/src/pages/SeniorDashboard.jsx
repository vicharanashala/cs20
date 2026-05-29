import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import QPBadge from '../components/QPBadge';
import userService from '../services/user.service';
import adminService from '../services/admin.service';
import notificationService from '../services/notification.service';
import { SkeletonCard } from '../components/SkeletonLoader';

export default function SeniorDashboard() {
  const { user } = useAuth();
  const { refreshQP } = useQP();
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats] = useState({ rank: '-', totalUsers: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pending, leaderboard, notifs] = await Promise.all([
          adminService.getPendingUsers(),
          userService.getLeaderboard(),
          notificationService.getUnreadCount()
        ]);
        const rank = leaderboard.findIndex(u => u._id === user._id) + 1;
        setPendingUsers(pending);
        setStats({ rank, totalUsers: leaderboard.length });
        setUnreadCount(notifs.count || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApprove = async (userId) => {
    const prev = pendingUsers;
    setPendingUsers(prev => prev.filter(u => u._id !== userId));
    try {
      await adminService.approveUser(userId);
      refreshQP?.();
    } catch (err) {
      setPendingUsers(prev);
      alert(err.message);
    }
  };

  const handleReject = async (userId) => {
    const prev = pendingUsers;
    setPendingUsers(prev => prev.filter(u => u._id !== userId));
    try {
      await adminService.rejectUser(userId);
      refreshQP?.();
    } catch (err) {
      setPendingUsers(prev);
      alert(err.message);
    }
  };

  const quickLinks = [
    { to: '/faq', label: 'Manage FAQs', desc: 'Add, edit or remove FAQs', color: 'bg-blue-50 border-blue-200' },
    { to: '/users', label: 'User Management', desc: 'View and manage users', color: 'bg-purple-50 border-purple-200' },
    { to: '/history', label: 'Working History', desc: 'View all RTQ activities', color: 'bg-green-50 border-green-200' },
    { to: '/notifications', label: 'Notifications', desc: `${unreadCount} unread`, color: 'bg-yellow-50 border-yellow-200' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
              <div className="h-4 w-64 bg-slate-100 animate-pulse rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white animate-pulse rounded-lg" />)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white animate-pulse rounded-lg" />)}
          </div>
        </div>
      ) : (
      <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Senior Dashboard</h1>
          <p className="text-muted mt-1">Manage content and approve user activities</p>
        </div>
        <div className="text-right">
          <QPBadge qp={user?.qp || 0} />
          <p className="text-xs text-muted mt-1">Rank #{stats.rank}</p>
        </div>
      </div>

      {/* Pending approvals */}
      {pendingUsers.length > 0 && (
        <div className="card p-5 mb-6 border-2 border-yellow-200 bg-yellow-50">
          <h2 className="font-semibold text-primary mb-4">⏳ Pending User Approvals ({pendingUsers.length})</h2>
          <div className="space-y-3">
            {pendingUsers.map(u => (
              <div key={u._id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-primary">{u.name}</p>
                  <p className="text-sm text-muted">@{u.username} • {u.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(u._id)} className="btn-primary text-sm px-3 py-1.5">Approve</button>
                  <button onClick={() => handleReject(u._id)} className="btn-secondary text-sm px-3 py-1.5">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickLinks.map(link => (
          <Link key={link.to} to={link.to} className={`card p-5 border-2 hover:border-primary transition-colors ${link.color}`}>
            <div className="font-semibold text-primary">{link.label}</div>
            <div className="text-sm text-muted mt-1">{link.desc}</div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-primary">{pendingUsers.length}</div>
          <div className="text-xs text-muted mt-1">Pending Approvals</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
          <div className="text-xs text-muted mt-1">Total Users</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-primary">{unreadCount}</div>
          <div className="text-xs text-muted mt-1">Unread Notifications</div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
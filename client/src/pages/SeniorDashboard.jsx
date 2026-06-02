import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import QPBadge from '../components/QPBadge';
import MiniChart from '../components/MiniChart';
import userService from '../services/user.service';
import adminService from '../services/admin.service';
import notificationService from '../services/notification.service';
import dashboardService from '../services/dashboard.service';
import { SkeletonCard } from '../components/SkeletonLoader';
import { timeAgo } from '../utils/helpers';

export default function SeniorDashboard() {
  const { user } = useAuth();
  const { refreshQP } = useQP();
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats] = useState({ rank: '-', totalUsers: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [activity, setActivity] = useState([]);
  const [trends, setTrends] = useState({ rtq: [], faq: [], users: [] });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pending, leaderboard, notifs, actData] = await Promise.all([
          adminService.getPendingUsers(),
          userService.getLeaderboard(),
          notificationService.getUnreadCount(),
          dashboardService.getActivity().catch(() => ({ activity: [], trends: { rtq: [], faq: [], users: [] } })),
        ]);
        const rank = leaderboard.findIndex(u => u._id === user._id) + 1;
        setPendingUsers(pending);
        setStats({ rank, totalUsers: leaderboard.length });
        setUnreadCount(notifs.count || 0);
        setActivity(actData.activity || []);
        setTrends(actData.trends || { rtq: [], faq: [], users: [] });
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
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white animate-pulse rounded-lg" />)}
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
      <div className="grid grid-cols-3 gap-4 mb-8">
        {quickLinks.map(link => (
          <Link key={link.to} to={link.to} className={`card p-5 border-2 hover:border-primary transition-colors ${link.color}`}>
            <div className="font-semibold text-primary">{link.label}</div>
            <div className="text-sm text-muted mt-1">{link.desc}</div>
          </Link>
        ))}
      </div>

      {/* Stats with trend charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

      {/* 7-day trend sparklines */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted">RTQs (7d)</span>
            <span className="text-xs text-muted">{trends.rtq.reduce((s, d) => s + d.count, 0)} total</span>
          </div>
          <MiniChart data={trends.rtq} color="#6366f1" height={36} />
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted">FAQs (7d)</span>
            <span className="text-xs text-muted">{trends.faq.reduce((s, d) => s + d.count, 0)} total</span>
          </div>
          <MiniChart data={trends.faq} color="#10b981" height={36} />
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted">New Users (7d)</span>
            <span className="text-xs text-muted">{trends.users.reduce((s, d) => s + d.count, 0)} total</span>
          </div>
          <MiniChart data={trends.users} color="#f59e0b" height={36} />
        </div>
      </div>

      {/* Activity feed */}
      <div className="card p-5">
        <h2 className="font-semibold text-primary mb-4">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activity.map((item, i) => {
              const icon = item.type === 'rtq' ? '❓' : item.type === 'faq' ? '💡' : item.type === 'user' ? '👤' : '💰';
              const label = item.type === 'rtq'
                ? `New RTQ: "${item.question?.slice(0, 50)}"`
                : item.type === 'faq'
                ? `New FAQ: "${item.question?.slice(0, 50)}"`
                : item.type === 'user'
                ? `New user: ${item.name}`
                : `QP ${item.type2 === 'earn' ? '+' : '-'}${item.amount}: ${item.reason?.slice(0, 40)}`;
              return (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0 text-sm">
                  <span className="shrink-0 mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-primary truncate">{label}</p>
                    <p className="text-xs text-muted">{timeAgo(item.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      </>
      )}
    </div>
  );
}
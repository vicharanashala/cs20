import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import QPBadge from '../components/QPBadge';
import MiniChart from '../components/MiniChart';
import { RoleBadge } from '../components/Badge';
import userService from '../services/user.service';
import adminService from '../services/admin.service';
import notificationService from '../services/notification.service';
import dashboardService from '../services/dashboard.service';
import { MessageCircle, BookOpen, Users, TrendingUp, Clock } from 'lucide-react';
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
    { to: '/faq', label: 'Manage FAQs', desc: 'Add, edit or remove FAQs', color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50', icon: BookOpen },
    { to: '/users', label: 'User Management', desc: 'View and manage users', color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50', icon: Users },
    { to: '/history', label: 'Working History', desc: 'View all RTQ activities', color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50', icon: TrendingUp },
  ];

  return (
    <div className="page-container">
      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-lg" />
              <div className="h-4 w-48 bg-slate-100 animate-pulse rounded" />
            </div>
            <div className="h-12 w-32 bg-slate-200 animate-pulse rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white animate-pulse rounded-xl" />)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white animate-pulse rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="page-title">{user?.role === 'admin' ? 'Admin Dashboard' : 'Senior Dashboard'}</h1>
                <p className="page-subtitle">Here's your overview of platform activity</p>
              </div>
              <RoleBadge role={user?.role} />
            </div>
            <div className="text-right">
              <QPBadge qp={user?.qp || 0} />
              <p className="text-xs text-muted mt-1">Rank #{stats.rank} of {stats.totalUsers}</p>
            </div>
          </div>

          {pendingUsers.length > 0 && (
            <div className="card-padded mb-6 border-2 border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-amber-600" />
                <h2 className="section-title">Pending User Approvals ({pendingUsers.length})</h2>
              </div>
              <div className="space-y-3">
                {pendingUsers.map(u => (
                  <div key={u._id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-border">
                    <div>
                      <p className="font-medium text-primary">{u.name}</p>
                      <p className="text-sm text-muted">@{u.username} &middot; {u.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(u._id)} className="btn-success-sm">Approve</button>
                      <button onClick={() => handleReject(u._id)} className="btn-outline-sm">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {quickLinks.map(link => {
              const Icon = link.icon;
              return (
                <Link key={link.to} to={link.to} className={`quick-card border-2 ${link.color}`}>
                  <Icon className="w-5 h-5 text-primary/60" />
                  <div className="font-semibold text-primary">{link.label}</div>
                  <div className="text-sm text-muted">{link.desc}</div>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Pending Approvals', value: pendingUsers.length },
              { label: 'Total Users', value: stats.totalUsers },
              { label: 'Unread Notifications', value: unreadCount },
            ].map(({ label, value }) => (
              <div key={label} className="card-padded text-center">
                <div className="text-3xl font-bold text-primary">{value}</div>
                <div className="text-xs text-muted mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'RTQs (7d)', data: trends.rtq, color: '#6366f1', total: trends.rtq.reduce((s, d) => s + d.count, 0) },
              { label: 'FAQs (7d)', data: trends.faq, color: '#10b981', total: trends.faq.reduce((s, d) => s + d.count, 0) },
              { label: 'New Users (7d)', data: trends.users, color: '#f59e0b', total: trends.users.reduce((s, d) => s + d.count, 0) },
            ].map(({ label, data, color, total }) => (
              <div key={label} className="card-padded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted">{label}</span>
                  <span className="text-xs text-muted">{total} total</span>
                </div>
                <MiniChart data={data} color={color} height={36} />
              </div>
            ))}
          </div>

          <div className="card-padded">
            <h2 className="section-title mb-4">Recent Activity</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {activity.map((item, i) => {
                  const IconComp = item.type === 'rtq' ? MessageCircle : item.type === 'faq' ? BookOpen : item.type === 'user' ? Users : TrendingUp;
                  const label = item.type === 'rtq'
                    ? `New RTQ: "${item.question?.slice(0, 50)}"`
                    : item.type === 'faq'
                    ? `New FAQ: "${item.question?.slice(0, 50)}"`
                    : item.type === 'user'
                    ? `New user: ${item.name}`
                    : `QP ${item.type2 === 'earn' ? '+' : '-'}${item.amount}: ${item.reason?.slice(0, 40)}`;
                  return (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0 text-sm">
                      <IconComp className="w-4 h-4 text-muted mt-0.5 shrink-0" />
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
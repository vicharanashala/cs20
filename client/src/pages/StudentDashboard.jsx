import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QPBadge from '../components/QPBadge';
import MiniChart from '../components/MiniChart';
import { RoleBadge } from '../components/Badge';
import dashboardService from '../services/dashboard.service';
import faqService from '../services/faq.service';
import rtqService from '../services/rtq.service';
import { SkeletonCard } from '../components/SkeletonLoader';
import { timeAgo } from '../utils/helpers';
import { MessageCircle, BookOpen, TrendingUp, Users, Activity } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ rank: '-', totalUsers: 0, unreadCount: 0 });
  const [recentFAQs, setRecentFAQs] = useState([]);
  const [recentRTQs, setRecentRTQs] = useState([]);
  const [trends, setTrends] = useState({ rtq: [], faq: [], users: [] });
  const [activity, setActivity] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, faqs, rtqs, actData] = await Promise.all([
        dashboardService.getStats(),
        faqService.list({ sort: 'upvotes' }),
        rtqService.list({ filter: 'unresolved' }),
        dashboardService.getActivity().catch(() => ({ activity: [], trends: { rtq: [], faq: [], users: [] } })),
      ]);
      setStats({ rank: statsData.rank || '-', totalUsers: statsData.totalUsers || 0, unreadCount: statsData.unreadCount || 0 });
      setRecentFAQs(faqs.faqs?.slice(0, 5) || []);
      setRecentRTQs((rtqs.data || rtqs).slice(0, 5) || []);
      setTrends(actData.trends || { rtq: [], faq: [], users: [] });
      setActivity(actData.activity?.slice(0, 10) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const quickLinks = [
    { to: '/faq', label: 'Browse FAQs', desc: 'Search the knowledge base', color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50', icon: BookOpen },
    { to: '/rtq', label: 'RTQ Board', desc: 'Clarify doubts with the community', color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50', icon: MessageCircle },
    { to: '/raise-question', label: 'Ask a Question', desc: 'Submit a question for review', color: 'border-orange-200 bg-orange-50/50 hover:bg-orange-50', icon: TrendingUp },
    { to: '/track', label: 'Track Questions', desc: 'Monitor your raised questions', color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50', icon: Activity },
    { to: '/profile', label: 'My Profile', desc: 'View QP history and stats', color: 'border-slate-200 bg-slate-50/50 hover:bg-slate-50', icon: Users },
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
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white animate-pulse rounded-xl" />)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-white animate-pulse rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
                <p className="page-subtitle">Here's what's happening on the platform</p>
              </div>
              <RoleBadge role={user?.role} />
            </div>
            <div className="text-right">
              <QPBadge qp={user?.qp || 0} />
              <p className="text-xs text-muted mt-1">Rank #{stats.rank} of {stats.totalUsers}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card-padded text-center">
              <div className="text-3xl font-bold text-primary">{user?.qp || 0}</div>
              <div className="text-xs text-muted mt-1">Quality Points</div>
            </div>
            <div className="card-padded text-center">
              <div className="text-3xl font-bold text-primary">{recentRTQs.length}</div>
              <div className="text-xs text-muted mt-1">Open Questions</div>
            </div>
            <div className="card-padded text-center">
              <div className="text-3xl font-bold text-primary">{stats.unreadCount}</div>
              <div className="text-xs text-muted mt-1">Unread Notifications</div>
            </div>
          </div>

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
              { label: 'RTQs (7d)', data: trends.rtq, color: '#6366f1', total: trends.rtq.reduce((s, d) => s + d.count, 0) },
              { label: 'FAQs (7d)', data: trends.faq, color: '#10b981', total: trends.faq.reduce((s, d) => s + d.count, 0) },
              { label: 'New Users (7d)', data: trends.users, color: '#f59e0b', total: trends.users.reduce((s, d) => s + d.count, 0) },
            ].map(({ label, data, color, total }) => (
              <div key={label} className="card-padded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted">{label}</span>
                  <span className="text-xs text-muted">{total} total</span>
                </div>
                <MiniChart data={data} color={color} height={32} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[
              { title: 'Trending FAQs', items: recentFAQs, empty: 'No FAQs yet', link: '/faq', render: faq => (
                <div key={faq._id} className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary truncate flex-1 pr-2">{faq.question}</p>
                  <span className="text-xs text-muted shrink-0">{faq.upvotes} ↑</span>
                </div>
              )},
              { title: 'Open Questions', items: recentRTQs, empty: 'No open questions', link: '/rtq', render: rtq => (
                <div key={rtq._id} className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary truncate flex-1 pr-2">{rtq.question}</p>
                  <span className="text-xs text-muted shrink-0">{rtq.answers?.length || 0} ans</span>
                </div>
              )},
            ].map(({ title, items, empty, link, render }) => (
              <div key={title}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="section-title">{title}</h2>
                  <Link to={link} className="text-xs text-primary font-medium hover:underline">View all</Link>
                </div>
                <div className="card-padded divide-y divide-border">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted text-center py-4">{empty}</p>
                  ) : items.map(render)}
                </div>
              </div>
            ))}
          </div>

          {activity.length > 0 && (
            <div className="card-padded">
              <h2 className="section-title mb-4">Platform Activity</h2>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {activity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 text-sm">
                    <Activity className="w-3.5 h-3.5 text-muted mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-primary truncate">
                        {item.type === 'rtq' ? `New RTQ: "${item.question?.slice(0, 50)}"`
                          : item.type === 'faq' ? `New FAQ: "${item.question?.slice(0, 50)}"`
                          : item.type === 'user' ? `New user joined`
                          : `QP ${item.type2 === 'earn' ? '+' : '-'}${item.amount}: ${item.reason?.slice(0, 40)}`}
                      </p>
                      <p className="text-xs text-muted">{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
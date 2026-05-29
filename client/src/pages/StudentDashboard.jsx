import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QPBadge from '../components/QPBadge';
import dashboardService from '../services/dashboard.service';
import faqService from '../services/faq.service';
import rtqService from '../services/rtq.service';
import { SkeletonCard } from '../components/SkeletonLoader';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ rank: '-', totalUsers: 0, unreadCount: 0 });
  const [recentFAQs, setRecentFAQs] = useState([]);
  const [recentRTQs, setRecentRTQs] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, faqs, rtqs] = await Promise.all([
        dashboardService.getStats(),
        faqService.list({ sort: 'upvotes' }),
        rtqService.list({ filter: 'unresolved' }),
      ]);
      setStats({ rank: statsData.rank || '-', totalUsers: statsData.totalUsers || 0, unreadCount: statsData.unreadCount || 0 });
      setRecentFAQs(faqs.faqs?.slice(0, 5) || []);
      setRecentRTQs((rtqs.data || rtqs).slice(0, 5) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const quickLinks = [
    { to: '/faq', label: 'Browse FAQs', desc: 'Search the knowledge base', color: 'bg-blue-50 border-blue-200' },
    { to: '/rtq', label: 'RTQ Board', desc: 'Clarify doubts with the community', color: 'bg-purple-50 border-purple-200' },
    { to: '/raise-question', label: 'Ask a Question', desc: 'Submit a question for review', color: 'bg-orange-50 border-orange-200' },
    { to: '/track', label: 'Track Questions', desc: 'Monitor your raised questions', color: 'bg-green-50 border-green-200' },
    { to: '/notifications', label: 'Notifications', desc: `${stats.unreadCount} unread`, color: 'bg-yellow-50 border-yellow-200' },
    { to: '/profile', label: 'My Profile', desc: 'View QP history and stats', color: 'bg-slate-50 border-slate-200' },
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
            <div className="space-y-2 text-right">
              <div className="h-6 w-20 bg-slate-200 animate-pulse rounded ml-auto" />
              <div className="h-3 w-16 bg-slate-100 animate-pulse rounded ml-auto" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white animate-pulse rounded-lg" />)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-white animate-pulse rounded-lg" />)}
          </div>
        </div>
      ) : (
      <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted mt-1">Here's what's happening on the platform</p>
        </div>
        <div className="text-right">
          <QPBadge qp={user?.qp || 0} />
          <p className="text-xs text-muted mt-1">
            Rank #{stats.rank} of {stats.totalUsers}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-primary">{user?.qp || 0}</div>
          <div className="text-xs text-muted mt-1">Quality Points</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-primary">{recentRTQs.length}</div>
          <div className="text-xs text-muted mt-1">Open Questions</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.unreadCount}</div>
          <div className="text-xs text-muted mt-1">Unread Notifications</div>
        </div>
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {quickLinks.map(link => (
          <Link key={link.to} to={link.to} className={`card p-5 border-2 hover:border-primary transition-colors ${link.color}`}>
            <div className="font-semibold text-primary">{link.label}</div>
            <div className="text-sm text-muted mt-1">{link.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-primary">Trending FAQs</h2>
            <Link to="/faq" className="text-xs text-primary font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentFAQs.map(faq => (
              <div key={faq._id} className="card p-3">
                <p className="text-sm font-medium text-primary truncate">{faq.question}</p>
                <p className="text-xs text-muted mt-1">{faq.upvotes} upvotes • {faq.category}</p>
              </div>
            ))}
            {recentFAQs.length === 0 && <p className="text-sm text-muted text-center py-4">No FAQs yet</p>}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-primary">Open Questions</h2>
            <Link to="/rtq" className="text-xs text-primary font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentRTQs.map(rtq => (
              <div key={rtq._id} className="card p-3">
                <p className="text-sm font-medium text-primary truncate">{rtq.question}</p>
                <p className="text-xs text-muted mt-1">{rtq.answers?.length || 0} answers • {rtq.category}</p>
              </div>
            ))}
            {recentRTQs.length === 0 && <p className="text-sm text-muted text-center py-4">No open questions</p>}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

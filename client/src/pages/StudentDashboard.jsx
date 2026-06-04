import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QPBadge from '../components/QPBadge';
import MiniChart from '../components/MiniChart';
import Avatar from '../components/Avatar';
import { RoleBadge } from '../components/Badge';
import dashboardService from '../services/dashboard.service';
import faqService from '../services/faq.service';
import rtqService from '../services/rtq.service';
import { SkeletonCard, SkeletonStat } from '../components/SkeletonLoader';
import { timeAgo } from '../utils/helpers';
import { MessageCircle, BookOpen, TrendingUp, Users, Activity, Zap, AlertTriangle } from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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
    { to: '/faq', label: 'Browse FAQs', desc: 'Search the knowledge base', color: 'border-accent-200 bg-accent-50/30 hover:bg-accent-50/60', iconBg: 'bg-accent-100', iconColor: 'text-accent-600', icon: BookOpen },
    { to: '/rtq', label: 'RTQ Board', desc: 'Clarify doubts with the community', color: 'border-violet-200 bg-violet-50/30 hover:bg-violet-50/60', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', icon: MessageCircle },
    { to: '/raise-question', label: 'Ask a Question', desc: 'Submit a question for review', color: 'border-orange-200 bg-orange-50/30 hover:bg-orange-50/60', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', icon: TrendingUp },
    { to: '/track', label: 'Track Questions', desc: 'Monitor your raised questions', color: 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', icon: Activity },
    { to: '/profile', label: 'My Profile', desc: 'View QP history and stats', color: 'border-slate-200 bg-slate-50/30 hover:bg-slate-50/60', iconBg: 'bg-slate-100', iconColor: 'text-slate-600', icon: Users },
  ];

  const activityColors = { rtq: 'border-l-accent-400', faq: 'border-l-emerald-400', user: 'border-l-amber-400', qp: 'border-l-violet-400' };

  return (
    <div className="page-container">
      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="h-8 w-64 skeleton-shimmer rounded-lg" />
              <div className="h-4 w-48 skeleton-shimmer rounded" />
            </div>
            <div className="h-12 w-32 skeleton-shimmer rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1,2].map(i => <SkeletonStat key={i} />)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Avatar name={user?.name} role={user?.role} size="lg" gradient />
              <div>
                <h1 className="page-title flex items-center gap-2">
                  {getGreeting()}, {user?.name?.split(' ')[0]}
                  <span className="inline-block animate-wave-hand origin-[70%_70%]">👋</span>
                </h1>
                <p className="page-subtitle flex items-center gap-2">
                  Here's what's happening on the platform
                  <RoleBadge role={user?.role} />
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <QPBadge qp={user?.qp || 0} size="lg" />
              <p className="text-xs text-muted mt-1.5 font-medium">Rank #{stats.rank} of {stats.totalUsers}</p>
            </div>
          </div>

          {/* Restricted Banner */}
          {user?.restrictedAt && (
            <div className="card p-4 mb-6 border-l-4 border-l-amber-400 bg-amber-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">Account Restricted</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Your QP is below 50. You cannot ask questions until it reaches 50.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-bold text-amber-700">{user?.qp || 0}/50</span>
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="stat-card border-l-accent-400">
              <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-accent fill-accent" />
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{user?.qp || 0}</div>
                <div className="text-xs text-muted font-medium">Quality Points</div>
              </div>
            </div>
            <div className="stat-card border-l-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="text-3xl font-bold text-primary">{recentRTQs.length}</div>
                <div className="text-xs text-muted font-medium">Open Questions</div>
              </div>
              {stats.unreadCount > 0 && (
                <div className="flex items-center gap-1.5 self-start">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs text-amber-600 font-semibold">{stats.unreadCount} unread</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {quickLinks.map(link => {
              const Icon = link.icon;
              return (
                <Link key={link.to} to={link.to} className={`quick-card border-2 ${link.color} group`}>
                  <div className={`w-9 h-9 rounded-xl ${link.iconBg} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className={`w-4.5 h-4.5 ${link.iconColor}`} />
                  </div>
                  <div className="font-semibold text-primary text-sm">{link.label}</div>
                  <div className="text-xs text-muted">{link.desc}</div>
                </Link>
              );
            })}
          </div>

          {/* Trending FAQs & Open Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="card shadow-md overflow-hidden bg-white/70 backdrop-blur-lg border border-white/40">
              {/* Widget Header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-accent-50 flex items-center justify-center shadow-sm">
                    <BookOpen className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-primary">Trending FAQs</h2>
                    <p className="text-[10px] text-muted">Most upvoted questions</p>
                  </div>
                  {recentFAQs.length > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-accent-100 text-accent-600 rounded-full font-bold ml-1">{recentFAQs.length}</span>
                  )}
                </div>
                <Link to="/faq" className="text-xs text-accent font-semibold hover:underline flex items-center gap-1">
                  View all →
                </Link>
              </div>

              {/* Widget Content */}
              <div className="p-5 pt-2">
                {recentFAQs.length === 0 ? (
                  <p className="text-sm text-muted text-center py-6">No trending FAQs yet</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentFAQs.map((faq, i) => (
                      <Link 
                        key={faq._id} 
                        to={`/faq?q=${encodeURIComponent(faq.question)}`}
                        className="group flex items-center justify-between py-3.5 hover:bg-slate-50/50 px-3 -mx-3 rounded-xl transition-all duration-200"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Rank Circle */}
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                            i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' : 
                            i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' : 
                            i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' : 
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {i + 1}
                          </span>
                          
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-accent transition-colors line-clamp-1">
                              {faq.question}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {faq.category && (
                                <span className="text-[10px] px-2 py-0.5 bg-accent-50 text-accent-700 rounded-md font-medium uppercase tracking-wider">
                                  {faq.category}
                                </span>
                              )}
                              {faq.isTrending && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 bg-orange-50 text-orange-700 rounded-md font-medium">
                                  🔥 HOT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-4">
                          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100 shadow-sm">
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            <span>{faq.upvotes}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card shadow-md overflow-hidden bg-white/70 backdrop-blur-lg border border-white/40">
              {/* Widget Header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shadow-sm">
                    <MessageCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-primary">Open Questions</h2>
                    <p className="text-[10px] text-muted">Awaiting resolution</p>
                  </div>
                  {recentRTQs.length > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold ml-1">{recentRTQs.length}</span>
                  )}
                </div>
                <Link to="/rtq" className="text-xs text-accent font-semibold hover:underline flex items-center gap-1">
                  View all →
                </Link>
              </div>

              {/* Widget Content */}
              <div className="p-5 pt-2">
                {recentRTQs.length === 0 ? (
                  <p className="text-sm text-muted text-center py-6">No open questions</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentRTQs.map(rtq => (
                      <Link 
                        key={rtq._id} 
                        to={`/rtq/${rtq._id}`}
                        className="group flex items-center justify-between py-3.5 hover:bg-slate-50/50 px-3 -mx-3 rounded-xl transition-all duration-200"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Status Indicator */}
                          <div className="relative shrink-0 flex items-center justify-center w-4 h-4">
                            <div className={`w-2.5 h-2.5 rounded-full ${
                              rtq.status === 'resolved' ? 'bg-emerald-500' : 
                              rtq.status === 'partially_resolved' ? 'bg-amber-500' : 
                              'bg-rose-500'
                            }`} />
                            <div className={`absolute w-4 h-4 rounded-full border ${
                              rtq.status === 'resolved' ? 'border-emerald-300 animate-ping' : 
                              rtq.status === 'partially_resolved' ? 'border-amber-300 animate-ping' : 
                              'border-rose-300 animate-ping'
                            }`} style={{ animationDuration: '3s' }} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-accent transition-colors line-clamp-1">
                              {rtq.question}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {rtq.category && (
                                <span className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-700 rounded-md font-medium uppercase tracking-wider">
                                  {rtq.category}
                                </span>
                              )}
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                                rtq.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                                rtq.status === 'partially_resolved' ? 'bg-amber-50 text-amber-700' :
                                'bg-rose-50 text-rose-700'
                              }`}>
                                {rtq.status === 'resolved' ? 'Resolved' : rtq.status === 'partially_resolved' ? 'Partial' : 'Open'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-4">
                          <div className="flex items-center gap-1.5 bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full text-xs font-bold border border-violet-100 shadow-sm">
                            <MessageCircle className="w-3 h-3 text-violet-600" />
                            <span>{rtq.answers?.length || 0}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trend Charts */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'RTQs (7d)', data: trends.rtq, color: '#4f46e5', total: trends.rtq.reduce((s, d) => s + d.count, 0) },
              { label: 'FAQs (7d)', data: trends.faq, color: '#10b981', total: trends.faq.reduce((s, d) => s + d.count, 0) },
              { label: 'New Users (7d)', data: trends.users, color: '#f59e0b', total: trends.users.reduce((s, d) => s + d.count, 0) },
            ].map(({ label, data, color, total }) => (
              <div key={label} className="card-padded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted">{label}</span>
                  <span className="text-xs text-muted font-medium">{total} total</span>
                </div>
                <MiniChart data={data} color={color} height={32} />
              </div>
            ))}
          </div>

          {/* Activity Feed */}
          {activity.length > 0 && (
            <div className="card-padded">
              <h2 className="section-title mb-4 gradient-underline">Platform Activity</h2>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {activity.map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 py-2.5 text-sm border-l-2 pl-3 rounded-r-lg hover:bg-slate-50/50 transition-colors ${activityColors[item.type] || 'border-l-slate-300'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-primary truncate">
                        {item.type === 'rtq' ? `New RTQ: "${item.question?.slice(0, 50)}"`
                          : item.type === 'faq' ? `New FAQ: "${item.question?.slice(0, 50)}"`
                          : item.type === 'user' ? `New user joined`
                          : `QP ${item.type2 === 'earn' ? '+' : '-'}${item.amount}: ${item.reason?.slice(0, 40)}`}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{timeAgo(item.createdAt)}</p>
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
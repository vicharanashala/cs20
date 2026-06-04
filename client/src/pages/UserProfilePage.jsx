import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import userService from '../services/user.service';
import qpService from '../services/qp.service';
import { useAuth } from '../context/AuthContext';
import QPBadge from '../components/QPBadge';
import Avatar from '../components/Avatar';
import { RoleBadge } from '../components/Badge';
import Breadcrumb from '../components/Breadcrumb';
import { timeAgo } from '../utils/helpers';
import { ROLE_LABELS } from '../utils/constants';
import { Spinner } from '../components/SkeletonLoader';
import { Mail, Shield, Calendar, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

export default function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = currentUser?._id === id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      userService.get(id),
      qpService.getHistory(),
    ]).then(([profileData, historyData]) => {
      setProfile(profileData);
      if (isOwnProfile) {
        const items = Array.isArray(historyData) ? historyData : (historyData.data || []);
        setHistory(items);
      }
    }).catch(() => {
      navigate('/users');
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'Users', to: '/users' }, { label: profile.name }]} />

      {/* Main Profile Info Card */}
      <div className="card shadow-md overflow-hidden bg-white/80 backdrop-blur-lg border border-white/40 mb-6">
        {/* Decorative Top Accent Banner */}
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
        </div>

        {/* Header Block with Avatar overlapping top banner */}
        <div className="px-6 pb-6 relative pt-16">
          {/* Avatar absolutely positioned to overlap the border line of the banner */}
          <div className="absolute top-0 left-6 -translate-y-1/2 p-1 bg-white rounded-full shadow-md z-10 shrink-0">
            <Avatar name={profile.name} role={profile.role} size="xl" gradient />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 flex-wrap">
                {profile.name}
                <RoleBadge role={profile.role} />
              </h2>
              <p className="text-sm text-muted font-medium">@{profile.username}</p>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider self-start sm:self-auto border ${
              profile.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              profile.status === 'blocked' ? 'bg-rose-50 text-rose-700 border-rose-100' :
              'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {profile.status}
            </span>
          </div>

          <div className="divider mb-6" />

          {/* User Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-slate-800">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Role & Permissions</p>
                  <p className="font-semibold text-slate-800 uppercase text-xs tracking-wider">{ROLE_LABELS[profile.role] || profile.role}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Joined</p>
                  <p className="font-semibold text-slate-800">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} ({timeAgo(profile.createdAt)})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Contributions</p>
                  <p className="font-semibold text-slate-800">
                    {profile.questionsRaised || 0} Questions Asked &middot; {profile.questionsAnswered || 0} Answered
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Own QP History */}
      {isOwnProfile && (
        <div className="card shadow-md overflow-hidden bg-white/80 backdrop-blur-lg border border-white/40">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
            <h2 className="text-sm font-bold text-primary">QP Ledger</h2>
            <p className="text-[10px] text-muted">Your Quality Points transactions</p>
          </div>
          
          {history.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No QP transactions yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {history.map(tx => (
                <div key={tx._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === 'earn' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {tx.type === 'earn' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{tx.reason}</p>
                      <p className="text-[10px] text-muted mt-0.5">{timeAgo(tx.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                    tx.type === 'earn' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

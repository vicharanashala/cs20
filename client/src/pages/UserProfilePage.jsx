import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import userService from '../services/user.service';
import qpService from '../services/qp.service';
import { useAuth } from '../context/AuthContext';
import QPBadge from '../components/QPBadge';
import { timeAgo } from '../utils/helpers';
import { ROLE_LABELS } from '../utils/constants';
import { SkeletonRow } from '../components/SkeletonLoader';
import { Spinner } from '../components/SkeletonLoader';

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
        setHistory(Array.isArray(historyData) ? historyData : []);
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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <button onClick={() => navigate('/users')} className="hover:text-primary">Users</button>
        <span>›</span>
        <span className="text-primary">{profile.name}</span>
      </div>

      {/* Profile Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-1">{profile.name}</h1>
            <p className="text-sm text-muted">@{profile.username}</p>
            <p className="text-sm text-muted">{profile.email}</p>
          </div>
          <div className="text-right">
            <QPBadge qp={profile.qp || 0} />
            <p className="text-xs text-muted mt-1">{ROLE_LABELS[profile.role] || profile.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted">Status: </span>
            <span className={
              profile.status === 'active' ? 'text-green-600' :
              profile.status === 'blocked' ? 'text-red-600' :
              'text-yellow-600'
            }>
              {profile.status}
            </span>
          </div>
          <div>
            <span className="text-muted">Joined: </span>
            <span>{timeAgo(profile.createdAt)}</span>
          </div>
          {profile.questionsRaised > 0 && (
            <div>
              <span className="text-muted">Asked: </span>
              <span>{profile.questionsRaised}</span>
            </div>
          )}
          {profile.questionsAnswered > 0 && (
            <div>
              <span className="text-muted">Answered: </span>
              <span>{profile.questionsAnswered}</span>
            </div>
          )}
        </div>
      </div>

      {/* Own QP History */}
      {isOwnProfile && (
        <div className="card p-6">
          <h3 className="font-semibold text-primary mb-4">QP History</h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No QP transactions yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.map(tx => (
                <div key={tx._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm text-primary">{tx.reason}</p>
                    <p className="text-xs text-muted">{timeAgo(tx.createdAt)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
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

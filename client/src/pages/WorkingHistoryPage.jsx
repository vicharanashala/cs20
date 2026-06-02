import { useState, useEffect, useCallback } from 'react';
import rtqService from '../services/rtq.service';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import { timeAgo } from '../utils/helpers';
import { SkeletonCard } from '../components/SkeletonLoader';
import Breadcrumb from '../components/Breadcrumb';
import BackToTop from '../components/BackToTop';

export default function WorkingHistoryPage() {
  const { user } = useAuth();
  const { refreshQP } = useQP();
  const [rtqs, setRtqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIX #10: wrap load in useCallback
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rtqService.list({ sort: 'createdAt' });
      setRtqs(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIX #10: add load to dependency array
  useEffect(() => { load(); }, [load]);

  const handleRemove = async (id) => {
    if (!confirm('Remove this RTQ? This cannot be undone.')) return;
    const prev = rtqs;
    setRtqs(prev => prev.filter(r => r._id !== id));
    try {
      await rtqService.remove(id);
    } catch (err) {
      setRtqs(prev);
      alert(err.message);
    }
  };

  const handleConvertToFAQ = async (id) => {
    const prev = rtqs;
    setRtqs(prev => prev.map(r => r._id === id ? { ...r, _converting: true } : r));
    try {
      await rtqService.convertToFAQ(id);
      setRtqs(prev => prev.map(r => r._id === id ? { ...r, _converting: false, isAccepted: true } : r));
      refreshQP?.();
    } catch (err) {
      setRtqs(prev);
      alert(err.message);
    }
  };

  const handleMarkAccepted = async (id) => {
    const prev = rtqs;
    setRtqs(prev => prev.map(r => r._id === id ? { ...r, isAccepted: true, status: 'resolved' } : r));
    try {
      await rtqService.markAccepted(id);
      refreshQP?.();
    } catch (err) {
      setRtqs(prev);
      alert(err.message);
    }
  };

  const isSeniorOrAdmin = user?.role === 'senior' || user?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'History' }]} />
      <h1 className="text-2xl font-bold text-primary mb-6">Working History</h1>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="space-y-4">
          {rtqs.map(rtq => (
            <div key={rtq._id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-primary">{rtq.question}</h3>
                    {rtq.isAccepted && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✓ Moderator Accepted</span>
                    )}
                    {rtq.status === 'rejected' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">✗ Moderator Rejected</span>
                    )}
                    {rtq.markedForReview && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">⚠️ Marked for Review</span>
                    )}
                    {rtq._converting && (
                      <span className="text-xs text-blue-500">Converting...</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{rtq.category}</span>
                    <span>•</span>
                    <span>By {rtq.postedBy?.name}</span>
                    <span>•</span>
                    <span>{rtq.answers?.length || 0} answers</span>
                    <span>•</span>
                    <span>{timeAgo(rtq.createdAt)}</span>
                    {rtq.approvedAnswer && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">Has approved answer</span>
                      </>
                    )}
                  </div>
                </div>

                {isSeniorOrAdmin && (
                  <div className="flex gap-2 ml-4">
                    {!rtq.isAccepted && (
                      <button
                        onClick={() => handleMarkAccepted(rtq._id)}
                        className="text-xs px-3 py-1.5 border border-green-200 rounded text-green-700 hover:bg-green-50"
                      >
                        Accept
                      </button>
                    )}
                    <button
                      onClick={() => handleConvertToFAQ(rtq._id)}
                      className="text-xs px-3 py-1.5 border border-blue-200 rounded text-blue-700 hover:bg-blue-50"
                    >
                      → FAQ
                    </button>
                    <button
                      onClick={() => handleRemove(rtq._id)}
                      className="text-xs px-3 py-1.5 border border-red-200 rounded text-red-500 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {rtqs.length === 0 && (
            <div className="text-center py-12 text-muted">No RTQ history found.</div>
          )}
        </div>
      )}
      <BackToTop />
    </div>
  );
}

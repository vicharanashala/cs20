import { useState, useEffect, useCallback } from 'react';
import questionService from '../services/question.service';
import rtqService from '../services/rtq.service';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/helpers';
import Breadcrumb from '../components/Breadcrumb';
import { StatusBadge } from '../components/Badge';

export default function TrackQuestionPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [rtqs, setRtqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIX #8: wrap load in useCallback
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [q, r] = await Promise.all([
        questionService.getUserQuestions(user._id),
        rtqService.list()
      ]);
      const rawRtqs = Array.isArray(r) ? r : (r.data || []);
      const myRtqs = rawRtqs.filter(rtq => (rtq.postedBy?._id || rtq.postedBy)?.toString() === user._id.toString());
      setQuestions(Array.isArray(q) ? q : []);
      setRtqs(myRtqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  // ✅ FIX #8: add load to dependency array
  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async (questionId, status) => {
    const prev = questions;
    setQuestions(prev => prev.map(q => q._id === questionId ? { ...q, status } : q));
    try {
      await questionService.updateStatus(questionId, { status });
    } catch (err) {
      setQuestions(prev);
      alert(err.message);
    }
  };

  const handleRTQStatusUpdate = async (rtqId, status) => {
    const prev = rtqs;
    setRtqs(prev => prev.map(r => r._id === rtqId ? { ...r, status } : r));
    try {
      await rtqService.updateStatus(rtqId, status);
    } catch (err) {
      setRtqs(prev);
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'Track Questions' }]} />
      <h1 className="text-2xl font-bold text-primary mb-6">Track My Questions</h1>

      {loading ? (
        <div className="text-center py-12 text-muted">Loading...</div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="font-semibold text-primary mb-3">RTQ Submissions</h2>
            {rtqs.length === 0 ? (
              <div className="card p-6 text-center text-muted">No questions submitted yet.</div>
            ) : (
              <div className="space-y-3">
                {rtqs.map(rtq => (
                  <div key={rtq._id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-primary">{rtq.question}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted">{rtq.category}</span>
                          <span className="text-xs text-muted">{timeAgo(rtq.createdAt)}</span>
                          <span className="text-xs text-muted">• {rtq.answers?.length || 0} answers</span>
                          <select
                            value={rtq.status || 'unresolved'}
                            onChange={e => handleRTQStatusUpdate(rtq._id, e.target.value)}
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md border shadow-sm cursor-pointer focus:outline-none focus:ring-2 ${
                              rtq.status === 'resolved'
                                ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-400'
                                : rtq.status === 'partially_resolved'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-400'
                                : 'bg-red-50 text-red-700 border-red-200 focus:ring-red-400'
                            }`}
                          >
                            <option value="unresolved">Unresolved</option>
                            <option value="partially_resolved">Partially Resolved</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </div>
                        {rtq.isAccepted && (
                          <StatusBadge status="resolved" />
                        )}
                        {rtq.status === 'rejected' && (
                          <StatusBadge status="rejected" />
                        )}
                        {rtq.markedForReview && (
                          <StatusBadge status="markedForReview" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-primary mb-3">Direct Questions</h2>
            {questions.length === 0 ? (
              <div className="card p-6 text-center text-muted">No direct questions tracked.</div>
            ) : (
              <div className="space-y-3">
                {questions.map(q => (
                  <div key={q._id} className="card p-4">
                    <p className="font-medium text-primary">{q.question}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted">{q.category}</span>
                      <span className="text-xs text-muted">{timeAgo(q.createdAt)}</span>
                      <select
                        value={q.status}
                        onChange={e => handleStatusUpdate(q._id, e.target.value)}
                        className="input py-1 text-xs w-auto"
                      >
                        <option value="unresolved">Unresolved</option>
                        <option value="partial">Partial</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

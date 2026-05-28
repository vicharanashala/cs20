import { useState, useEffect } from 'react';
import questionService from '../services/question.service';
import rtqService from '../services/rtq.service';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/helpers';

export default function TrackQuestionPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [rtqs, setRtqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [q, r] = await Promise.all([
        questionService.getUserQuestions(user._id),
        rtqService.list()
      ]);
      const myRtqs = Array.isArray(r) ? r.filter(rtq => rtq.postedBy?._id === user._id || rtq.postedBy === user._id) : (r.data || []);
      setQuestions(Array.isArray(q) ? q : []);
      setRtqs(myRtqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (questionId, status) => {
    try {
      await questionService.updateStatus(questionId, { status });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
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
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                          <span className={`px-2 py-0.5 rounded-full ${rtq.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {rtq.status}
                          </span>
                          <span>{rtq.category}</span>
                          <span>•</span>
                          <span>{rtq.answers?.length || 0} answers</span>
                          <span>•</span>
                          <span>{timeAgo(rtq.createdAt)}</span>
                        </div>
                        {rtq.isAccepted && (
                          <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            ✓ Accepted
                          </span>
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
                      {/* FIX #9: status options aligned to model enum: unresolved | partial | resolved */}
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

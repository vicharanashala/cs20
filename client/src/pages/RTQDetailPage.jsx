import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import rtqService from '../services/rtq.service';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import { timeAgo } from '../utils/helpers';
import UpvoteButton from '../components/UpvoteButton';
import { Spinner } from '../components/SkeletonLoader';

export default function RTQDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { refreshQP } = useQP();
  const navigate = useNavigate();
  const [rtq, setRtq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerForms, setAnswerForms] = useState({});
  const [answerLoading, setAnswerLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await rtqService.get(id);
      setRtq(data);
    } catch {
      navigate('/rtq');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSubmitAnswer = async () => {
    const text = answerForms[id];
    if (!text?.trim()) return;
    setAnswerLoading(true);
    const optimisticAnswer = {
      _id: `temp-${Date.now()}`,
      answer: text,
      userId: { name: user.name },
      upvotes: 0,
      upvotedBy: [],
      createdAt: new Date().toISOString(),
    };
    setRtq(prev => ({ ...prev, answers: [...(prev.answers || []), optimisticAnswer] }));
    const savedText = text;
    setAnswerForms(prev => ({ ...prev, [id]: '' }));
    try {
      await rtqService.addAnswer(id, { answer: text });
      refreshQP?.();
    } catch (err) {
      setRtq(prev => ({ ...prev, answers: prev.answers.filter(a => a._id !== optimisticAnswer._id) }));
      setAnswerForms(prev => ({ ...prev, [id]: savedText }));
      alert(err.message || 'Failed to submit answer');
    } finally {
      setAnswerLoading(false);
    }
  };

  const handleUpvoteAnswer = async (answerId) => {
    if (answerId.startsWith('temp-')) return;
    const ans = rtq?.answers?.find(a => a._id === answerId);
    if (!ans) return;
    const hasUpvoted = ans.upvotedBy?.some(uid => (uid?._id || uid)?.toString() === user?._id?.toString());
    setRtq(prev => ({
      ...prev,
      answers: prev.answers.map(a => {
        if (a._id !== answerId) return a;
        return {
          ...a,
          upvotes: hasUpvoted ? a.upvotes - 1 : a.upvotes + 1,
          upvotedBy: hasUpvoted
            ? a.upvotedBy.filter(uid => (uid?._id || uid)?.toString() !== user?._id?.toString())
            : [...(a.upvotedBy || []), user?._id]
        };
      })
    }));
    try {
      await rtqService.upvoteAnswer(answerId);
      refreshQP?.();
    } catch {
      load();
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!rtq) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link to="/rtq" className="hover:text-primary">RTQ</Link>
        <span>›</span>
        <span className="text-primary truncate">{rtq.question}</span>
      </div>

      {/* RTQ Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary mb-2">{rtq.question}</h1>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span>{rtq.category}</span>
              <span>•</span>
              <span>By {rtq.postedBy?.name}</span>
              <span>•</span>
              <span>{timeAgo(rtq.createdAt)}</span>
              {rtq.isAccepted && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Resolved</span>
                </>
              )}
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            rtq.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
          }`}>
            {rtq.status}
          </span>
        </div>

        {rtq.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {rtq.tags.map(tag => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {rtq.description && (
          <p className="text-sm text-muted mb-4">{rtq.description}</p>
        )}
      </div>

      {/* Answers */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">
          {rtq.answers?.length || 0} Answer{(rtq.answers?.length || 0) !== 1 ? 's' : ''}
        </h2>

        <div className="space-y-4">
          {rtq.answers?.map(ans => (
            <div key={ans._id} className="card p-5">
              <p className="text-sm text-primary mb-3 leading-relaxed">{ans.answer}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UpvoteButton
                    upvotes={ans.upvotes}
                    onUpvote={() => handleUpvoteAnswer(ans._id)}
                    hasUpvoted={ans.upvotedBy?.some(uid => (uid?._id || uid)?.toString() === user?._id?.toString())}
                  />
                  <span className="text-xs text-muted">
                    {ans.userId?.name || 'Unknown'}
                    {ans.userId?.role && (
                      <span className={`ml-1 text-xs px-1.5 py-0.5 rounded ${
                        ans.userId.role === 'senior' ? 'bg-blue-100 text-blue-700' :
                        ans.userId.role === 'moderator' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {ans.userId.role}
                      </span>
                    )}
                  </span>
                </div>
                {ans.isApproved && (
                  <span className="text-xs text-green-600 font-medium">✓ Approved</span>
                )}
                <span className="text-xs text-muted">{timeAgo(ans.createdAt)}</span>
              </div>
            </div>
          ))}
          {(!rtq.answers || rtq.answers.length === 0) && (
            <div className="text-center py-8 text-muted text-sm">No answers yet. Be the first to answer!</div>
          )}
        </div>
      </div>

      {/* Answer Form */}
      {user && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-primary mb-3">Your Answer</h3>
          <textarea
            value={answerForms[id] || ''}
            onChange={e => setAnswerForms(prev => ({ ...prev, [id]: e.target.value }))}
            placeholder="Write a clear, helpful answer..."
            className="input resize-none mb-3"
            rows={4}
          />
          <button
            onClick={handleSubmitAnswer}
            disabled={answerLoading || !answerForms[id]?.trim()}
            className="btn-primary"
          >
            {answerLoading ? <Spinner size="sm" /> : 'Submit Answer'}
          </button>
        </div>
      )}
    </div>
  );
}
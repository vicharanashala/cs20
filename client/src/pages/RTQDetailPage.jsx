import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import rtqService from '../services/rtq.service';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import { timeAgo } from '../utils/helpers';
import UpvoteButton from '../components/UpvoteButton';
import { Spinner } from '../components/SkeletonLoader';
import { Settings, Check, X, Flag } from 'lucide-react';

export default function RTQDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { refreshQP } = useQP();
  const navigate = useNavigate();
  const [rtq, setRtq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerForms, setAnswerForms] = useState({});
  const [answerLoading, setAnswerLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);

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

  const handleStatusChange = async (newStatus) => {
    try {
      await rtqService.updateStatus(id, newStatus);
      setRtq(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const isModeratorOrAbove = user && ['moderator', 'senior', 'admin'].includes(user.role);
  const isSeniorOrAdmin = user && ['senior', 'admin'].includes(user.role);

  const handleAcceptQuestion = async () => {
    try {
      await rtqService.markAccepted(id);
      load();
    } catch (err) {
      alert(err.message || 'Failed to accept question');
    }
  };

  const handleRejectQuestion = async () => {
    if (!confirm('Are you sure you want to reject this question? A second rejection will permanently remove it.')) return;
    try {
      const res = await rtqService.rejectQuestion(id);
      if (res.deleted) {
        navigate('/rtq');
      } else {
        load();
      }
    } catch (err) {
      alert(err.message || 'Failed to reject question');
    }
  };

  const handleReviewQuestion = async () => {
    try {
      await rtqService.reviewQuestion(id);
      load();
    } catch (err) {
      alert(err.message || 'Failed to mark question for review');
    }
  };

  const handleApproveAnswer = async (answerId) => {
    try {
      await rtqService.approveAnswer(answerId);
      load();
    } catch (err) {
      alert(err.message || 'Failed to approve answer');
    }
  };

  const handleRejectAnswer = async (answerId) => {
    try {
      await rtqService.rejectAnswer(answerId);
      load();
    } catch (err) {
      alert(err.message || 'Failed to reject answer');
    }
  };

  const handleReviewAnswer = async (answerId) => {
    try {
      await rtqService.reviewAnswer(answerId);
      load();
    } catch (err) {
      alert(err.message || 'Failed to flag answer for review');
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

  const isOwner = user && (rtq.postedBy?._id || rtq.postedBy)?.toString() === user._id.toString();

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
            <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
              <span>{rtq.category}</span>
              <span>•</span>
              <span>By {rtq.postedBy?.name}</span>
              <span>•</span>
              <span>{timeAgo(rtq.createdAt)}</span>
              {rtq.isAccepted && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    ✓ Moderator Accepted
                  </span>
                </>
              )}
              {rtq.status === 'rejected' && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                    ✗ Moderator Rejected
                  </span>
                </>
              )}
              {rtq.markedForReview && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                    ⚠️ Marked for Review
                  </span>
                </>
              )}
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
            rtq.status === 'resolved'
              ? 'bg-green-50 text-green-700 border-green-200'
              : rtq.status === 'partially_resolved'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {rtq.status === 'resolved' ? 'Resolved' : rtq.status === 'partially_resolved' ? 'Partially Resolved' : 'Unresolved'}
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

        {isModeratorOrAbove && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between flex-wrap gap-2">
            <button
              onClick={() => setSelectedQuestion(!selectedQuestion)}
              className={`p-1.5 rounded hover:bg-slate-100 transition-colors duration-200 flex items-center justify-center ${
                selectedQuestion ? 'text-primary bg-slate-100' : 'text-muted'
              }`}
              title={selectedQuestion ? 'Cancel Question Moderation' : 'Moderate Question'}
            >
              <Settings className="w-4 h-4" />
            </button>

            {selectedQuestion && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg w-fit mt-2">
                {!rtq.isAccepted && rtq.status !== 'rejected' && (
                  <button
                    onClick={handleAcceptQuestion}
                    className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    title="Accept Question"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {rtq.status !== 'rejected' && (
                  <button
                    onClick={handleRejectQuestion}
                    className="p-1.5 border border-red-200 text-red-500 rounded hover:bg-red-50 transition-colors"
                    title={`Reject Question (${rtq.rejectedBy?.length || 0})`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {rtq.status === 'rejected' && (
                  <span className="text-xs px-2 py-1 bg-red-50 border border-red-200 text-red-700 rounded font-semibold whitespace-nowrap">
                    ✗ Rejected
                  </span>
                )}
                {!rtq.markedForReview && (
                  <button
                    onClick={handleReviewQuestion}
                    className="p-1.5 border border-amber-200 text-amber-600 rounded hover:bg-amber-50 transition-colors"
                    title="Flag for Review"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
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
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
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

                <div className="flex items-center gap-2 flex-wrap">
                  {(ans.approvals?.length > 0 || ans.isApproved) && (
                    <span className="text-xs px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded font-semibold whitespace-nowrap">
                      ✓ Moderator Approved ({ans.approvals?.length || 1})
                    </span>
                  )}
                  {ans.rejections?.length > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded font-semibold whitespace-nowrap">
                      ✗ Moderator Rejected ({ans.rejections?.length})
                    </span>
                  )}
                  {ans.markedForReview && (
                    <span className="text-xs px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded font-semibold whitespace-nowrap">
                      ⚠️ Marked for Review
                    </span>
                  )}

                  {isModeratorOrAbove && (
                    <button
                      onClick={() => setSelectedAnswerId(selectedAnswerId === ans._id ? null : ans._id)}
                      className={`p-1 rounded hover:bg-slate-100 transition-colors duration-200 ml-2 inline-flex items-center justify-center align-middle ${
                        selectedAnswerId === ans._id ? 'text-primary bg-slate-100' : 'text-muted'
                      }`}
                      title={selectedAnswerId === ans._id ? 'Cancel Moderation' : 'Moderate Answer'}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-xs text-muted">{timeAgo(ans.createdAt)}</span>
              </div>

              {isModeratorOrAbove && selectedAnswerId === ans._id && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border w-fit">
                  <button
                    onClick={() => handleApproveAnswer(ans._id)}
                    disabled={ans.approvals?.some(uid => (uid?._id || uid)?.toString() === user?._id?.toString())}
                    className={`p-1.5 rounded border transition-colors ${
                      ans.approvals?.some(uid => (uid?._id || uid)?.toString() === user?._id?.toString())
                        ? 'bg-green-50 text-green-700 border-green-200 cursor-not-allowed'
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                    title={`Approve (${ans.approvals?.length || (ans.isApproved ? 1 : 0)})`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRejectAnswer(ans._id)}
                    disabled={ans.rejections?.some(uid => (uid?._id || uid)?.toString() === user?._id?.toString())}
                    className={`p-1.5 rounded border transition-colors ${
                      ans.rejections?.some(uid => (uid?._id || uid)?.toString() === user?._id?.toString())
                        ? 'bg-red-50 text-red-700 border-red-200 cursor-not-allowed'
                        : 'border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                    title={`Reject (${ans.rejections?.length || 0})`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {!ans.markedForReview && (
                    <button
                      onClick={() => handleReviewAnswer(ans._id)}
                      className="p-1.5 rounded border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Flag for Review"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
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
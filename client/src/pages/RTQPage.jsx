import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import rtqService from '../services/rtq.service';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import { timeAgo } from '../utils/helpers';
import { SkeletonCard } from '../components/SkeletonLoader';
import { Spinner } from '../components/SkeletonLoader';
import BackToTop from '../components/BackToTop';
import { FAQ_CATEGORIES } from '../utils/constants';
import { Settings, Check, X, Flag, Trash2, BookOpen } from 'lucide-react';

const LIMIT = 20;

export default function RTQPage() {
  const [rtqs, setRtqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [answerForms, setAnswerForms] = useState({});
  const [answerLoading, setAnswerLoading] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [submittingFaq, setSubmittingFaq] = useState(false);
  const [faqModalData, setFaqModalData] = useState({
    rtqId: '',
    answerId: '',
    answer: '',
    category: '',
    tags: ''
  });
  const { user } = useAuth();
  const { refreshQP } = useQP();

  const loadRTQs = async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await rtqService.list({ sort: 'upvotes', filter, page: pageNum, limit: LIMIT, category: categoryFilter });
      const items = Array.isArray(data) ? data : (data.data || []);
      setRtqs(items);
      if (data.pagination) {
        setTotal(data.pagination.total);
      }
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); loadRTQs(1); }, [filter, categoryFilter]);

  useEffect(() => { loadRTQs(page); }, [page]);

  const handleSubmitAnswer = async (rtqId) => {
    const answerText = answerForms[rtqId];
    if (!answerText?.trim()) return;
    setAnswerLoading(prev => ({ ...prev, [rtqId]: true }));
    const optimisticAnswer = {
      _id: `temp-${Date.now()}`,
      answer: answerText,
      userId: { name: user.name },
      upvotes: 0,
      upvotedBy: [],
      createdAt: new Date().toISOString(),
    };
    setRtqs(prev => prev.map(r =>
      r._id === rtqId ? { ...r, answers: [...(r.answers || []), optimisticAnswer] } : r
    ));
    setAnswerForms(prev => ({ ...prev, [rtqId]: '' }));
    try {
      await rtqService.addAnswer(rtqId, { answer: answerText });
      refreshQP?.();
    } catch (err) {
      setRtqs(prev => prev.map(r =>
        r._id === rtqId ? { ...r, answers: r.answers.filter(a => a._id !== optimisticAnswer._id) } : r
      ));
      setAnswerForms(prev => ({ ...prev, [rtqId]: answerText }));
      alert(err.message || 'Failed to submit answer');
    } finally {
      setAnswerLoading(prev => ({ ...prev, [rtqId]: false }));
    }
  };

  const handleUpvoteAnswer = async (rtqId, answerId) => {
    if (answerId.startsWith('temp-')) return;
    const rtq = rtqs.find(r => r._id === rtqId);
    const ans = rtq?.answers?.find(a => a._id === answerId);
    if (!rtq || !ans) return;
    const hasUpvoted = ans.upvotedBy?.some(id => id === user?._id || id._id === user?._id);
    setRtqs(prev => prev.map(r => {
      if (r._id !== rtqId) return r;
      return {
        ...r,
        answers: r.answers.map(a => {
          if (a._id !== answerId) return a;
          return {
            ...a,
            upvotes: hasUpvoted ? a.upvotes - 1 : a.upvotes + 1,
            upvotedBy: hasUpvoted
              ? a.upvotedBy.filter(id => id !== user?._id && id._id !== user?._id)
              : [...(a.upvotedBy || []), user?._id],
          };
        }),
      };
    }));
    try {
      await rtqService.upvoteAnswer(answerId);
      refreshQP?.();
    } catch (err) {
      loadRTQs(page);
    }
  };

  const isModeratorOrAbove = user && ['moderator', 'senior', 'admin'].includes(user.role);
  const isSeniorOrAdmin = user && ['senior', 'admin'].includes(user.role);

  const handleAcceptQuestion = async (rtqId) => {
    try {
      await rtqService.markAccepted(rtqId);
      loadRTQs(page);
    } catch (err) {
      alert(err.message || 'Failed to accept question');
    }
  };

  const handleRejectQuestion = async (rtqId) => {
    if (!confirm('Are you sure you want to reject this question? A second rejection will permanently remove it.')) return;
    try {
      const res = await rtqService.rejectQuestion(rtqId);
      loadRTQs(page);
    } catch (err) {
      alert(err.message || 'Failed to reject question');
    }
  };

  const handleReviewQuestion = async (rtqId) => {
    try {
      await rtqService.reviewQuestion(rtqId);
      loadRTQs(page);
    } catch (err) {
      alert(err.message || 'Failed to mark question for review');
    }
  };

  const handleRemoveQuestion = async (rtqId) => {
    if (!confirm('Are you sure you want to permanently delete/remove this question? This will penalize the author -5 QP.')) return;
    try {
      await rtqService.remove(rtqId);
      loadRTQs(page);
      refreshQP?.();
    } catch (err) {
      alert(err.message || 'Failed to remove question');
    }
  };

  const handleInitiateFAQ = (rtq) => {
    const answers = [...(rtq.answers || [])].sort((a, b) => b.upvotes - a.upvotes);
    let selectedAns = null;

    // 1. Senior's own answer (written by the converting Senior/Admin)
    selectedAns = answers.find(ans => 
      (ans.userId?._id || ans.userId)?.toString() === user?._id?.toString()
    );

    // 2. Senior-approved answer (approved by any senior or admin)
    if (!selectedAns) {
      selectedAns = answers.find(ans => 
        ans.approvals?.some(u => u.role === 'senior' || u.role === 'admin')
      );
    }

    // 3. Moderator-approved answer (approved by any moderator)
    if (!selectedAns) {
      selectedAns = answers.find(ans => 
        ans.approvals?.some(u => u.role === 'moderator')
      );
    }

    // 4. Otherwise → most upvoted answer
    if (!selectedAns && answers.length > 0) {
      selectedAns = answers[0];
    }

    setFaqModalData({
      rtqId: rtq._id,
      answerId: selectedAns ? selectedAns._id : '',
      answer: selectedAns ? selectedAns.answer : '',
      category: rtq.category || '',
      tags: rtq.tags ? rtq.tags.join(', ') : ''
    });
    setShowFaqModal(true);
  };

  const handleConfirmFaq = async () => {
    if (!faqModalData.answer?.trim() || !faqModalData.category) return;
    setSubmittingFaq(true);
    try {
      await rtqService.convertToFAQ(faqModalData.rtqId, {
        answerId: faqModalData.answerId,
        answer: faqModalData.answer,
        category: faqModalData.category,
        tags: faqModalData.tags
      });
      setShowFaqModal(false);
      loadRTQs(page);
      refreshQP?.();
    } catch (err) {
      alert(err.message || 'Failed to convert RTQ to FAQ');
    } finally {
      setSubmittingFaq(false);
    }
  };

  const handleApproveAnswer = async (answerId) => {
    try {
      await rtqService.approveAnswer(answerId);
      loadRTQs(page);
    } catch (err) {
      alert(err.message || 'Failed to approve answer');
    }
  };

  const handleRejectAnswer = async (answerId) => {
    try {
      await rtqService.rejectAnswer(answerId);
      loadRTQs(page);
    } catch (err) {
      alert(err.message || 'Failed to reject answer');
    }
  };

  const handleReviewAnswer = async (answerId) => {
    try {
      await rtqService.reviewAnswer(answerId);
      loadRTQs(page);
    } catch (err) {
      alert(err.message || 'Failed to flag answer for review');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Raise to Clarify (RTQ)</h1>
          <p className="text-muted text-sm mt-1">Questions pending clarification</p>
        </div>
        {user && ['student', 'moderator', 'senior'].includes(user.role) && (
          <Link to="/raise-question" className="btn-primary">+ Ask a Question</Link>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search RTQs..."
          className="input flex-1"
        />
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">All</option>
          <option value="unresolved">Unresolved</option>
          <option value="resolved">Resolved</option>
          <option value="partial">Has Answers</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">All Categories</option>
          {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {rtqs.map(rtq => {
              const isExpanded = expandedId === rtq._id;
              const isOwner = user && (rtq.postedBy?._id || rtq.postedBy)?.toString() === user._id.toString();
              return (
                <div key={rtq._id} className="card p-5 relative">
                  {/* Status Indicator in Top-Right */}
                  <div className="absolute top-5 right-5 z-10">
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

                  <div className="flex gap-4">
                    <div className="flex-1 pr-28">
                      <div className="flex items-start gap-2 mb-1 flex-wrap">
                        <Link to={`/rtq/${rtq._id}`} className="font-semibold text-primary hover:underline">{rtq.question}</Link>
                        {rtq.isAccepted && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold whitespace-nowrap">✓ Moderator Accepted</span>
                        )}
                        {rtq.status === 'rejected' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold whitespace-nowrap">✗ Moderator Rejected</span>
                        )}
                        {rtq.markedForReview && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold whitespace-nowrap">⚠️ Marked for Review</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted mb-3 flex-wrap">
                        <span>{rtq.category}</span>
                        <span>•</span>
                        <span>{rtq.answers?.length || 0} answers</span>
                        <span>•</span>
                        <span>By {rtq.postedBy?.name}</span>
                        <span>•</span>
                        <span>{timeAgo(rtq.createdAt)}</span>
                      </div>

                      {isModeratorOrAbove && selectedQuestionId === rtq._id && (
                        <div className="flex items-center gap-2 mb-3 p-2 bg-slate-50 border border-slate-200 rounded-lg w-fit">
                          {!rtq.isAccepted && rtq.status !== 'rejected' && (
                            <button
                              onClick={() => handleAcceptQuestion(rtq._id)}
                              className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              title="Accept Question"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {rtq.status !== 'rejected' && (
                            <button
                              onClick={() => handleRejectQuestion(rtq._id)}
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
                              onClick={() => handleReviewQuestion(rtq._id)}
                              className="p-1.5 border border-amber-200 text-amber-600 rounded hover:bg-amber-50 transition-colors"
                              title="Flag for Review"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          )}
                          {isSeniorOrAdmin && (
                            <button
                              onClick={() => handleRemoveQuestion(rtq._id)}
                              className="p-1.5 border border-red-200 text-red-500 rounded hover:bg-red-50 transition-colors"
                              title="Remove Question Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : rtq._id)}
                        className="text-sm text-primary font-medium hover:underline"
                      >
                        {isExpanded ? 'Hide answers ↑' : `${rtq.answers?.length || 0} answers ↓`}
                      </button>

                      {isModeratorOrAbove && (
                        <button
                          onClick={() => setSelectedQuestionId(selectedQuestionId === rtq._id ? null : rtq._id)}
                          className={`p-1.5 rounded hover:bg-slate-100 transition-colors duration-200 ml-3 inline-flex items-center justify-center align-middle ${
                            selectedQuestionId === rtq._id ? 'text-primary bg-slate-100' : 'text-muted'
                          }`}
                          title={selectedQuestionId === rtq._id ? 'Cancel Selection' : 'Moderate Question'}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}

                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          {rtq.answers?.map(ans => (
                            <div key={ans._id} className="pl-4 border-l-2 border-border">
                              <p className="text-sm text-primary mb-2">{ans.answer}</p>
                              <div className="flex items-center gap-3 flex-wrap">
                                <button
                                  onClick={() => handleUpvoteAnswer(rtq._id, ans._id)}
                                  className={`text-xs px-2 py-1 rounded border ${ans.upvotedBy?.some(id => id === user?._id || id._id === user?._id)
                                    ? 'bg-primary text-white border-primary'
                                    : 'border-border text-muted hover:border-primary'}`}
                                >
                                  ↑ {ans.upvotes}
                                </button>
                                <span className="text-xs text-muted">
                                  {ans.userId?.name || 'Unknown'}
                                  {ans.userId?.role && (
                                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded font-semibold ${
                                      ans.userId.role === 'senior' ? 'bg-blue-100 text-blue-700' :
                                      ans.userId.role === 'moderator' ? 'bg-purple-100 text-purple-700' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {ans.userId.role}
                                    </span>
                                  )}
                                </span>
                                
                                {(ans.approvals?.length > 0 || ans.isApproved) && (
                                  <span className="text-xs px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded font-semibold">
                                    ✓ Moderator Approved ({ans.approvals?.length || 1})
                                  </span>
                                )}
                                {ans.rejections?.length > 0 && (
                                  <span className="text-xs px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded font-semibold">
                                    ✗ Moderator Rejected ({ans.rejections?.length})
                                  </span>
                                )}
                                {ans.markedForReview && (
                                  <span className="text-xs px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded font-semibold">
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

                          {isSeniorOrAdmin && !rtq.faqId && (
                            <div className="mt-4 pt-4 border-t border-dashed border-border flex justify-end">
                              <button
                                onClick={() => handleInitiateFAQ(rtq)}
                                className="btn-secondary flex items-center gap-2 hover:border-blue-300 hover:text-blue-600 transition-colors text-xs font-semibold px-3 py-1.5"
                                title="Add this resolved question and its best answer to the approved FAQ knowledge base"
                              >
                                <BookOpen className="w-4 h-4" /> Add to FAQ (Initiate)
                              </button>
                            </div>
                          )}

                          {user && (
                            <div className="mt-4 flex gap-2">
                              <textarea
                                value={answerForms[rtq._id] || ''}
                                onChange={e => setAnswerForms(prev => ({ ...prev, [rtq._id]: e.target.value }))}
                                placeholder="Write your answer..."
                                className="input flex-1 resize-none"
                                rows={3}
                              />
                              <button
                                onClick={() => handleSubmitAnswer(rtq._id)}
                                disabled={answerLoading[rtq._id] || !answerForms[rtq._id]?.trim()}
                                className="btn-primary self-end"
                              >
                                {answerLoading[rtq._id] ? <Spinner size="sm" /> : 'Submit'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {rtqs.length === 0 && (
              <div className="text-center py-12 text-muted">No RTQs found.</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm px-3 py-1.5"
              >
                ← Prev
              </button>
              <span className="text-sm text-muted">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-sm px-3 py-1.5"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
      {showFaqModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> Controlled FAQ Review Panel
            </h3>
            <p className="text-xs text-muted mb-4">
              Refine and review the selected answer, category, and tags before publishing to the Approved FAQ knowledge base.
            </p>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
                  Answer Content
                </label>
                <textarea
                  value={faqModalData.answer}
                  onChange={e => setFaqModalData(prev => ({ ...prev, answer: e.target.value }))}
                  className="input w-full resize-none font-sans text-sm leading-relaxed"
                  rows={6}
                  placeholder="Review and polish the answer content..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={faqModalData.category}
                    onChange={e => setFaqModalData(prev => ({ ...prev, category: e.target.value }))}
                    className="input w-full text-sm"
                  >
                    <option value="">Select Category</option>
                    {FAQ_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={faqModalData.tags}
                    onChange={e => setFaqModalData(prev => ({ ...prev, tags: e.target.value }))}
                    className="input w-full text-sm"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setShowFaqModal(false)}
                className="btn-secondary text-sm px-4 py-2"
                disabled={submittingFaq}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFaq}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={submittingFaq || !faqModalData.answer?.trim() || !faqModalData.category}
              >
                {submittingFaq ? <Spinner size="sm" /> : 'Confirm Add to FAQ'}
              </button>
            </div>
          </div>
        </div>
      )}
      <BackToTop />
    </div>
  );
}

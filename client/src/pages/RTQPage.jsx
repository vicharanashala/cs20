import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import rtqService from '../services/rtq.service';
import faqService from '../services/faq.service';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import UpvoteButton from '../components/UpvoteButton';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Breadcrumb from '../components/Breadcrumb';
import BackToTop from '../components/BackToTop';
import { Spinner } from '../components/SkeletonLoader';
import { StatusBadge } from '../components/Badge';
import { FAQ_CATEGORIES } from '../utils/constants';
import { timeAgo } from '../utils/helpers';
import {
  MessageCircle, Plus, Settings, Check, X, Flag, Trash2,
  BookOpen, FileText, ChevronDown, Search, SlidersHorizontal
} from 'lucide-react';

export default function RTQPage() {
  const { user } = useAuth();
  const { refreshQP } = useQP();
  const [searchParams] = useSearchParams();
  const [rtqs, setRtqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [flaggedOnTop, setFlaggedOnTop] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedActionId, setSelectedActionId] = useState(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [answerForms, setAnswerForms] = useState({});
  const [answerLoading, setAnswerLoading] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [submittingFaq, setSubmittingFaq] = useState(false);
  const [faqModalData, setFaqModalData] = useState({
    rtqId: '', answerId: '', answer: '', category: '', tags: ''
  });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestModalData, setRequestModalData] = useState({
    rtqId: '', question: '', suggestedAnswer: ''
  });

  const isModeratorOrAbove = user && ['moderator', 'senior', 'admin'].includes(user.role);
  const isSeniorOrAdmin = user && ['senior', 'admin'].includes(user.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'all') params.filter = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const data = await rtqService.list(params);
      const list = Array.isArray(data) ? data : (data.data || []);
      setRtqs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = rtqs.filter(rtq =>
    !search ||
    rtq.question.toLowerCase().includes(search.toLowerCase()) ||
    rtq.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Answer submit
  const handleSubmitAnswer = async (rtqId) => {
    const text = answerForms[rtqId];
    if (!text?.trim()) return;
    setAnswerLoading(true);
    const optimisticAnswer = {
      _id: `temp-${Date.now()}`,
      answer: text,
      userId: { name: user.name, role: user.role },
      upvotes: 0,
      upvotedBy: [],
      createdAt: new Date().toISOString(),
    };
    setRtqs(prev => prev.map(r =>
      r._id === rtqId ? { ...r, answers: [...(r.answers || []), optimisticAnswer] } : r
    ));
    const savedText = text;
    setAnswerForms(prev => ({ ...prev, [rtqId]: '' }));
    try {
      await rtqService.addAnswer(rtqId, { answer: text });
      refreshQP?.();
    } catch (err) {
      setRtqs(prev => prev.map(r =>
        r._id === rtqId ? { ...r, answers: r.answers.filter(a => a._id !== optimisticAnswer._id) } : r
      ));
      setAnswerForms(prev => ({ ...prev, [rtqId]: savedText }));
      alert(err.message || 'Failed to submit answer');
    } finally {
      setAnswerLoading(false);
    }
  };

  // Upvote answer
  const handleUpvoteAnswer = async (rtqId, answerId) => {
    if (answerId.startsWith('temp-')) return;
    const rtq = rtqs.find(r => r._id === rtqId);
    const ans = rtq?.answers?.find(a => a._id === answerId);
    if (!ans) return;
    const hasUpvoted = ans.upvotedBy?.some(uid => (uid?._id || uid)?.toString() === user?._id?.toString());
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
              ? a.upvotedBy.filter(uid => (uid?._id || uid)?.toString() !== user?._id?.toString())
              : [...(a.upvotedBy || []), user?._id]
          };
        })
      };
    }));
    try {
      await rtqService.upvoteAnswer(answerId);
      refreshQP?.();
    } catch { load(); }
  };

  // Moderation handlers
  const handleAcceptQuestion = async (id) => {
    try { await rtqService.markAccepted(id); load(); } catch (err) { alert(err.message); }
  };
  const handleRejectQuestion = async (id) => {
    if (!confirm('Are you sure you want to reject this question?')) return;
    try { const res = await rtqService.rejectQuestion(id); if (res.deleted) load(); else load(); } catch (err) { alert(err.message); }
  };
  const handleReviewQuestion = async (id) => {
    try { await rtqService.reviewQuestion(id); load(); } catch (err) { alert(err.message); }
  };
  const handleRemoveQuestion = async (id) => {
    if (!confirm('Permanently delete this question? -5 QP penalty.')) return;
    try { await rtqService.remove(id); load(); } catch (err) { alert(err.message); }
  };
  const handleApproveAnswer = async (answerId) => {
    try { await rtqService.approveAnswer(answerId); load(); } catch (err) { alert(err.message); }
  };
  const handleRejectAnswer = async (answerId) => {
    try { await rtqService.rejectAnswer(answerId); load(); } catch (err) { alert(err.message); }
  };
  const handleReviewAnswer = async (answerId) => {
    try { await rtqService.reviewAnswer(answerId); load(); } catch (err) { alert(err.message); }
  };
  const handleInitiateRequest = (rtq) => {
    const answers = [...(rtq.answers || [])].sort((a, b) => b.upvotes - a.upvotes);
    let selectedAns = answers.find(ans => (ans.userId?._id || ans.userId)?.toString() === user?._id?.toString())
      || answers.find(ans => ans.approvals?.some(u => u.role === 'senior' || u.role === 'admin'))
      || answers.find(ans => ans.approvals?.some(u => u.role === 'moderator'))
      || answers[0] || null;

    setRequestModalData({
      rtqId: rtq._id,
      question: rtq.question,
      suggestedAnswer: selectedAns?.answer || ''
    });
    setShowRequestModal(true);
  };

  const handleConfirmRequest = async () => {
    if (!requestModalData.suggestedAnswer?.trim()) return;
    setSubmittingRequest(true);
    try {
      await faqService.requestConversion(requestModalData.rtqId, requestModalData.suggestedAnswer);
      setShowRequestModal(false);
      alert('FAQ conversion request submitted.');
      load();
    } catch (err) {
      alert(err.message || 'Failed to submit conversion request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleInitiateFAQ = (rtq) => {
    const answers = [...(rtq.answers || [])].sort((a, b) => b.upvotes - a.upvotes);
    let selectedAns = answers.find(ans => (ans.userId?._id || ans.userId)?.toString() === user?._id?.toString())
      || answers.find(ans => ans.approvals?.some(u => u.role === 'senior' || u.role === 'admin'))
      || answers.find(ans => ans.approvals?.some(u => u.role === 'moderator'))
      || answers[0] || null;
    setFaqModalData({
      rtqId: rtq._id, answerId: selectedAns?._id || '',
      answer: selectedAns?.answer || '', category: rtq.category || '',
      tags: rtq.tags ? rtq.tags.join(', ') : ''
    });
    setShowFaqModal(true);
  };

  const handleConfirmFaq = async () => {
    if (!faqModalData.answer?.trim() || !faqModalData.category) return;
    setSubmittingFaq(true);
    try {
      await rtqService.convertToFAQ(faqModalData.rtqId, {
        answerId: faqModalData.answerId, answer: faqModalData.answer,
        category: faqModalData.category, tags: faqModalData.tags
      });
      setShowFaqModal(false);
      load(); refreshQP?.();
    } catch (err) { alert(err.message); } finally { setSubmittingFaq(false); }
  };

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'unresolved', label: 'Unresolved' },
    { value: 'partially_resolved', label: 'Partial' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const getStatusBorder = (status) => {
    switch (status) {
      case 'resolved': return 'border-l-emerald-400';
      case 'partially_resolved': return 'border-l-amber-400';
      case 'rejected': return 'border-l-red-500';
      default: return 'border-l-red-400';
    }
  };

  return (
    <div className="page-container">
      <Breadcrumb items={[{ label: 'RTQ' }]} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-accent flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="page-title">Real-Time Questions</h1>
            <p className="page-subtitle">{filtered.length} questions</p>
          </div>
        </div>
        {(user?.role === 'student' || user?.role === 'moderator') && (
          <Link to="/raise-question" className="btn-gradient-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Ask Question
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
          <input
            type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..." className="input-icon"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="pill-group">
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={statusFilter === opt.value ? 'pill-active' : 'pill-item'}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <select
            value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="input-sm w-auto"
          >
            <option value="">All Categories</option>
            {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {isSeniorOrAdmin && (
            <button
              onClick={() => setFlaggedOnTop(v => !v)}
              className={`btn-outline-sm flex items-center gap-1.5 transition-all duration-200 ${
                flaggedOnTop 
                  ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400 font-semibold' 
                  : 'hover:bg-slate-100 text-muted'
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${flaggedOnTop ? 'fill-amber-500 text-amber-600' : ''}`} />
              Flagged on Top
            </button>
          )}
        </div>
      </div>

      {/* RTQ List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No questions found"
          description={search ? `No results for "${search}"` : 'No questions match the current filters.'}
        />
      ) : (
        <div className="space-y-3">
          {(flaggedOnTop
            ? [
                ...filtered.filter(r => r.markedForReview),
                ...filtered.filter(r => !r.markedForReview)
              ]
            : filtered
          ).map(rtq => {
            const isExpanded = expandedId === rtq._id;
            const isOwner = user && (rtq.postedBy?._id || rtq.postedBy)?.toString() === user._id.toString();

            return (
              <div key={rtq._id} className={`card card-hover overflow-hidden border-l-4 ${getStatusBorder(rtq.status)}`}>
                {/* Question Row */}
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <Link to={`/rtq/${rtq._id}`} className="text-sm font-semibold text-primary leading-snug hover:text-accent transition-colors">
                        {rtq.question}
                      </Link>
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Avatar name={rtq.postedBy?.name} role={rtq.postedBy?.role} size="xs" />
                          {rtq.postedBy?.name}
                        </span>
                        <span>&middot;</span>
                        <span>{rtq.category}</span>
                        <span>&middot;</span>
                        <span>{timeAgo(rtq.createdAt)}</span>
                        {rtq.isAccepted && (
                          <><span>&middot;</span><StatusBadge status="accepted" role={rtq.acceptedBy?.role} /></>
                        )}
                        {rtq.status === 'rejected' && (
                          <><span>&middot;</span><StatusBadge status="rejected" /></>
                        )}
                        {rtq.markedForReview && (
                          <><span>&middot;</span><StatusBadge status="markedForReview" /></>
                        )}
                      </div>
                      {rtq.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rtq.tags.map(tag => (
                            <span key={tag} className="text-xs bg-accent-50 text-accent-600 px-2 py-0.5 rounded-md font-medium">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={rtq.status} />
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : rtq._id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isExpanded ? 'bg-accent-50 text-accent' : 'bg-slate-100 text-muted hover:bg-slate-200'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {rtq.answers?.length || 0}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Moderation Actions */}
                  {(isModeratorOrAbove || isOwner) && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/50">
                      {isModeratorOrAbove && (
                        <>
                          {!rtq.isAccepted && rtq.status !== 'rejected' && (
                            <button onClick={() => handleAcceptQuestion(rtq._id)} className="btn-icon-sm !text-emerald-600 hover:!bg-emerald-50" title="Accept"><Check className="w-3.5 h-3.5" /></button>
                          )}
                          {rtq.status !== 'rejected' && (
                            <button onClick={() => handleRejectQuestion(rtq._id)} className="btn-icon-sm !text-red-500 hover:!bg-red-50" title="Reject"><X className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => handleReviewQuestion(rtq._id)} className={`btn-icon-sm ${rtq.markedForReview ? '!text-amber-500 !bg-amber-50' : ''}`} title="Flag"><Flag className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                      {user?.role === 'moderator' && (
                        <button onClick={() => handleInitiateRequest(rtq)} className="btn-icon-sm !text-accent hover:!bg-accent-50 ml-auto" title="Request FAQ Conversion"><FileText className="w-3.5 h-3.5" /></button>
                      )}
                      {isSeniorOrAdmin && !rtq.faqId && (
                        <button onClick={() => handleInitiateFAQ(rtq)} className="btn-icon-sm !text-accent hover:!bg-accent-50 ml-auto" title="Add to FAQ"><BookOpen className="w-3.5 h-3.5" /></button>
                      )}
                      {isSeniorOrAdmin && (
                        <button onClick={() => handleRemoveQuestion(rtq._id)} className="btn-icon-sm !text-red-500 hover:!bg-red-50" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Answers */}
                <div className={`accordion-content ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="border-t border-border/50 bg-slate-50/30 p-5 space-y-3">
                    {rtq.answers?.map(ans => {
                      const hasUpvoted = ans.upvotedBy?.some(uid => (uid?._id || uid)?.toString() === user?._id?.toString());
                      return (
                        <div key={ans._id} className="flex gap-3">
                          <Avatar name={ans.userId?.name} role={ans.userId?.role} size="sm" />
                          <div className="flex-1 bg-white rounded-xl p-4 border border-border/60 shadow-sm">
                            <p className="text-sm text-primary leading-relaxed">{ans.answer}</p>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <UpvoteButton
                                  upvotes={ans.upvotes}
                                  onUpvote={() => handleUpvoteAnswer(rtq._id, ans._id)}
                                  hasUpvoted={hasUpvoted}
                                />
                                <span className="text-xs text-muted">
                                  {ans.userId?.name || 'Unknown'}
                                  {ans.userId?.role && (
                                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded font-medium ${
                                      ans.userId.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                                      (ans.userId.role === 'senior' || ans.userId.role === 'admin') ? 'bg-purple-100 text-purple-700' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>{ans.userId.role}</span>
                                  )}
                                </span>
                                <span className="text-xs text-muted">{timeAgo(ans.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {(ans.approvals?.length > 0 || ans.isApproved) && <StatusBadge status="approved" role={ans.approvedBy?.role} />}
                                {ans.rejections?.length > 0 && <StatusBadge status="rejected" />}
                                {ans.markedForReview && <StatusBadge status="markedForReview" />}
                                {isModeratorOrAbove && (
                                  <div className="flex gap-0.5 ml-1">
                                    <button onClick={() => handleApproveAnswer(ans._id)} className="btn-icon-sm !p-1 !text-emerald-600 hover:!bg-emerald-50" title="Approve"><Check className="w-3 h-3" /></button>
                                    <button onClick={() => handleRejectAnswer(ans._id)} className="btn-icon-sm !p-1 !text-red-500 hover:!bg-red-50" title="Reject"><X className="w-3 h-3" /></button>
                                    {!ans.markedForReview && (
                                      <button onClick={() => handleReviewAnswer(ans._id)} className="btn-icon-sm !p-1 !text-amber-500 hover:!bg-amber-50" title="Flag"><Flag className="w-3 h-3" /></button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(!rtq.answers || rtq.answers.length === 0) && (
                      <p className="text-sm text-muted text-center py-4">No answers yet. Be the first!</p>
                    )}
                    {/* Inline answer form */}
                    {user && (
                      <div className="flex gap-3 mt-2">
                        <Avatar name={user.name} role={user.role} size="sm" />
                        <div className="flex-1 flex gap-2">
                          <input
                            value={answerForms[rtq._id] || ''}
                            onChange={e => setAnswerForms(prev => ({ ...prev, [rtq._id]: e.target.value }))}
                            placeholder="Write an answer..."
                            className="input flex-1 text-sm"
                          />
                          <button
                            onClick={() => handleSubmitAnswer(rtq._id)}
                            disabled={answerLoading || !answerForms[rtq._id]?.trim()}
                            className="btn-gradient-sm whitespace-nowrap"
                          >
                            {answerLoading ? <Spinner size="sm" /> : 'Reply'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAQ Conversion Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-card-elevated max-w-lg w-full p-6 border border-border/40 flex flex-col max-h-[90vh] animate-scaleIn">
            <h3 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              Add to FAQ
            </h3>
            <p className="text-xs text-muted mb-4">Review and polish before publishing to the knowledge base.</p>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="label-sm">Answer Content</label>
                <textarea
                  value={faqModalData.answer}
                  onChange={e => setFaqModalData(prev => ({ ...prev, answer: e.target.value }))}
                  className="input resize-none text-sm" rows={6}
                  placeholder="Review and polish the answer..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-sm">Category</label>
                  <select
                    value={faqModalData.category}
                    onChange={e => setFaqModalData(prev => ({ ...prev, category: e.target.value }))}
                    className="input text-sm"
                  >
                    <option value="">Select Category</option>
                    {FAQ_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-sm">Tags (comma-separated)</label>
                  <input
                    type="text" value={faqModalData.tags}
                    onChange={e => setFaqModalData(prev => ({ ...prev, tags: e.target.value }))}
                    className="input text-sm" placeholder="tag1, tag2"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-border/50">
              <button onClick={() => setShowFaqModal(false)} className="btn-outline text-sm" disabled={submittingFaq}>Cancel</button>
              <button
                onClick={handleConfirmFaq} className="btn-gradient text-sm flex items-center gap-2"
                disabled={submittingFaq || !faqModalData.answer?.trim() || !faqModalData.category}
              >
                {submittingFaq ? <Spinner size="sm" /> : 'Confirm Add to FAQ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Conversion Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-card-elevated max-w-lg w-full p-6 border border-border/40 flex flex-col max-h-[90vh] animate-scaleIn">
            <h3 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              Request FAQ Conversion
            </h3>
            <p className="text-xs text-muted mb-4">Suggest this question and answer to be added to the FAQ database. An Admin or Senior will review it.</p>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="label-sm">Question</label>
                <div className="p-3 bg-slate-50 border border-border/50 rounded-xl text-sm font-semibold text-primary">
                  {requestModalData.question}
                </div>
              </div>
              <div>
                <label className="label-sm">Suggested Answer</label>
                <textarea
                  value={requestModalData.suggestedAnswer}
                  onChange={e => setRequestModalData(prev => ({ ...prev, suggestedAnswer: e.target.value }))}
                  className="input resize-none text-sm" rows={6}
                  placeholder="Review and polish the suggested answer..."
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-border/50">
              <button onClick={() => setShowRequestModal(false)} className="btn-outline text-sm" disabled={submittingRequest}>Cancel</button>
              <button
                onClick={handleConfirmRequest} className="btn-gradient text-sm flex items-center gap-2"
                disabled={submittingRequest || !requestModalData.suggestedAnswer?.trim()}
              >
                {submittingRequest ? <Spinner size="sm" /> : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BackToTop />
    </div>
  );
}

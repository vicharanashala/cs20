import { useState, useEffect, useCallback } from 'react';
import questionService from '../services/question.service';
import rtqService from '../services/rtq.service';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/helpers';
import Breadcrumb from '../components/Breadcrumb';
import { StatusBadge } from '../components/Badge';
import { HelpCircle, MessageSquare, Layers, Calendar, CheckCircle2, Clock, ShieldAlert, AlertTriangle, Inbox } from 'lucide-react';
import { Spinner } from '../components/SkeletonLoader';

export default function TrackQuestionPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [rtqs, setRtqs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Stats calculation
  const totalRtqs = rtqs.length;
  const resolvedRtqs = rtqs.filter(r => r.status === 'resolved').length;
  const totalDirect = questions.length;
  const resolvedDirect = questions.filter(q => q.status === 'resolved').length;

  return (
    <div className="page-container max-w-4xl">
      <Breadcrumb items={[{ label: 'Track Questions' }]} />
      
      {/* Header section */}
      <div className="mb-8">
        <h1 className="page-title flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center shadow-md shadow-accent/10">
            <Clock className="w-5 h-5 text-white" />
          </div>
          Track My Questions
        </h1>
        <p className="page-subtitle mt-1">
          Monitor answers and manage resolution status for your RTQ submissions and direct questions.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 border border-border/50 bg-white/60 backdrop-blur-sm shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total RTQs</span>
          <span className="text-2xl font-bold text-primary mt-1">{totalRtqs}</span>
        </div>
        <div className="card p-4 border border-border/50 bg-emerald-50/10 backdrop-blur-sm shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider">Resolved RTQs</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1">{resolvedRtqs}</span>
        </div>
        <div className="card p-4 border border-border/50 bg-white/60 backdrop-blur-sm shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Direct</span>
          <span className="text-2xl font-bold text-primary mt-1">{totalDirect}</span>
        </div>
        <div className="card p-4 border border-border/50 bg-emerald-50/10 backdrop-blur-sm shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider">Resolved Direct</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1">{resolvedDirect}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* RTQ Submissions section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-bold text-primary gradient-underline">RTQ Submissions</h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-muted rounded-full">{rtqs.length}</span>
            </div>

            {rtqs.length === 0 ? (
              <div className="card p-8 border border-dashed border-border/70 bg-white/30 backdrop-blur-sm text-center">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">No open forum questions submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rtqs.map(rtq => {
                  return (
                    <div key={rtq._id} className="card card-hover border border-border/50 p-5 bg-white shadow-sm flex flex-col gap-3.5 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-primary text-sm sm:text-base leading-snug">
                            {rtq.question}
                          </p>

                          {/* Metadata row */}
                          <div className="flex items-center gap-3.5 mt-3 flex-wrap text-xs text-muted">
                            <span className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-slate-400" />
                              {rtq.category}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {timeAgo(rtq.createdAt)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                              {rtq.answers?.length || 0} Answers
                            </span>
                          </div>
                        </div>

                        {/* Status dropdown */}
                        {rtq.status !== 'rejected' && (
                          <div className="shrink-0">
                            <select
                              value={rtq.status || 'unresolved'}
                              onChange={e => handleRTQStatusUpdate(rtq._id, e.target.value)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border shadow-sm cursor-pointer focus:outline-none transition-all ${
                                rtq.status === 'resolved'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : rtq.status === 'partially_resolved'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              <option value="unresolved" className="bg-white text-red-600">Unresolved</option>
                              <option value="partially_resolved" className="bg-white text-blue-600">Partially Resolved</option>
                              <option value="resolved" className="bg-white text-green-600">Resolved</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Status badges */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                        {rtq.isAccepted && (
                          <StatusBadge status="accepted" role={rtq.acceptedBy?.role} />
                        )}
                        {rtq.status === 'rejected' && (
                          <StatusBadge status="rejected" />
                        )}
                        {rtq.markedForReview && (
                          <StatusBadge status="markedForReview" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Direct Questions section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-bold text-primary gradient-underline">Direct Questions</h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-muted rounded-full">{questions.length}</span>
            </div>

            {questions.length === 0 ? (
              <div className="card p-8 border border-dashed border-border/70 bg-white/30 backdrop-blur-sm text-center">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">No direct questions tracked.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map(q => (
                  <div key={q._id} className="card card-hover border border-border/50 p-5 bg-white shadow-sm flex flex-col gap-3 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-primary text-sm sm:text-base leading-snug">
                          {q.question}
                        </p>
                        
                        {/* Metadata row */}
                        <div className="flex items-center gap-3.5 mt-3 flex-wrap text-xs text-muted">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {q.category}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {timeAgo(q.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <div className="shrink-0">
                        <select
                          value={q.status}
                          onChange={e => handleStatusUpdate(q._id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border shadow-sm cursor-pointer focus:outline-none transition-all ${
                            q.status === 'resolved'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : q.status === 'partial'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          <option value="unresolved" className="bg-white text-red-600">Unresolved</option>
                          <option value="partial" className="bg-white text-blue-600">Partially Resolved</option>
                          <option value="resolved" className="bg-white text-green-600">Resolved</option>
                        </select>
                      </div>
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

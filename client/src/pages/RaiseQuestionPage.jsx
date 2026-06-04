import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import rtqService from '../services/rtq.service';
import ragService from '../services/rag.service';
import { FAQ_CATEGORIES } from '../utils/constants';
import Breadcrumb from '../components/Breadcrumb';
import { Search, AlertCircle, HelpCircle, Sparkles, Tag, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

export default function RaiseQuestionPage() {
  const [form, setForm] = useState({ question: '', category: '', tags: '' });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'question') setPreview(null);
  };

  const handleEvaluate = async () => {
    if (!form.question) return;
    setEvaluating(true);
    setError('');
    try {
      const result = await ragService.evaluateQuestion({ question: form.question });
      setPreview(result);
    } catch (err) {
      setError('Failed to evaluate question');
    } finally {
      setEvaluating(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await rtqService.submitQuestion({ ...form, tags });
      if (res.status === 'REJECT') {
        setPreview(res);
        const penaltyMsg = res.penalty < 0 ? ` ${res.penalty} QP penalty applied.` : '';
        setError(`Question rejected: ${res.reason}.${penaltyMsg}`);
      } else {
        navigate('/rtq');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <Breadcrumb items={[{ label: 'RTQ', to: '/rtq' }, { label: 'Ask a Question' }]} />
      
      {/* Header section */}
      <div className="mb-8">
        <h1 className="page-title flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center shadow-md shadow-accent/10">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          Ask a Question
        </h1>
        <p className="page-subtitle mt-1">
          Submit a new question to the Senior/Admin community. Please check for duplicates first to save Quality Points!
        </p>
      </div>

      <div className="card shadow-premium border border-border/50 bg-white/90 backdrop-blur-md p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && !preview && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl border border-red-200/60 bg-red-50/40 text-red-800 text-sm animate-slideDown">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {preview?.status === 'REJECT' && (
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-amber-800 text-sm animate-slideDown">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 leading-tight">Duplicate Question Found</p>
                    <p className="text-xs text-amber-700 mt-1">{preview.reason}</p>
                  </div>
                </div>
                {preview.penalty < 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-md shrink-0">
                    {preview.penalty} QP Penalty
                  </span>
                )}
              </div>

              {preview.matchedFAQ && (
                <div className="bg-white/80 border border-amber-200/50 rounded-lg p-3 text-xs space-y-2 mt-1">
                  <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Highly similar FAQ Match ({(preview.faqScore * 100).toFixed(0)}%):</span>
                  </div>
                  <p className="font-medium text-slate-800 italic">"{preview.matchedFAQ.question}"</p>
                  {preview.matchedRTQ && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-amber-700 font-semibold">Similar Open Question:</p>
                      <p className="font-medium text-slate-800 italic">"{preview.matchedRTQ.question}"</p>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-xs text-amber-700 hover:text-amber-900 underline font-semibold mt-1 self-start"
              >
                Dismiss Warning
              </button>
            </div>
          )}

          {preview?.status === 'ACCEPT' && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 text-emerald-800 text-sm animate-slideDown">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 leading-tight">No duplicates detected!</p>
                <p className="text-xs text-emerald-700 mt-1">
                  Your question seems unique. You're ready to submit it!
                </p>
              </div>
            </div>
          )}

          {/* Question Text Area */}
          <div className="flex flex-col">
            <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              Describe your Question
            </label>
            <textarea
              name="question"
              value={form.question}
              onChange={handleChange}
              className="w-full border border-border/70 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent bg-white/50 backdrop-blur-sm transition-all resize-none shadow-sm placeholder:text-muted/40"
              rows={4}
              placeholder="What would you like to ask the mentors?"
              required
            />
            <button
              type="button"
              onClick={handleEvaluate}
              disabled={!form.question || evaluating}
              className="mt-2.5 self-start text-xs font-bold text-accent hover:text-accent-700 hover:underline flex items-center gap-1 disabled:opacity-40 disabled:no-underline transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              {evaluating ? 'Analyzing question...' : 'Scan for similar questions first'}
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex flex-col">
            <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-border/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent bg-white/50 backdrop-blur-sm transition-all shadow-sm cursor-pointer"
              required
            >
              <option value="">Select a category</option>
              {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Tags Input */}
          <div className="flex flex-col">
            <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-slate-400" />
              Tags <span className="text-xs text-muted font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              className="w-full border border-border/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent bg-white/50 backdrop-blur-sm transition-all shadow-sm placeholder:text-muted/40"
              placeholder="e.g. javascript, certificate, rosetta"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/40">
            <button
              type="submit"
              disabled={loading || evaluating}
              className="btn-gradient flex items-center gap-1.5"
            >
              {loading ? 'Submitting...' : 'Submit Question'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/rtq')}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

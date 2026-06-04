import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import faqService from '../services/faq.service';
import { useQP } from '../context/QPContext';
import { FAQ_CATEGORIES } from '../utils/constants';
import Breadcrumb from '../components/Breadcrumb';
import { BookOpen, X } from 'lucide-react';

export default function AddFAQPage() {
  const [form, setForm] = useState({ question: '', answer: '', category: '', tags: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { refreshQP } = useQP();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.question || !form.answer || !form.category) {
      setError('Question, answer, and category are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      await faqService.create({ ...form, tags });
      refreshQP?.();
      navigate('/faq');
    } catch (err) {
      setError(err.message || 'Failed to create FAQ');
    } finally {
      setLoading(false);
    }
  };

  const tagsList = form.tags.split(',').map(t => t.trim()).filter(Boolean);

  return (
    <div className="page-container">
      <Breadcrumb items={[{ label: 'FAQs', to: '/faq' }, { label: 'Add FAQ' }]} />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="page-title">Add New FAQ</h1>
          <p className="page-subtitle">Create a new knowledge base entry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="label">Question</label>
                <textarea
                  name="question" value={form.question} onChange={handleChange}
                  className="input resize-none" rows={3}
                  placeholder="What question are you answering?"
                  required
                />
              </div>
              <div>
                <label className="label">Answer</label>
                <textarea
                  name="answer" value={form.answer} onChange={handleChange}
                  className="input resize-none" rows={6}
                  placeholder="The detailed answer..."
                  required
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className="input" required>
                  <option value="">Select a category</option>
                  {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tags (comma-separated)</label>
                <input
                  type="text" name="tags" value={form.tags} onChange={handleChange}
                  className="input" placeholder="react, hooks, state"
                />
                {tagsList.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tagsList.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-accent-50 text-accent-600 px-2 py-0.5 rounded-md font-medium">
                        {tag}
                        <button type="button" onClick={() => {
                          const newTags = tagsList.filter((_, j) => j !== i).join(', ');
                          setForm(f => ({ ...f, tags: newTags }));
                        }} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="btn-gradient">
                  {loading ? 'Creating...' : 'Create FAQ'}
                </button>
                <button type="button" onClick={() => navigate('/faq')} className="btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-20">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Live Preview</h3>
            <div className="card p-5">
              {form.question ? (
                <>
                  <h4 className="text-sm font-semibold text-primary mb-2">{form.question}</h4>
                  {form.category && (
                    <span className="text-xs px-2 py-0.5 bg-accent-50 text-accent-600 rounded-md font-medium">{form.category}</span>
                  )}
                  {tagsList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tagsList.map((tag, i) => (
                        <span key={i} className="text-xs bg-accent-50 text-accent-600 px-1.5 py-0.5 rounded font-medium">{tag}</span>
                      ))}
                    </div>
                  )}
                  {form.answer && (
                    <div className="bg-slate-50 rounded-xl p-3 mt-3">
                      <p className="text-xs text-primary leading-relaxed whitespace-pre-wrap">{form.answer}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted text-center py-4">Start typing to see a preview...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
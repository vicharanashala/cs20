import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import faqService from '../services/faq.service';
import { useQP } from '../context/QPContext';
import { FAQ_CATEGORIES } from '../utils/constants';
import Breadcrumb from '../components/Breadcrumb';
import { Spinner } from '../components/SkeletonLoader';

export default function FAQEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshQP } = useQP();
  const [form, setForm] = useState({ question: '', answer: '', category: '', tags: '', isTrending: false, markedForReview: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    faqService.get(id)
      .then(faq => {
        setForm({
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          tags: (faq.tags || []).join(', '),
          isTrending: faq.isTrending || false,
          markedForReview: faq.markedForReview || false,
        });
      })
      .catch(() => navigate('/faq'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.question || !form.answer || !form.category) {
      setError('Question, answer, and category are required');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      await faqService.update(id, { ...form, tags });
      navigate('/faq');
    } catch (err) {
      setError(err.message || 'Failed to update FAQ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Breadcrumb items={[
        { label: 'FAQs', to: '/faq' },
        { label: 'Edit FAQ' }
      ]} />
      <h1 className="text-2xl font-bold text-primary mb-6">Edit FAQ</h1>
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Question</label>
            <textarea
              name="question"
              value={form.question}
              onChange={handleChange}
              className="input resize-none"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Answer</label>
            <textarea
              name="answer"
              value={form.answer}
              onChange={handleChange}
              className="input resize-none"
              rows={5}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select a category</option>
              {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              className="input"
              placeholder="react, hooks, state"
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isTrending"
                checked={form.isTrending}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>Mark as Trending</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="markedForReview"
                checked={form.markedForReview}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>Mark for Review</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Spinner size="sm" /> : 'Save Changes'}
            </button>
            <button type="button" onClick={() => navigate('/faq')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
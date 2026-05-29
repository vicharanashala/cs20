import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import faqService from '../services/faq.service';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import UpvoteButton from '../components/UpvoteButton';
import { FAQ_CATEGORIES } from '../utils/constants';
import { timeAgo } from '../utils/helpers';
import { SkeletonCard } from '../components/SkeletonLoader';
import BackToTop from '../components/BackToTop';
import Breadcrumb from '../components/Breadcrumb';

export default function FAQPage() {
  const [grouped, setGrouped] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('upvotes');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshQP } = useQP();
  const limit = 30;

  const loadFAQs = async (pageNum = 1) => {
    setLoading(true);
    try {
      const sortMap = { upvotes: 'upvotes', newest: 'createdAt', oldest: 'createdAt' };
      const sortDir = { upvotes: -1, newest: -1, oldest: 1 };
      const res = await faqService.list({ sort: sortMap[sort], sortDir: sortDir[sort], category: selectedCategory !== 'all' ? selectedCategory : undefined, page: pageNum, limit });
      setGrouped(res.grouped);
      setCategories(res.categories);
      if (res.pagination) {
        setTotal(res.pagination.total);
        setPage(pageNum);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); loadFAQs(1); }, [selectedCategory, sort]);
  useEffect(() => { loadFAQs(page); }, [page]);

  const handleUpvote = async (faqId) => {
    const prevGrouped = grouped;
    setGrouped(prev => {
      const next = {};
      for (const [cat, items] of Object.entries(prev)) {
        next[cat] = items.map(faq => {
          if (faq._id !== faqId) return faq;
          const alreadyUpvoted = faq.upvotedBy?.some(id => (id?._id || id)?.toString() === user?._id?.toString());
          return {
            ...faq,
            upvotes: alreadyUpvoted ? Math.max(0, faq.upvotes - 1) : faq.upvotes + 1,
            upvotedBy: alreadyUpvoted
              ? faq.upvotedBy.filter(id => (id?._id || id)?.toString() !== user?._id?.toString())
              : [...(faq.upvotedBy || []), { _id: user._id }]
          };
        });
      }
      return next;
    });

    try {
      await faqService.upvote(faqId);
      refreshQP?.();
    } catch (err) {
      setGrouped(prevGrouped);
      console.error(err);
    }
  };

  const handleDelete = async (faqId) => {
    if (!confirm('Delete this FAQ? This cannot be undone.')) return;
    const prevGrouped = grouped;
    setGrouped(prev => {
      const next = {};
      for (const [cat, items] of Object.entries(prev)) {
        next[cat] = items.filter(faq => faq._id !== faqId);
      }
      return next;
    });
    try {
      await faqService.remove(faqId);
    } catch (err) {
      setGrouped(prevGrouped);
      alert(err.message || 'Failed to delete FAQ');
    }
  };

  const filteredCategories = selectedCategory === 'all'
    ? Object.keys(grouped)
    : [selectedCategory];

  const searchFiltered = (items) => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  };

  const isSenior = user?.role === 'senior' || user?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'FAQs' }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">FAQ Knowledge Base</h1>
          <p className="text-muted text-sm mt-1">Browse solved questions and answers</p>
        </div>
        {isSenior && (
          <Link to="/add-faq" className="btn-primary">+ Add FAQ</Link>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search FAQs..."
          className="input flex-1"
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className="input w-auto">
          <option value="upvotes">Most Upvoted</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map(category => {
            const items = searchFiltered(grouped[category] || []);
            if (items.length === 0) return null;
            return (
              <div key={category}>
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">{category}</h2>
                <div className="space-y-3">
                  {items.map(faq => (
                    <div key={faq._id} className="card p-5">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1 min-w-[40px]">
                          <UpvoteButton
                            upvotes={faq.upvotes}
                            onUpvote={() => handleUpvote(faq._id)}
                            hasUpvoted={faq.upvotedBy?.some(id => (id?._id || id)?.toString() === user?._id?.toString())}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-primary mb-1">{faq.question}</h3>
                            {isSenior && (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => navigate(`/faq/edit/${faq._id}`)}
                                  className="text-xs px-2 py-1 border border-border rounded text-muted hover:text-primary hover:border-primary transition-colors"
                                  title="Edit FAQ"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(faq._id)}
                                  className="text-xs px-2 py-1 border border-red-200 rounded text-red-400 hover:bg-red-50 transition-colors"
                                  title="Delete FAQ"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted mb-3">{faq.answer}</p>
                          <div className="flex items-center gap-3 text-xs text-muted">
                            <span>By {faq.createdBy?.name}</span>
                            <span>•</span>
                            <span>{timeAgo(faq.createdAt)}</span>
                            {faq.isTrending && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Trending</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(grouped).length === 0 && !loading && (
            <div className="text-center py-12 text-muted">No FAQs found.</div>
          )}
        </div>
      )}

      {total > limit && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            ← Prev
          </button>
          <span className="text-sm text-muted">Page {page}</span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
            disabled={page >= Math.ceil(total / limit)}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            Next →
          </button>
        </div>
      )}

      <BackToTop />
    </div>
  );
}
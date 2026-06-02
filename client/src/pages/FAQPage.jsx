import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import faqService from '../services/faq.service';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import UpvoteButton from '../components/UpvoteButton';
import { FAQ_CATEGORIES } from '../utils/constants';
import { timeAgo } from '../utils/helpers';
import { ArrowBigUp, Settings } from 'lucide-react';
import { cn } from '../utils/helpers';
import { SkeletonCard } from '../components/SkeletonLoader';
import BackToTop from '../components/BackToTop';
import Breadcrumb from '../components/Breadcrumb';
import { StatusBadge } from '../components/Badge';

export default function FAQPage() {
  const [grouped, setGrouped] = useState({});
  const [categories, setCategories] = useState([]);
  const [rankedCategories, setRankedCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('upvotes');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeFAQSettingsId, setActiveFAQSettingsId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshQP } = useQP();
  const limit = 30;

  const loadFAQs = async (pageNum = 1) => {
    setLoading(true);
    try {
      const sortMap = { upvotes: 'upvotes', newest: 'createdAt', oldest: 'createdAt' };
      const sortDir = { upvotes: -1, newest: -1, oldest: 1 };
      const [faqRes, rankedRes] = await Promise.all([
        faqService.list({ sort: sortMap[sort], sortDir: sortDir[sort], category: selectedCategory !== 'all' ? selectedCategory : undefined, page: pageNum, limit }),
        faqService.listCategoriesRanked(),
      ]);
      // Normalize grouped keys: strip numeric prefixes and normalize dashes/spaces (e.g. "9. Rosetta — your internship journal" → "Rosetta - your internship journal")
      const normalizedGrouped = {};
      for (const [key, value] of Object.entries(faqRes.grouped)) {
        let normKey = key.replace(/^\d+\.\s*/, '').trim();
        // Replace em-dashes (—) or en-dashes (–) with normal hyphens (-)
        normKey = normKey.replace(/[\u2010-\u2015\u2212]/g, '-');
        // Standardize spacing around hyphens: replace " - " or "  -  " etc. with " - "
        normKey = normKey.replace(/\s*-\s*/g, ' - ');
        
        normalizedGrouped[normKey] = normalizedGrouped[normKey]
          ? [...normalizedGrouped[normKey], ...value]
          : value;
      }
      setGrouped(normalizedGrouped);
      setCategories(faqRes.categories);
      setRankedCategories(rankedRes);
      if (faqRes.pagination) {
        setTotal(faqRes.pagination.total);
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

  const handleCategoryUpvote = async (categoryName) => {
    const prevRanked = rankedCategories;

    // Optimistic update
    setRankedCategories(prev => {
      const updated = prev.map(cat => {
        if (cat.categoryName !== categoryName) return cat;
        const wasUpvoted = cat.hasUpvoted;
        return {
          ...cat,
          upvotes: wasUpvoted ? Math.max(0, cat.upvotes - 1) : cat.upvotes + 1,
          hasUpvoted: !wasUpvoted,
        };
      });
      // Re-sort after upvote change
      updated.sort((a, b) => {
        if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
        return new Date(b.lastActivity) - new Date(a.lastActivity);
      });
      return updated;
    });

    try {
      await faqService.upvoteCategory(categoryName);
    } catch (err) {
      setRankedCategories(prevRanked);
      console.error(err);
    }
  };

  // Use ranked category order for display
  const sortedCategoryNames = rankedCategories.map(c => c.categoryName);

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

  const handleReviewFAQ = async (faqId) => {
    try {
      await faqService.reviewFAQ(faqId);
      loadFAQs(page);
    } catch (err) {
      alert(err.message || 'Failed to mark FAQ for review');
    }
  };

  const handleToggleTrendingFAQ = async (faqId) => {
    try {
      await faqService.toggleTrendingFAQ(faqId);
      loadFAQs(page);
    } catch (err) {
      alert(err.message || 'Failed to update trending status');
    }
  };
  const filteredCategories = selectedCategory === 'all'
    ? [
        ...sortedCategoryNames.filter(name => grouped[name]?.length > 0),
        ...Object.keys(grouped).filter(name => grouped[name]?.length > 0 && !sortedCategoryNames.includes(name))
      ]
    : [selectedCategory];

  const searchFiltered = (items) => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  };

  const sortItems = (items) => {
    const sorted = [...items];
    if (sort === 'upvotes') {
      sorted.sort((a, b) => b.upvotes - a.upvotes);
    } else if (sort === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    return sorted;
  };

  const getCategoryUpvoteInfo = (categoryName) => {
    return rankedCategories.find(c => c.categoryName === categoryName) || { upvotes: 0, hasUpvoted: false };
  };

  const isSenior = user?.role === 'senior' || user?.role === 'admin';
  const isModeratorOrAbove = user && ['moderator', 'senior', 'admin'].includes(user.role);

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
          {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
            const items = sortItems(searchFiltered(grouped[category] || []));
            if (items.length === 0) return null;
            const catInfo = getCategoryUpvoteInfo(category);
            return (
              <div key={category}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{category}</h2>
                  <button
                    id={`category-upvote-${category.replace(/[^a-zA-Z0-9]/g, '-')}`}
                    onClick={() => handleCategoryUpvote(category)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 border',
                      catInfo.hasUpvoted
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-surface text-muted border-border hover:bg-slate-100 hover:text-primary'
                    )}
                  >
                    <ArrowBigUp className={cn('w-3.5 h-3.5', catInfo.hasUpvoted && 'fill-green-600')} />
                    <span>{catInfo.upvotes}</span>
                  </button>
                </div>
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
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-semibold text-primary">{faq.question}</h3>
                                {isModeratorOrAbove && faq.markedForReview && (
                                  <StatusBadge status="markedForReview" />
                                )}
                              </div>
                            </div>
                            {isModeratorOrAbove && (
                              <div className="relative shrink-0">
                                <button
                                  onClick={() => setActiveFAQSettingsId(activeFAQSettingsId === faq._id ? null : faq._id)}
                                  className="p-1 rounded hover:bg-slate-100 text-muted hover:text-primary transition-colors duration-200"
                                  title="Moderator Actions"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                {activeFAQSettingsId === faq._id && (
                                  <div className="absolute right-0 mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-20 py-1">
                                    {!faq.markedForReview ? (
                                      <button
                                        onClick={() => {
                                          handleReviewFAQ(faq._id);
                                          setActiveFAQSettingsId(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-amber-600 hover:bg-amber-50 font-semibold flex items-center gap-1.5"
                                      >
                                        ⚠️ Flag for Review
                                      </button>
                                    ) : (
                                      <div className="px-3 py-2 text-xs text-muted italic flex items-center gap-1.5 border-b border-border">
                                        <StatusBadge status="markedForReview" />
                                      </div>
                                    )}
                                    <button
                                      onClick={() => {
                                        handleToggleTrendingFAQ(faq._id);
                                        setActiveFAQSettingsId(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-slate-50 font-semibold flex items-center gap-1.5"
                                    >
                                      ⭐ {faq.isTrending ? 'Remove Trending' : 'Set on Trending'}
                                    </button>
                                    {isSenior && (
                                      <>
                                        <div className="border-t border-border my-1"></div>
                                        <button
                                          onClick={() => {
                                            navigate(`/faq/edit/${faq._id}`);
                                            setActiveFAQSettingsId(null);
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-slate-50 font-semibold"
                                        >
                                          Edit FAQ
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleDelete(faq._id);
                                            setActiveFAQSettingsId(null);
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold"
                                        >
                                          Delete FAQ
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
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
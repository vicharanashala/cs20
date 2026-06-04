import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import faqService from '../services/faq.service';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import UpvoteButton from '../components/UpvoteButton';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Breadcrumb from '../components/Breadcrumb';
import BackToTop from '../components/BackToTop';
import { Spinner } from '../components/SkeletonLoader';
import { FAQ_CATEGORIES } from '../utils/constants';
import { timeAgo } from '../utils/helpers';
import { Search, BookOpen, Pencil, Trash2, ChevronDown, ChevronUp, Plus, SlidersHorizontal, Eye, Flag, ChevronLeft, ChevronRight, TrendingUp as TrendingIcon, ArrowBigUp } from 'lucide-react';
import LoginModal from '../components/LoginModal';

const categoryIcons = {
  'About the internship': '🎓',
  'Timing and dates': '📅',
  'NOC (No Objection Certificate)': '📝',
  'Selection, offer letter, and certificate': '✉️',
  'Work, mentorship, and projects': '💻',
  'Code of conduct - communication channels': '💬',
  'Interviews Related': '🤝',
  'Certificate': '📜',
  'Rosetta - your internship journal': '📓',
  'General': '🌐'
};

export default function FAQPage() {
  const { user } = useAuth();
  const { refreshQP } = useQP();
  const [searchParams, setSearchParams] = useSearchParams();

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'upvotes');
  const [reviewOnTop, setReviewOnTop] = useState(false);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [conversionRequests, setConversionRequests] = useState([]);
  const [rankedCategories, setRankedCategories] = useState([]);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const limit = 15;

  const scrollRef = useRef(null);
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.6 
        : scrollLeft + clientWidth * 0.6;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const isSeniorOrAdmin = user && ['senior', 'admin'].includes(user.role);
  const isModeratorOrAbove = user && ['moderator', 'senior', 'admin'].includes(user.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, sort };
      if (search) params.search = search;
      if (category) params.category = category;
      const [faqData, rankedData] = await Promise.all([
        faqService.list(params),
        faqService.listCategoriesRanked().catch(() => [])
      ]);
      setFaqs(faqData.faqs || []);
      setTotal(faqData.pagination?.total || 0);
      setRankedCategories(rankedData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, sort, category, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isSeniorOrAdmin) {
      faqService.getConversionRequests?.()
        .then(setConversionRequests)
        .catch(() => {});
    }
  }, [isSeniorOrAdmin]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleUpvote = async (faqId) => {
    if (!user) { setLoginModalOpen(true); return; }
    const faq = faqs.find(f => f._id === faqId);
    const hasUpvoted = faq?.upvotedBy?.some(uid => (uid?._id || uid)?.toString() === user?._id?.toString());
    setFaqs(prev => prev.map(f => {
      if (f._id !== faqId) return f;
      return {
        ...f,
        upvotes: hasUpvoted ? f.upvotes - 1 : f.upvotes + 1,
        upvotedBy: hasUpvoted
          ? f.upvotedBy.filter(uid => (uid?._id || uid)?.toString() !== user?._id?.toString())
          : [...(f.upvotedBy || []), user?._id]
      };
    }));
    try {
      await faqService.upvote(faqId);
      refreshQP?.();
    } catch { load(); }
  };

  const handleCategoryUpvote = async (categoryName) => {
    if (!user) { setLoginModalOpen(true); return; }
    const prevRanked = rankedCategories;
    setRankedCategories(prev => {
      return prev.map(cat => {
        if (cat.categoryName !== categoryName) return cat;
        const wasUpvoted = cat.hasUpvoted;
        return {
          ...cat,
          upvotes: wasUpvoted ? Math.max(0, cat.upvotes - 1) : cat.upvotes + 1,
          hasUpvoted: !wasUpvoted,
        };
      });
    });
    try {
      await faqService.upvoteCategory(categoryName);
    } catch (err) {
      setRankedCategories(prevRanked);
      console.error(err);
    }
  };

  const getCategoryUpvoteInfo = (categoryName) => {
    return rankedCategories.find(c => c.categoryName === categoryName) || { upvotes: 0, hasUpvoted: false };
  };

  const handleDelete = async (faqId) => {
    if (!confirm('Delete this FAQ permanently?')) return;
    const prev = faqs;
    setFaqs(prev => prev.filter(f => f._id !== faqId));
    try {
      await faqService.remove(faqId);
      refreshQP?.();
    } catch (err) {
      setFaqs(prev);
      alert(err.message || 'Failed to delete FAQ');
    }
  };

  const handleToggleTrending = async (faqId) => {
    const prev = faqs;
    setFaqs(prev => prev.map(f => f._id === faqId ? { ...f, isTrending: !f.isTrending } : f));
    try {
      await faqService.toggleTrendingFAQ(faqId);
    } catch { setFaqs(prev); }
  };

  const handleToggleReview = async (faqId) => {
    const prev = faqs;
    setFaqs(prev => prev.map(f => f._id === faqId ? { ...f, markedForReview: !f.markedForReview } : f));
    try {
      await faqService.reviewFAQ(faqId);
    } catch { setFaqs(prev); }
  };

  const totalPages = Math.ceil(total / limit);

  const sortOptions = [
    { value: 'upvotes', label: 'Most Upvoted' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
  ];

  // Group FAQs by category
  const faqsByCategory = {};
  faqs.forEach(faq => {
    const cat = faq.category || 'Uncategorized';
    if (!faqsByCategory[cat]) faqsByCategory[cat] = [];
    faqsByCategory[cat].push(faq);
  });

  return (
    <div className="page-container">
      <Breadcrumb items={[{ label: 'FAQs' }]} />

      {/* Hero Search Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              Knowledge Base
            </h1>
            <p className="page-subtitle mt-1">
              {total} FAQs curated by the community
            </p>
          </div>
          {isSeniorOrAdmin && (
            <Link to="/add-faq" className="btn-gradient-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add FAQ
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted/40" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search FAQs by question, answer, or tags..."
            className="w-full border border-border/60 rounded-2xl pl-12 pr-20 py-3.5 text-sm bg-white/80 backdrop-blur-sm
              placeholder:text-muted/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all shadow-card"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted bg-slate-100 px-2 py-1 rounded-lg font-mono hidden sm:block">/</div>
        </form>

        {/* Categories Horizontal Scroll */}
        <div className="mb-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</span>
            {category && (
              <button 
                onClick={() => { setCategory(''); setPage(1); }} 
                className="text-xs text-accent hover:underline font-semibold flex items-center gap-1"
              >
                Reset Filter
              </button>
            )}
          </div>
          
          <div className="relative flex items-center">
            {/* Left Button */}
            <button 
              onClick={() => scroll('left')}
              className="absolute -left-4 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:text-primary hover:bg-slate-50 transition-all duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scroll Container */}
            <div 
              ref={scrollRef}
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.preventDefault();
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              className="flex gap-3 overflow-x-auto pb-3 pt-1 -mx-4 px-4 scrollbar-none snap-x snap-mandatory scroll-smooth w-full"
            >
              <button
                onClick={() => { setCategory(''); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-200 cursor-pointer shrink-0 snap-center text-xs font-semibold ${
                  !category 
                    ? 'bg-gradient-to-r from-accent to-violet-600 border-accent/80 text-white shadow-md shadow-accent/10' 
                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <span>🌟</span>
                <span>All Categories</span>
              </button>
              {FAQ_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setPage(1); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-200 cursor-pointer shrink-0 snap-center text-xs font-semibold ${
                    category === cat 
                      ? 'bg-gradient-to-r from-accent to-violet-600 border-accent/80 text-white shadow-md shadow-accent/10' 
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <span>{categoryIcons[cat] || '📁'}</span>
                  <span>{cat}</span>
                </button>
              ))}
            </div>

            {/* Right Button */}
            <button 
              onClick={() => scroll('right')}
              className="absolute -right-4 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:text-primary hover:bg-slate-50 transition-all duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sort & Stats Row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-muted font-medium">
              Showing <span className="text-primary font-bold">{total}</span> FAQs
              {category && <span> in <span className="text-accent font-semibold">{category}</span></span>}
            </p>
            {isModeratorOrAbove && (
              <button
                onClick={() => setReviewOnTop(v => !v)}
                className={`btn-outline-sm flex items-center gap-1.5 transition-all duration-200 py-1 px-2.5 ${
                  reviewOnTop 
                    ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400 font-semibold' 
                    : 'hover:bg-slate-100 text-muted'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${reviewOnTop ? 'fill-amber-500 text-amber-600' : ''}`} />
                Review on Top
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted" />
            <div className="pill-group bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/40">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setPage(1); }}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all ${
                    sort === opt.value 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Requests Banner */}
      {isSeniorOrAdmin && conversionRequests.length > 0 && (
        <div className="card p-4 mb-6 border-l-4 border-l-accent bg-accent-50/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
            </div>
            <span className="text-sm font-bold text-primary">FAQ Conversion Requests</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-accent-200 text-accent-800 rounded-full">{conversionRequests.length}</span>
          </div>
          <div className="space-y-2">
            {conversionRequests.map(req => (
              <div key={req._id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-border/60 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary truncate">{req.rtqId?.question || 'Unknown RTQ'}</p>
                  <p className="text-xs text-muted mt-0.5">Requested by {req.requestedBy?.name} — {timeAgo(req.createdAt)}</p>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <button onClick={() => faqService.approveConversion(req._id).then(load)} className="btn-success-sm text-xs">Approve</button>
                  <button onClick={() => faqService.rejectConversion(req._id).then(load)} className="btn-outline-sm text-xs">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : faqs.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No FAQs found"
          description={search ? `No results for "${search}". Try a different search term.` : 'The knowledge base is empty. FAQs will appear here as they are published.'}
          actionLabel={isSeniorOrAdmin ? 'Add FAQ' : undefined}
          actionTo={isSeniorOrAdmin ? '/add-faq' : undefined}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(faqsByCategory).map(([catName, catFaqs]) => {
            const catInfo = getCategoryUpvoteInfo(catName);
            const processedFaqs = reviewOnTop
              ? [
                  ...catFaqs.filter(f => f.markedForReview),
                  ...catFaqs.filter(f => !f.markedForReview)
                ]
              : catFaqs;
            return (
              <div key={catName}>
                {/* Category Header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <h2 className="text-base font-bold text-primary gradient-underline">{catName}</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-muted rounded-full">{catFaqs.length}</span>
                  {catName !== 'Uncategorized' && (
                    <button
                      onClick={() => handleCategoryUpvote(catName)}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all border ${
                        catInfo.hasUpvoted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-sm shadow-emerald-50'
                          : 'bg-white text-muted border-slate-200/60 hover:bg-slate-50 hover:text-primary hover:border-slate-300'
                      }`}
                      title={catInfo.hasUpvoted ? 'Remove category upvote' : 'Upvote this category'}
                    >
                      <ArrowBigUp className={`w-3.5 h-3.5 ${catInfo.hasUpvoted ? 'fill-emerald-600' : ''}`} />
                      <span>{catInfo.upvotes}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {processedFaqs.map(faq => {
                    const isExpanded = expandedId === faq._id;
                    const hasUpvoted = faq.upvotedBy?.some(uid => (uid?._id || uid)?.toString() === user?._id?.toString());

                    return (
                      <div key={faq._id} className="card card-hover overflow-hidden">
                        {/* Question Row (always visible) */}
                        <div
                          className="flex items-start gap-4 p-5 cursor-pointer select-none"
                          onClick={() => setExpandedId(isExpanded ? null : faq._id)}
                        >
                          <UpvoteButton
                            upvotes={faq.upvotes}
                            onUpvote={() => handleUpvote(faq._id)}
                            hasUpvoted={hasUpvoted}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-primary leading-snug mb-1.5">{faq.question}</h3>
                            <div className="flex items-center gap-2 flex-wrap text-xs text-muted">
                              {faq.addedBy && (
                                <span className="flex items-center gap-1">
                                  <Avatar name={faq.addedBy.name} role={faq.addedBy.role} size="xs" />
                                  {faq.addedBy.name}
                                </span>
                              )}
                              <span>&middot;</span>
                              <span>{timeAgo(faq.createdAt)}</span>
                              <span>&middot;</span>
                              <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{faq.views || 0}</span>
                            </div>
                            {faq.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {faq.tags.map(tag => (
                                  <span key={tag} className="text-xs bg-accent-50 text-accent-600 px-2 py-0.5 rounded-md font-medium">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {faq.isTrending && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-lg font-semibold border border-orange-200">
                                🔥 Trending
                              </span>
                            )}
                            {faq.markedForReview && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg font-semibold border border-amber-200">
                                ⚠ Review
                              </span>
                            )}
                            <div className="text-muted transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Expandable Answer */}
                        <div className={`accordion-content ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="px-5 pb-5 pt-0 border-t border-border/50">
                            <div className="bg-slate-50/50 rounded-xl p-4 mt-3">
                              <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                            </div>

                            {/* Mod Actions */}
                            {isModeratorOrAbove && (
                              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                                {isSeniorOrAdmin && (
                                  <>
                                    <Link to={`/faq/edit/${faq._id}`} className="btn-icon-sm" title="Edit FAQ">
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Link>
                                    <button onClick={() => handleDelete(faq._id)} className="btn-icon-sm hover:!text-red-500 hover:!bg-red-50" title="Delete FAQ">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleToggleTrending(faq._id)}
                                  className={`btn-icon-sm ${faq.isTrending ? '!text-orange-500 !bg-orange-50' : ''}`}
                                  title={faq.isTrending ? 'Remove trending' : 'Mark trending'}
                                >
                                  <TrendingIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleReview(faq._id)}
                                  className={`btn-icon-sm ${faq.markedForReview ? '!text-amber-500 !bg-amber-50' : ''}`}
                                  title={faq.markedForReview ? 'Unmark review' : 'Flag for review'}
                                >
                                  <Flag className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border/50">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-outline-sm disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum;
            if (totalPages <= 7) pageNum = i + 1;
            else if (page <= 4) pageNum = i + 1;
            else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
            else pageNum = page - 3 + i;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                  page === pageNum
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-muted hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-outline-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <BackToTop />
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
}
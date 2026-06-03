import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import faqService from '../services/faq.service';
import rtqService from '../services/rtq.service';
import { BookOpen, MessageCircle } from 'lucide-react';

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [faqResults, setFaqResults] = useState([]);
  const [rtqResults, setRtqResults] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setFaqResults([]);
      setRtqResults([]);
      return;
    }
    setLoading(true);
    try {
      const [faqs, rtqs] = await Promise.all([
        faqService.list({ sort: 'upvotes' }).catch(() => ({ grouped: {} })),
        rtqService.list({ sort: 'upvotes' }).catch(() => []),
      ]);

      const ql = q.toLowerCase();
      const faqItems = Object.values(faqs.grouped || {}).flat();
      const rtqItems = Array.isArray(rtqs) ? rtqs : (rtqs.data || []);

      setFaqResults(
        faqItems
          .filter(f => f.question.toLowerCase().includes(ql) || f.answer.toLowerCase().includes(ql))
          .slice(0, 5)
      );
      setRtqResults(
        rtqItems
          .filter(r => r.question.toLowerCase().includes(ql))
          .slice(0, 5)
      );
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const go = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search FAQs and RTQs..."
            className="flex-1 bg-transparent text-primary placeholder-muted outline-none text-base"
          />
          {loading && (
            <svg className="w-4 h-4 animate-spin text-muted shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
            </svg>
          )}
          <kbd className="text-xs bg-surface px-1.5 py-0.5 rounded text-muted border border-border">Esc</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              Type to search FAQs and RTQs...
            </div>
          )}

          {query.trim() && !loading && faqResults.length === 0 && rtqResults.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              No results for "{query}"
            </div>
          )}

          {faqResults.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wide bg-surface">FAQs</div>
              {faqResults.map(faq => (
                <button
                  key={faq._id}
                  onClick={() => go('/faq')}
                  className="w-full px-4 py-3 text-left hover:bg-surface flex items-start gap-3"
                >
                  <BookOpen className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{faq.question}</p>
                    <p className="text-xs text-muted truncate">{faq.answer}</p>
                    <p className="text-xs text-muted mt-0.5">{faq.category} • {faq.upvotes} upvotes</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {rtqResults.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wide bg-surface">RTQs</div>
              {rtqResults.map(rtq => (
                <button
                  key={rtq._id}
                  onClick={() => go(`/rtq/${rtq._id}`)}
                  className="w-full px-4 py-3 text-left hover:bg-surface flex items-start gap-3"
                >
                  <MessageCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{rtq.question}</p>
                    <p className="text-xs text-muted mt-0.5">{rtq.category} • {rtq.answers?.length || 0} answers</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

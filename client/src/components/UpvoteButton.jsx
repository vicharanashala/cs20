import { useState } from 'react';
import { ArrowBigUp } from 'lucide-react';
import { cn } from '../utils/helpers';

function UpvoteSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
    </svg>
  );
}

export default function UpvoteButton({ upvotes, onUpvote, hasUpvoted }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await onUpvote();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
        hasUpvoted
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-surface text-muted border border-border hover:bg-slate-100 hover:text-primary'
      )}
    >
      {loading ? <UpvoteSpinner /> : <ArrowBigUp className={cn('w-4 h-4', hasUpvoted && 'fill-green-600')} />}
      <span>{upvotes || 0}</span>
    </button>
  );
}
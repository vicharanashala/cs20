import { useState } from 'react';
import { ArrowBigUp } from 'lucide-react';

export default function UpvoteButton({ upvotes, onUpvote, hasUpvoted, disabled }) {
  const [animating, setAnimating] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    setAnimating(true);
    onUpvote?.();
    setTimeout(() => setAnimating(false), 350);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all duration-200 group
        ${hasUpvoted
          ? 'bg-accent-50 text-accent-600 border border-accent-200 shadow-sm'
          : 'text-muted border border-transparent hover:bg-slate-100 hover:text-primary'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={hasUpvoted ? 'Remove upvote' : 'Upvote'}
    >
      <ArrowBigUp
        className={`w-5 h-5 transition-all duration-200
          ${hasUpvoted ? 'fill-accent-500 text-accent-500' : 'group-hover:text-accent-500'}
          ${animating ? 'upvote-bounce' : ''}
        `}
      />
      <span className={`text-xs font-bold ${hasUpvoted ? 'text-accent-600' : ''}`}>
        {upvotes}
      </span>
    </button>
  );
}
import { Zap } from 'lucide-react';

export default function QPBadge({ qp, animate = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg
        ${sizeClasses[size] || sizeClasses.md}
        ${animate ? 'qp-glow bg-accent-100 text-accent-700' : 'bg-gradient-to-r from-accent-50 to-violet-50 text-accent-700 border border-accent-200/50'}
        transition-all duration-300`}
    >
      <Zap className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} fill-accent-500 text-accent-500`} />
      {qp}
      <span className={`font-medium text-accent-500 ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>QP</span>
    </div>
  );
}

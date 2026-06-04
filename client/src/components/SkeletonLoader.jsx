export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-5 space-y-3 ${className}`}>
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full skeleton-shimmer shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton-shimmer rounded-lg w-3/4" />
          <div className="h-3 skeleton-shimmer rounded-lg w-1/2" />
        </div>
        <div className="w-16 h-8 skeleton-shimmer rounded-lg shrink-0" />
      </div>
      <div className="h-3 skeleton-shimmer rounded-lg w-full" />
      <div className="h-3 skeleton-shimmer rounded-lg w-5/6" />
    </div>
  );
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={`flex items-center gap-4 p-4 ${className}`}>
      <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 skeleton-shimmer rounded-lg w-3/4" />
        <div className="h-2.5 skeleton-shimmer rounded-lg w-1/2" />
      </div>
      <div className="w-12 h-6 skeleton-shimmer rounded-lg shrink-0" />
    </div>
  );
}

export function SkeletonStat({ className = '' }) {
  return (
    <div className={`card-padded space-y-2 ${className}`}>
      <div className="h-3 skeleton-shimmer rounded w-20" />
      <div className="h-8 skeleton-shimmer rounded-lg w-16" />
      <div className="h-2.5 skeleton-shimmer rounded w-24" />
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  return <div className={`${sizes[size] || sizes.md} rounded-full skeleton-shimmer shrink-0 ${className}`} />;
}

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={`${sizes[size] || sizes.md} animate-spin ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-20" />
        <path d="M12 2a10 10 0 019.5 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-accent" />
      </svg>
    </div>
  );
}
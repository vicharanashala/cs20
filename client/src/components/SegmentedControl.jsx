export default function SegmentedControl({ options, value, onChange, className = '' }) {
  return (
    <div className={`segmented-control ${className}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={value === opt.value ? 'segmented-active' : 'segmented-item'}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
              value === opt.value
                ? 'bg-accent-100 text-accent-700'
                : 'bg-slate-200 text-muted'
            }`}>
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted mb-4">
      <Link to="/dashboard" className="hover:text-primary">Home</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-slate-300">›</span>
          {item.to && i < items.length - 1 ? (
            <Link to={item.to} className="hover:text-primary">{item.label}</Link>
          ) : (
            <span className="text-primary font-medium truncate max-w-[200px]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
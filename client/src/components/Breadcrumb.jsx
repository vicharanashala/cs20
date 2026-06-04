import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted mb-5" aria-label="Breadcrumb">
      <Link to="/dashboard" className="hover:text-primary transition-colors p-0.5">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          {item.to ? (
            <Link to={item.to} className="hover:text-primary transition-colors font-medium">
              {item.label}
            </Link>
          ) : (
            <span className="text-primary font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
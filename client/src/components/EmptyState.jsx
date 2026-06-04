import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction, className = '' }) {
  return (
    <div className={`empty-state ${className}`}>
      {Icon && (
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
          <Icon className="empty-state-icon !w-10 !h-10 !mb-0 text-slate-400" />
        </div>
      )}
      {title && <h3 className="empty-state-title">{title}</h3>}
      {description && <p className="empty-state-desc mt-1">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-gradient-sm mt-5">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button onClick={onAction} className="btn-gradient-sm mt-5">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

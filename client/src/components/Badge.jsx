import { CheckCircle, XCircle, AlertTriangle, Clock, Circle } from 'lucide-react';

export function StatusBadge({ status }) {
  const map = {
    resolved:       { label: 'Resolved',          icon: CheckCircle, className: 'badge-success' },
    partially_resolved: { label: 'Partially Resolved', icon: Clock,       className: 'badge-warning' },
    unresolved:     { label: 'Unresolved',         icon: Circle,      className: 'badge-danger' },
    rejected:       { label: 'Rejected',           icon: XCircle,    className: 'badge-danger' },
    trending:       { label: 'Trending',           icon: CheckCircle, className: 'badge-info' },
    markedForReview:{ label: 'Flagged',            icon: AlertTriangle, className: 'badge-warning' },
    approved:       { label: 'Approved',           icon: CheckCircle, className: 'badge-success' },
    pending:        { label: 'Pending',            icon: Clock,       className: 'badge-warning' },
  };

  const config = map[status] || { label: status, icon: Circle, className: 'badge-neutral' };
  const Icon = config.icon;

  return (
    <span className={config.className}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export function RoleBadge({ role }) {
  const map = {
    student:   { label: 'Student',   className: 'badge-student' },
    moderator: { label: 'Moderator', className: 'badge-moderator' },
    senior:    { label: 'Senior',    className: 'badge-senior' },
    admin:     { label: 'Admin',     className: 'badge-admin' },
  };

  const config = map[role] || { label: role, className: 'badge-neutral' };
  return <span className={config.className}>{config.label}</span>;
}

export function BoolBadge({ value, trueLabel = 'Yes', falseLabel = 'No' }) {
  return value
    ? <span className="badge-success">{trueLabel}</span>
    : <span className="badge-neutral">{falseLabel}</span>;
}

export function CountBadge({ count, label }) {
  if (!count && count !== 0) return null;
  return (
    <span className="badge-neutral">
      {label ? `${count} ${label}` : count}
    </span>
  );
}
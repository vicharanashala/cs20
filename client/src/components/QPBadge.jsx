import { formatQP } from '../utils/helpers';

export default function QPBadge({ qp, size = 'md' }) {
  // ✅ FIX #6: was (qp >= 0) which made 0 QP show green (+0 QP)
  // Now: positive = green, zero = grey, negative = red
  const colorClass =
    qp > 0 ? 'bg-green-50 text-green-700' :
    qp < 0 ? 'bg-red-50 text-red-600' :
    'bg-slate-100 text-slate-500';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg px-2 py-0.5 ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      } ${colorClass}`}
    >
      {formatQP(qp)} QP
    </span>
  );
}

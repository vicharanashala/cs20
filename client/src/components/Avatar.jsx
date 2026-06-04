import { useMemo } from 'react';

const ROLE_COLORS = {
  student:   'bg-slate-500',
  moderator: 'bg-blue-600',
  senior:    'bg-purple-600',
  admin:     'bg-violet-600',
};

const ROLE_GRADIENTS = {
  student:   'from-slate-400 to-slate-600',
  moderator: 'from-blue-500 to-blue-700',
  senior:    'from-purple-500 to-violet-600',
  admin:     'from-violet-500 to-purple-700',
};

const SIZE_CLASSES = {
  xs:  'avatar-xs',
  sm:  'avatar-sm',
  md:  'avatar-md',
  lg:  'avatar-lg',
  xl:  'avatar-xl',
};

export default function Avatar({ name, role, size = 'md', className = '', gradient = false }) {
  const initial = useMemo(() => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }, [name]);

  const bgClass = gradient
    ? `bg-gradient-to-br ${ROLE_GRADIENTS[role] || ROLE_GRADIENTS.student}`
    : ROLE_COLORS[role] || ROLE_COLORS.student;

  return (
    <div
      className={`${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${bgClass} ${className}`}
      title={name || 'User'}
    >
      {initial}
    </div>
  );
}

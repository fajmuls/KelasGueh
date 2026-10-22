import React from 'react';

interface InitialAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const PASTEL_COLORS = [
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
];

export const InitialAvatar: React.FC<InitialAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base font-bold',
  }[size];

  if (avatarUrl && avatarUrl.startsWith('http') && !avatarUrl.includes('placeholder')) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover border border-slate-200 shadow-2xs ${className}`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Fallback to initial avatar if image fails
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // Generate deterministic initials
  const parts = name.trim().split(' ');
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (name.slice(0, 2) || 'MA').toUpperCase();

  // Pick deterministic color based on name string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorClass = PASTEL_COLORS[Math.abs(hash) % PASTEL_COLORS.length];

  return (
    <div
      className={`${sizeClasses} rounded-full font-bold flex items-center justify-center border shadow-2xs select-none shrink-0 ${colorClass} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};

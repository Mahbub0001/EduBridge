import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  shape?: 'circle' | 'rounded';
  border?: boolean;
}

const COLOR_PALETTES = [
  'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white',
  'bg-gradient-to-tr from-teal-600 to-emerald-500 text-white',
  'bg-gradient-to-tr from-sky-600 to-cyan-500 text-white',
  'bg-gradient-to-tr from-rose-600 to-pink-500 text-white',
  'bg-gradient-to-tr from-amber-600 to-orange-500 text-white',
  'bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white',
  'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white',
  'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white',
  'bg-gradient-to-tr from-violet-600 to-purple-500 text-white',
];

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  if (email && email.trim()) {
    const username = email.split('@')[0];
    return username.slice(0, 2).toUpperCase();
  }
  return 'U';
}

function getColorIndex(str?: string | null): number {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % COLOR_PALETTES.length;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl font-black',
};

export default function UserAvatar({
  src,
  name,
  email,
  size = 'md',
  className,
  shape = 'circle',
  border = false,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error whenever image src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = getInitials(name, email);
  const colorClass = COLOR_PALETTES[getColorIndex(name || email || 'default')];
  const sizeClass = SIZE_CLASSES[size];
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  // If valid src and not failed to load
  const canShowImage = Boolean(src && typeof src === 'string' && src.trim() !== '' && !hasError);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden font-extrabold shadow-2xs transition-transform duration-150',
        sizeClass,
        shapeClass,
        border && 'ring-2 ring-white dark:ring-slate-900',
        !canShowImage && colorClass,
        className
      )}
    >
      {canShowImage ? (
        <img
          src={src as string}
          alt=""
          onError={() => setHasError(true)}
          className={cn('w-full h-full object-cover select-none', shapeClass)}
          loading="lazy"
        />
      ) : (
        <span className="tracking-wider leading-none">{initials}</span>
      )}
    </div>
  );
}

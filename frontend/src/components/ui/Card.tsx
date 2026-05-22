import { cn } from '../../lib/utils';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({ className, padding = 'md', children, ...props }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800', paddings[padding], className)} {...props}>
      {children}
    </div>
  );
}

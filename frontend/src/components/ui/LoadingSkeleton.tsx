import { cn } from '../../lib/utils';

const D = 'div';

function Bone({ className }: { className?: string }) {
  return <D className={cn('animate-pulse rounded-xl bg-slate-200', className)} />;
}

export interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'list' | 'stat';
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({ variant = 'card', count = 1, className }: LoadingSkeletonProps) {
  const items = Array.from({ length: count });

  if (variant === 'stat') {
    return (
      <D className={cn('grid grid-cols-2 gap-4', className)}>
        {items.map((_, i) => (
          <D key={i} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <Bone className="h-12 w-12 rounded-2xl" />
            <Bone className="h-8 w-20" />
            <Bone className="h-3 w-28" />
          </D>
        ))}
      </D>
    );
  }

  if (variant === 'table') {
    return (
      <D className={cn('bg-white rounded-2xl border border-slate-200 overflow-hidden', className)}>
        <D className="p-4 border-b border-slate-200 flex gap-4">
          <Bone className="h-4 flex-1" />
          <Bone className="h-4 flex-1" />
          <Bone className="h-4 w-24" />
        </D>
        {items.map((_, i) => (
          <D key={i} className="p-4 border-b border-slate-100 flex gap-4 items-center">
            <Bone className="h-4 flex-1" />
            <Bone className="h-4 flex-1" />
            <Bone className="h-6 w-16 rounded-full" />
          </D>
        ))}
      </D>
    );
  }

  if (variant === 'list') {
    return (
      <D className={cn('space-y-3', className)}>
        {items.map((_, i) => (
          <D key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-200">
            <Bone className="h-12 w-12 rounded-xl shrink-0" />
            <D className="flex-1 space-y-2">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </D>
          </D>
        ))}
      </D>
    );
  }

  return (
    <D className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {items.map((_, i) => (
        <D key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <Bone className="h-44 w-full rounded-none" />
          <D className="p-6 space-y-3">
            <Bone className="h-4 w-24 rounded-full" />
            <Bone className="h-5 w-full" />
            <Bone className="h-3 w-2/3" />
            <Bone className="h-2 w-full mt-4" />
            <Bone className="h-10 w-full rounded-xl mt-2" />
          </D>
        </D>
      ))}
    </D>
  );
}

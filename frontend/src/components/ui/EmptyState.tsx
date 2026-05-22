import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';
import Card from './Card';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('text-center py-16 px-8', className)}>
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
        <Icon className="text-slate-300" size={32} />
      </div>
      <h3 className="text-lg font-extrabold text-slate-900 mt-6">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}

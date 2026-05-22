import { cn } from '../../lib/utils';

export default function ProgressBar({
  value,
  className,
  showLabel,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-bold text-slate-500">
          <span>Progress</span>
          <span className="text-slate-900">{value}%</span>
        </div>
      )}
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className="bg-teal-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

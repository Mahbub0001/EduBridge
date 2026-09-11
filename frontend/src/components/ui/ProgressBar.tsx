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
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>Progress</span>
          <span className="text-slate-900 dark:text-teal-400 font-extrabold">{clamped}%</span>
        </div>
      )}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            clamped >= 100
              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
              : "bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-400 dark:from-teal-500 dark:to-cyan-400"
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

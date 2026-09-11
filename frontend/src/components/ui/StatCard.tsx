import type { LucideIcon } from 'lucide-react';
import Card from './Card';
import { cn } from '../../lib/utils';

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn(
      "group relative overflow-hidden flex flex-col justify-between min-h-[140px] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 dark:hover:shadow-teal-950/20 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1 transition-all duration-300",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm",
          iconBg,
          "dark:bg-slate-800"
        )}>
          <Icon className={cn(iconColor, "transition-colors duration-300")} size={22} />
        </div>
        {trend && (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
            {trend}
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-200">
          {value}
        </div>
        <div className="text-[11px] tracking-wider text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">
          {label}
        </div>
      </div>
    </Card>
  );
}

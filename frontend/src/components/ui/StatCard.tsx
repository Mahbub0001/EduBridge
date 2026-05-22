import type { LucideIcon } from 'lucide-react';
import Card from './Card';
import { cn } from '../../lib/utils';

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col justify-between min-h-[140px] transition-all duration-300 hover:shadow-md hover:border-slate-350", className)}>
      <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center`}>
        <Icon className={iconColor} size={20} />
      </div>
      <div className="mt-4">
        <div className="text-2xl font-black text-slate-900">{value}</div>
        <div className="text-[10px] tracking-wider text-slate-500 font-extrabold uppercase mt-1">{label}</div>
      </div>
    </Card>
  );
}

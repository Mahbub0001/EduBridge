import { Calendar, Clock } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import Badge from './Badge';
import Card from './Card';
import type { CalendarEvent } from '../../types';

const D = 'div';

const typeVariants: Record<CalendarEvent['type'], { badge: 'info' | 'warning' | 'success'; border: string }> = {
  quiz: { badge: 'info', border: 'border-l-teal-500' },
  assignment: { badge: 'warning', border: 'border-l-rose-500' },
  workshop: { badge: 'success', border: 'border-l-blue-500' },
};

export interface CalendarCardProps {
  event: CalendarEvent & { time?: string };
  className?: string;
  onClick?: () => void;
}

export default function CalendarCard({ event, className, onClick }: CalendarCardProps) {
  const d = new Date(event.date);
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const style = typeVariants[event.type];

  return (
    <Card
      padding="none"
      className={cn(
        'p-4 border-l-4 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-4 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors',
        style.border,
        className
      )}
      onClick={onClick}
    >
      <D className="bg-white dark:bg-slate-900 rounded-xl py-1.5 px-3 border border-slate-200 dark:border-slate-800 text-center shadow-sm shrink-0">
        <D className="text-[9px] font-black text-rose-600 tracking-wider leading-none">{month}</D>
        <D className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1">{day}</D>
      </D>
      <D className="flex-1 min-w-0 space-y-1">
        <D className="flex items-center gap-2 flex-wrap">
          <Badge variant={style.badge} className="capitalize">
            {event.type}
          </Badge>
          {event.course && <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{event.course}</span>}
        </D>
        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">{event.title}</h4>
        <D className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(event.date)}
          </span>
          {event.time && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {event.time}
            </span>
          )}
        </D>
      </D>
    </Card>
  );
}

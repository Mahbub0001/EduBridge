import { useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import type { Notification } from '../../types';

const D = 'div';

export interface NotificationDropdownProps {
  notifications: Notification[];
  open: boolean;
  onClose: () => void;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  className?: string;
}

export default function NotificationDropdown({
  notifications,
  open,
  onClose,
  onMarkRead,
  onMarkAllRead,
  className,
}: NotificationDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <D
      ref={ref}
      className={cn(
        'absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden dark:bg-slate-900 dark:border-slate-800',
        className
      )}
    >
      <D className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/80">
        <D className="flex items-center gap-2">
          <Bell size={16} className="text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-navy-900 text-white text-[10px] font-bold dark:bg-teal-600">
              {unreadCount}
            </span>
          )}
        </D>
        {unreadCount > 0 && onMarkAllRead && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[10px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1"
          >
            <Check size={12} />
            Mark all read
          </button>
        )}
      </D>
      <D className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <D className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">No notifications yet</D>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onMarkRead?.(n.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800 transition-colors',
                !n.read && 'bg-navy-50/30 dark:bg-teal-950/20'
              )}
            >
              <D className="flex gap-3">
                <D className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', n.read ? 'bg-slate-300 dark:bg-slate-700' : 'bg-navy-900 dark:bg-teal-500')} />
                <D className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 line-clamp-1 dark:text-white">{n.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 dark:text-slate-300">{n.message}</p>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block dark:text-slate-500">
                    {formatDate(n.created_at)}
                  </span>
                </D>
              </D>
            </button>
          ))
        )}
      </D>
    </D>
  );
}

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
        'absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden',
        className
      )}
    >
      <D className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/80">
        <D className="flex items-center gap-2">
          <Bell size={16} className="text-slate-500" />
          <span className="text-sm font-extrabold text-slate-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-navy-900 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </D>
        {unreadCount > 0 && onMarkAllRead && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <Check size={12} />
            Mark all read
          </button>
        )}
      </D>
      <D className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <D className="p-8 text-center text-sm text-slate-500">No notifications yet</D>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onMarkRead?.(n.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors',
                !n.read && 'bg-navy-50/30'
              )}
            >
              <D className="flex gap-3">
                <D className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', n.read ? 'bg-slate-300' : 'bg-navy-900')} />
                <D className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 line-clamp-1">{n.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">
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

import { Link, useLocation } from 'react-router-dom';
import { HelpCircle, LogOut, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

const D = 'div';

export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

const defaultNavItems: NavItem[] = [];

export interface SidebarProps {
  navItems?: NavItem[];
  onLogout?: () => void;
  helpPath?: string;
  onNavigate?: () => void;
  className?: string;
}

export default function Sidebar({
  navItems = defaultNavItems,
  onLogout,
  helpPath = '/student/help',
  onNavigate,
  className,
}: SidebarProps) {
  const location = useLocation();

  return (
    <D className={cn('w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 dark:bg-slate-900 dark:border-slate-800', className)}>
      <D className="h-20 flex items-center px-8 border-b border-slate-200 dark:border-slate-800">
        <Link to="/" className="text-2xl font-extrabold text-slate-900 tracking-tight dark:text-white" onClick={onNavigate}>
          EduBridge
        </Link>
      </D>

      <D className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium',
                isActive
                  ? 'bg-navy-900 text-white shadow-sm dark:bg-teal-600 dark:text-white'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              )}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
              {item.name}
            </Link>
          );
        })}

        <D className="border-t border-slate-200 my-4 pt-4 dark:border-slate-800">
          <Link
            to={helpPath}
            onClick={onNavigate}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <HelpCircle size={18} className="text-slate-500 dark:text-slate-400" />
            Help Center
          </Link>
        </D>
      </D>

      {onLogout && (
        <D className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </D>
      )}
    </D>
  );
}

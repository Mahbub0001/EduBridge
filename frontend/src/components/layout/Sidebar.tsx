import { Link, useLocation } from 'react-router-dom';
import { HelpCircle, LogOut, GraduationCap, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../utils/translations';

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
  const { t } = useTranslation();

  const keyMap: Record<string, string> = {
    'Dashboard': 'dashboard',
    'My Courses': 'myCourses',
    'Calendar': 'calendar',
    'Resources': 'resources',
    'Assignments': 'assignments',
    'Settings': 'settings',
  };

  return (
    <D className={cn('w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 dark:bg-slate-900 dark:border-slate-800/80 shadow-xs', className)}>
      <D className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/80">
        <Link to="/" className="flex items-center gap-2.5 text-slate-900 dark:text-white group" onClick={onNavigate}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy-900 to-teal-600 dark:from-teal-600 dark:to-cyan-400 flex items-center justify-center text-white shadow-md shadow-teal-900/10 group-hover:scale-105 transition-transform duration-200">
            <GraduationCap size={22} />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight block leading-none">EduBridge</span>
            <span className="text-[10px] tracking-widest uppercase font-bold text-teal-600 dark:text-teal-400 block mt-0.5">Platform</span>
          </div>
        </Link>
      </D>

      <D className="flex-1 overflow-y-auto py-6 px-3.5 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          const Icon = item.icon;
          const translationKey = keyMap[item.name] || item.name;
          const displayName = t(translationKey as any);
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold relative',
                isActive
                  ? 'bg-navy-900 text-white shadow-sm dark:bg-teal-600 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'
              )}
            >
              <Icon size={18} className={isActive ? 'text-teal-400 dark:text-white' : 'text-slate-400 dark:text-slate-400'} />
              <span>{displayName}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 dark:bg-white animate-pulse" />
              )}
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
            {t('helpCenter')}
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
            {t('logout')}
          </button>
        </D>
      )}
    </D>
  );
}

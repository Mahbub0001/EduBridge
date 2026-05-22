import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, variant = 'underline', className }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-bold transition-all',
                isActive
                  ? 'bg-navy-900 text-white shadow-sm dark:bg-teal-600 dark:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-850 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn('ml-1.5', isActive ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500')}>
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('border-b border-slate-200 flex gap-8 dark:border-slate-800', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'pb-4 text-sm font-bold border-b-2 capitalize transition-all -mb-px',
              isActive
                ? 'border-navy-900 text-slate-900 dark:border-teal-500 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn('ml-1.5 text-xs', isActive ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500')}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

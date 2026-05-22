import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const D = 'div';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export default function Accordion({ items, allowMultiple = false, defaultOpen = [], className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpen);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return allowMultiple ? [...prev, id] : [id];
    });
  };

  return (
    <D className={cn('space-y-2', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <D key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{item.title}</span>
              <ChevronDown
                size={18}
                className={cn('text-slate-500 dark:text-slate-400 transition-transform shrink-0', isOpen && 'rotate-180')}
              />
            </button>
            {isOpen && (
              <D className="px-6 pb-4 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-4">{item.content}</D>
            )}
          </D>
        );
      })}
    </D>
  );
}

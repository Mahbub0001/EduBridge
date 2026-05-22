import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 flex-wrap dark:text-slate-400">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={14} className="text-slate-400 dark:text-slate-500" />}
          {item.href ? (
            <Link to={item.href} className="hover:text-navy-900 transition-colors dark:hover:text-white">
              {item.label}
            </Link>
          ) : (
            <span className="text-navy-900 font-bold dark:text-teal-400">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

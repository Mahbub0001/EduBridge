import type { ReactNode } from 'react';

export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-black text-navy-900 dark:text-white">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

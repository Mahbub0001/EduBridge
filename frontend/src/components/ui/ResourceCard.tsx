import { Download, ExternalLink, FileText, Film, Presentation } from 'lucide-react';
import { cn } from '../../lib/utils';
import Badge from './Badge';
import Button from './Button';
import Card from './Card';
import type { Resource } from '../../types';

const D = 'div';

const typeConfig = {
  pdf: { icon: FileText, label: 'PDF', color: 'bg-rose-50 text-rose-600' },
  video: { icon: Film, label: 'Video', color: 'bg-blue-50 text-blue-600' },
  slides: { icon: Presentation, label: 'Slides', color: 'bg-purple-50 text-purple-600' },
  link: { icon: ExternalLink, label: 'Link', color: 'bg-teal-50 text-teal-600' },
};

export interface ResourceCardProps {
  resource: Resource;
  description?: string;
  onDownload?: (id: string) => void;
  className?: string;
}

export default function ResourceCard({ resource, description, onDownload, className }: ResourceCardProps) {
  const config = typeConfig[resource.type];
  const Icon = config.icon;

  return (
    <Card className={cn('flex flex-col justify-between min-h-[220px] group hover:border-slate-300 transition-colors', className)}>
      <D className="space-y-4">
        <D className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', config.color)}>
          <Icon size={20} />
        </D>
        <D>
          <Badge variant="default" className="mb-2">
            {config.label}
          </Badge>
          <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-navy-900 transition-colors">
            {resource.title}
          </h3>
          {description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{description}</p>}
          {resource.course_name && (
            <p className="text-[10px] text-slate-400 font-semibold mt-2">{resource.course_name}</p>
          )}
        </D>
      </D>
      <D className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200">
        <span className="text-xs font-bold text-slate-500">{resource.size || '—'}</span>
        <Button variant="outline" size="sm" onClick={() => onDownload?.(resource.id)}>
          {resource.type === 'link' ? (
            <>
              <ExternalLink size={14} /> Open
            </>
          ) : (
            <>
              <Download size={14} /> Download
            </>
          )}
        </Button>
      </D>
    </Card>
  );
}

import { Award, Download, Share2 } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import Button from './Button';
import Card from './Card';

const D = 'div';

export interface CertificateCardProps {
  courseTitle: string;
  completedOn: string;
  grade?: number;
  credentialId?: string;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export default function CertificateCard({
  courseTitle,
  completedOn,
  grade,
  credentialId,
  onDownload,
  onShare,
  className,
}: CertificateCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950 text-white border-0',
        className
      )}
    >
      <D className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] pointer-events-none" />
      <D className="relative z-10 space-y-6">
        <D className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
          <Award className="text-teal-500" size={28} />
        </D>
        <D>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">Certificate of Completion</p>
          <h3 className="text-lg font-extrabold mt-2 leading-snug">{courseTitle}</h3>
          <D className="flex flex-wrap gap-4 mt-3 text-xs text-slate-300">
            <span>Completed {formatDate(completedOn)}</span>
            {grade !== undefined && <span className="font-bold text-teal-500">Grade: {grade}%</span>}
            {credentialId && <span className="font-mono opacity-70">ID: {credentialId}</span>}
          </D>
        </D>
        <D className="flex gap-2 pt-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onDownload}>
            <Download size={14} />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
            onClick={onShare}
          >
            <Share2 size={14} />
            Share
          </Button>
        </D>
      </D>
    </Card>
  );
}

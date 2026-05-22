import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import Button from './Button';
import Card from './Card';
import type { Assignment } from '../../types';

const D = 'div';

const statusStyles = {
  pending: { border: 'border-l-rose-500', label: 'Pending Submission', icon: AlertCircle, color: 'text-rose-500 dark:text-rose-400' },
  submitted: { border: 'border-l-amber-500', label: 'Submitted', icon: CheckCircle2, color: 'text-amber-600 dark:text-amber-400' },
  graded: { border: 'border-l-emerald-500', label: 'Graded', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
};

export interface AssignmentCardProps {
  assignment: Assignment;
  onSubmit?: (id: string) => void;
  onViewFeedback?: (id: string) => void;
  className?: string;
}

export default function AssignmentCard({ assignment, onSubmit, onViewFeedback, className }: AssignmentCardProps) {
  const style = statusStyles[assignment.status];
  const StatusIcon = style.icon;

  return (
    <Card
      padding="md"
      className={cn('border-l-4 flex flex-col justify-between min-h-[200px]', style.border, className)}
    >
      <D className="space-y-3">
        <D className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-500 font-bold dark:text-slate-400">{assignment.course_name}</span>
          <span className={cn('inline-flex items-center gap-1 font-extrabold', style.color)}>
            <StatusIcon size={14} />
            {style.label}
          </span>
        </D>
        <h3 className="font-extrabold text-slate-900 text-base leading-snug dark:text-white">{assignment.title}</h3>
        {assignment.subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{assignment.subtitle}</p>}
        <D className="flex items-center gap-4 text-xs text-slate-500 pt-2 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            Due: {formatDate(assignment.due_date)}
          </span>
          {assignment.grade && <span className="font-bold text-slate-700 dark:text-slate-300">{assignment.grade}</span>}
        </D>
      </D>
      <D className="border-t border-slate-200 pt-4 mt-6 flex justify-end dark:border-slate-800">
        {assignment.status === 'graded' ? (
          <Button variant="outline" size="sm" onClick={() => onViewFeedback?.(assignment.id)}>
            View Feedback
          </Button>
        ) : assignment.status === 'pending' ? (
          <Button variant="primary" size="sm" onClick={() => onSubmit?.(assignment.id)}>
            Submit Now
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled>
            Awaiting Grade
          </Button>
        )}
      </D>
    </Card>
  );
}

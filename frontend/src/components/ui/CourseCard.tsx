import { Clock, Play, User, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import Badge from './Badge';
import Button from './Button';
import ProgressBar from './ProgressBar';
import CourseThumbnail from './CourseThumbnail';
import type { Course } from '../../types';

export interface CourseCardProps {
  course: Pick<
    Course,
    'id' | 'title' | 'image' | 'thumbnail' | 'category' | 'progress' | 'instructor' | 'instructor_name' | 'status'
  > & {
    timeLeft?: string;
    categoryClassName?: string;
  };
  onResume?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

export default function CourseCard({ course, onResume, onClick, className }: CourseCardProps) {
  const image = course.image || course.thumbnail;
  const instructor = course.instructor_name || course.instructor || 'Instructor';
  const progress = course.progress ?? 0;
  const isCompleted = course.status === 'completed' || progress >= 100;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(course.id)}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(course.id);
        }
      }}
      className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:shadow-slate-900/5 dark:hover:shadow-teal-950/20 hover:border-teal-500/30 dark:hover:border-teal-500/30 hover:-translate-y-1.5 transition-all duration-300 group relative',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="h-44 overflow-hidden relative bg-slate-100 dark:bg-slate-800">
        <CourseThumbnail
          title={course.title}
          category={course.category}
          image={image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-50 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
        
        {course.category && (
          <div className="absolute top-3.5 left-3.5 z-10">
            <Badge variant="success" className={cn("backdrop-blur-md bg-emerald-500/90 text-white font-bold text-[11px] shadow-sm", course.categoryClassName)}>
              {course.category}
            </Badge>
          </div>
        )}

        {isCompleted && (
          <div className="absolute top-3.5 right-3.5 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
              <CheckCircle2 size={12} className="stroke-[3]" />
              Completed
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3.5">
        <div className="space-y-1.5">
          {course.timeLeft && (
            <div className="flex justify-end text-xs font-semibold">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                <Clock size={13} className="text-slate-400" />
                {course.timeLeft}
              </span>
            </div>
          )}
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {course.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <User size={13} className="text-slate-400" />
            <span className="font-medium">{instructor}</span>
          </p>
        </div>

        {!isCompleted && progress > 0 && (
          <div className="mt-1">
            <ProgressBar value={progress} showLabel />
          </div>
        )}

        <div className="mt-auto pt-2">
          <Button
            variant="primary"
            size="sm"
            className={cn(
              "w-full rounded-xl font-bold text-xs py-2.5 transition-all duration-200 flex items-center justify-center gap-2",
              isCompleted
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                : "bg-navy-900 hover:bg-navy-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white shadow-sm group-hover:shadow-md"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onResume?.(course.id);
            }}
          >
            <Play size={13} className={isCompleted ? "fill-slate-600 dark:fill-slate-300" : "fill-white"} />
            {isCompleted ? 'Review Course' : progress > 0 ? 'Resume Learning' : 'Start Course'}
          </Button>
        </div>
      </div>
    </div>
  );
}

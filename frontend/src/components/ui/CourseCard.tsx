import { Clock, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import Badge from './Badge';
import Button from './Button';
import ProgressBar from './ProgressBar';
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
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors group',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="h-44 overflow-hidden relative">
        {image ? (
          <img
            src={image}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-medium">
            No image
          </div>
        )}
        {course.category && (
          <div className="absolute top-4 left-4">
            <Badge variant="success" className={course.categoryClassName}>
              {course.category}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col gap-4">
        <div className="space-y-2">
          {course.timeLeft && (
            <div className="flex justify-end text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock size={14} />
                {course.timeLeft}
              </span>
            </div>
          )}
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-navy-900 dark:group-hover:text-teal-400 transition-colors">
            {course.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">By {instructor}</p>
        </div>

        {!isCompleted && progress > 0 && <ProgressBar value={progress} showLabel />}

        <Button
          variant="primary"
          size="sm"
          className="w-full rounded-xl mt-auto"
          onClick={(e) => {
            e.stopPropagation();
            onResume?.(course.id);
          }}
        >
          <Play size={14} className="fill-white" />
          {isCompleted ? 'Review Course' : 'Resume Learning'}
        </Button>
      </div>
    </div>
  );
}

import { Award, Sparkles, CheckCircle2, ArrowRight, X } from 'lucide-react';
import Button from './Button';


interface CourseCompletionModalProps {
  isOpen: boolean;
  courseTitle: string;
  onClose: () => void;
  onViewCertificate: () => void;
}

export default function CourseCompletionModal({
  isOpen,
  courseTitle,
  onClose,
  onViewCertificate,
}: CourseCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-center p-6 md:p-8 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Celebration Header Icon */}
        <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-teal-500 p-1 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
            <Award size={48} className="text-amber-500 animate-bounce" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-pulse" size={24} />
          <Sparkles className="absolute -bottom-1 -left-2 text-teal-400 animate-pulse" size={20} />
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <CheckCircle2 size={14} /> 100% COURSE COMPLETED
          </div>
          <h2 className="text-2xl font-extrabold text-navy-950 dark:text-white tracking-tight">
            Congratulations! 🎉
          </h2>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-2">
            You have successfully completed <span className="text-teal-600 dark:text-teal-400 font-extrabold">"{courseTitle}"</span>!
          </p>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          Your official certificate of achievement has been generated and added to your profile.
        </p>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full justify-center !bg-navy-900 dark:!bg-teal-600 dark:!text-white shadow-md gap-2 font-bold"
            onClick={() => {
              onClose();
              onViewCertificate();
            }}
          >
            <Award size={18} /> View & Print Certificate <ArrowRight size={16} />
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-full justify-center text-xs"
            onClick={onClose}
          >
            Continue Learning
          </Button>
        </div>

      </div>
    </div>
  );
}

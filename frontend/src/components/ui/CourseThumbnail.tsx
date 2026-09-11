import { useState } from 'react';
import {
  Brain,
  ShieldCheck,
  Database,
  Code2,
  Terminal,
  Cloud,
  Smartphone,
  TrendingUp,
  Palette,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface CourseThumbnailProps {
  title?: string;
  category?: string;
  image?: string;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

interface ThemeConfig {
  icon: LucideIcon;
  gradient: string;
  accent: string;
  label?: string;
}

function getCourseTheme(title = '', category = ''): ThemeConfig {
  const combined = `${title} ${category}`.toLowerCase();

  if (combined.includes('ai') || combined.includes('artificial') || combined.includes('machine learning') || combined.includes('deep learning') || combined.includes('neural') || combined.includes('data science')) {
    return {
      icon: Brain,
      gradient: 'from-violet-600 via-indigo-600 to-purple-700',
      accent: 'bg-violet-400/20 text-violet-200 border-violet-400/30',
      label: 'AI & ML',
    };
  }

  if (combined.includes('cyber') || combined.includes('security') || combined.includes('ethical') || combined.includes('hack') || combined.includes('privacy')) {
    return {
      icon: ShieldCheck,
      gradient: 'from-emerald-600 via-teal-700 to-cyan-800',
      accent: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
      label: 'Security',
    };
  }

  if (combined.includes('database') || combined.includes('dbms') || combined.includes('sql') || combined.includes('mongodb') || combined.includes('postgresql') || combined.includes('data management')) {
    return {
      icon: Database,
      gradient: 'from-amber-600 via-orange-600 to-rose-600',
      accent: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
      label: 'Database',
    };
  }

  if (combined.includes('web') || combined.includes('frontend') || combined.includes('react') || combined.includes('javascript') || combined.includes('typescript') || combined.includes('html') || combined.includes('css')) {
    return {
      icon: Code2,
      gradient: 'from-cyan-600 via-blue-600 to-indigo-700',
      accent: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/30',
      label: 'Web Dev',
    };
  }

  if (combined.includes('program') || combined.includes('python') || combined.includes('java') || combined.includes('c++') || combined.includes('rust') || combined.includes('backend') || combined.includes('algorithm')) {
    return {
      icon: Terminal,
      gradient: 'from-blue-600 via-indigo-700 to-slate-800',
      accent: 'bg-blue-400/20 text-blue-200 border-blue-400/30',
      label: 'Code',
    };
  }

  if (combined.includes('cloud') || combined.includes('devops') || combined.includes('docker') || combined.includes('aws') || combined.includes('kubernetes') || combined.includes('linux')) {
    return {
      icon: Cloud,
      gradient: 'from-sky-600 via-blue-600 to-indigo-800',
      accent: 'bg-sky-400/20 text-sky-200 border-sky-400/30',
      label: 'Cloud',
    };
  }

  if (combined.includes('mobile') || combined.includes('android') || combined.includes('ios') || combined.includes('flutter') || combined.includes('react native')) {
    return {
      icon: Smartphone,
      gradient: 'from-teal-600 via-emerald-600 to-cyan-700',
      accent: 'bg-teal-400/20 text-teal-200 border-teal-400/30',
      label: 'Mobile',
    };
  }

  if (combined.includes('design') || combined.includes('ui') || combined.includes('ux') || combined.includes('figma') || combined.includes('graphics')) {
    return {
      icon: Palette,
      gradient: 'from-pink-600 via-rose-600 to-purple-700',
      accent: 'bg-pink-400/20 text-pink-200 border-pink-400/30',
      label: 'Design',
    };
  }

  if (combined.includes('business') || combined.includes('marketing') || combined.includes('finance') || combined.includes('management') || combined.includes('startup')) {
    return {
      icon: TrendingUp,
      gradient: 'from-emerald-700 via-teal-800 to-slate-900',
      accent: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
      label: 'Business',
    };
  }

  // Default theme
  return {
    icon: GraduationCap,
    gradient: 'from-slate-900 via-navy-900 to-teal-800',
    accent: 'bg-teal-400/20 text-teal-200 border-teal-400/30',
    label: 'Course',
  };
}

export default function CourseThumbnail({
  title = '',
  category = '',
  image,
  className,
  iconClassName,
  size = 'full',
}: CourseThumbnailProps) {
  const [hasImageError, setHasImageError] = useState(false);

  // Check if image is a valid, non-placeholder URL
  const isValidImage =
    Boolean(image) &&
    !hasImageError &&
    !image?.includes('placehold.co') &&
    (image?.startsWith('http://') ||
      image?.startsWith('https://') ||
      image?.startsWith('/uploads') ||
      image?.startsWith('blob:') ||
      image?.startsWith('data:'));

  const theme = getCourseTheme(title, category);
  const Icon = theme.icon;

  if (isValidImage && image) {
    return (
      <div className={cn('w-full h-full relative overflow-hidden bg-slate-100 dark:bg-slate-800', className)}>
        <img
          src={image}
          alt={title}
          onError={() => setHasImageError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  // Icon Badge Graphic with dynamic gradients & micro-effects
  return (
    <div
      className={cn(
        'w-full h-full relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br transition-all duration-300 select-none',
        theme.gradient,
        className
      )}
    >
      {/* Subtle ambient lighting grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/30 pointer-events-none" />
      
      {/* Background Decorative Rings */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 blur-xs pointer-events-none" />
      <div className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-white/5 blur-xs pointer-events-none" />

      {/* Main Icon Container */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 p-3 text-center">
        <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-md shadow-black/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          <Icon size={24} className={cn('text-white drop-shadow-sm', iconClassName)} />
        </div>
        {size !== 'sm' && theme.label && (
          <span className="text-[10px] font-black uppercase tracking-wider text-white/90 px-2 py-0.5 rounded-md bg-black/20 backdrop-blur-xs border border-white/10">
            {theme.label}
          </span>
        )}
      </div>
    </div>
  );
}

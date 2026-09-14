import { GraduationCap } from 'lucide-react';

interface AuthBrandingProps {
  headline?: string;
  subheadline?: string;
}

export default function AuthBranding({
  headline = 'Elevate your learning journey with world-class mentors.',
  subheadline,
}: AuthBrandingProps) {
  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-12 text-white lg:flex">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="relative z-10 flex items-center gap-3">
        <GraduationCap size={32} />
        <span className="text-2xl font-bold tracking-tight">EduBridge</span>
      </div>

      <div className="relative z-10 max-w-lg space-y-6">
        <h1 className="text-4xl font-bold leading-tight">{headline}</h1>
        {subheadline && <p className="text-lg text-white/80">{subheadline}</p>}
      </div>
    </div>
  );
}

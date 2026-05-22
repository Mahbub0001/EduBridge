import { Link } from 'react-router-dom';
import { Share2, MessageCircle, Link2, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';

const D = 'div';

const footerLinks = {
  Platform: [
    { label: 'Dashboard', to: '/student/dashboard' },
    { label: 'My Courses', to: '/student/courses' },
    { label: 'Calendar', to: '/student/calendar' },
    { label: 'Resources', to: '/student/resources' },
  ],
  Support: [
    { label: 'Help Center', to: '/student/help' },
    { label: 'Contact', to: '/contact' },
    { label: 'FAQ', to: '/faq' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
  ],
};

export interface StudentFooterProps {
  className?: string;
}

export default function StudentFooter({ className }: StudentFooterProps) {
  return (
    <footer className={cn('bg-white border-t border-slate-200 mt-auto', className)}>
      <D className="max-w-7xl mx-auto px-8 py-12">
        <D className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <D className="lg:col-span-2 space-y-4">
            <Link to="/" className="text-2xl font-extrabold text-navy-900 tracking-tight">
              EduBridge
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              Empowering learners with world-class MOOC experiences. Continue your journey to mastery.
            </p>
            <D className="flex gap-3">
              {[
                { icon: Share2, label: 'Share' },
                { icon: MessageCircle, label: 'Community' },
                { icon: Link2, label: 'Links' },
                { icon: Mail, label: 'Email' },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-navy-900 hover:text-white transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </D>
          </D>

          {Object.entries(footerLinks).map(([title, links]) => (
            <D key={title}>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-500 hover:text-navy-900 transition-colors font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </D>
          ))}
        </D>

        <D className="border-t border-slate-200 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} EduBridge MOOC. All rights reserved.
          </p>
          <D className="flex gap-6 text-xs text-slate-400 font-medium">
            <Link to="/privacy" className="hover:text-navy-900 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-navy-900 transition-colors">
              Terms
            </Link>
            <Link to="/cookies" className="hover:text-navy-900 transition-colors">
              Cookies
            </Link>
          </D>
        </D>
      </D>
    </footer>
  );
}

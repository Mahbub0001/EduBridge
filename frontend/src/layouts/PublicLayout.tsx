import { Link, Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

interface PublicLayoutProps {
  showNav?: boolean;
}

export default function PublicLayout({ showNav = true }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-slate-950">
      {showNav && (
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-navy-900 dark:text-white">
              <GraduationCap size={28} className="text-navy-900 dark:text-teal-400" />
              EduBridge
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Link to="/" className="hover:text-navy-900 dark:hover:text-white">
                Home
              </Link>
              <Link to="/login" className="hover:text-navy-900 dark:hover:text-white">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-navy-900 px-4 py-2 text-white hover:bg-navy-800"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </header>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

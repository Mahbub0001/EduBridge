import { Link, Outlet } from 'react-router-dom';
import { GraduationCap, Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface PublicLayoutProps {
  showNav?: boolean;
}

export default function PublicLayout({ showNav = true }: PublicLayoutProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-slate-950">
      {showNav && (
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-navy-900 dark:text-white">
              <GraduationCap size={28} className="text-navy-900 dark:text-teal-400" />
              EduBridge
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
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
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
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

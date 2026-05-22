import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Search, Bell, Moon, Sun, Globe, ChevronDown, User, Settings, LogOut, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore, usePreferencesStore } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import NotificationDropdown from './NotificationDropdown';
import type { Notification } from '../../types';

const D = 'div';

export interface TopbarLink {
  label: string;
  to: string;
  active?: boolean;
}

export interface TopbarProps {
  notifications?: Notification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onMenuClick?: () => void;
  centerLinks?: TopbarLink[];
  settingsPath?: string;
  showSearch?: boolean;
  className?: string;
}

export default function Topbar({
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onMenuClick,
  centerLinks,
  settingsPath = '/student/settings',
  showSearch = true,
  className,
}: TopbarProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { language, setLanguage } = usePreferencesStore();
  const { isDark, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleLang = () => setLanguage(language === 'en' ? 'es' : 'en');

  const handleLogout = async () => {
    await signOut(auth);
    useAuthStore.getState().logout();
    setProfileOpen(false);
    navigate('/login');
  };

  return (
    <header className={cn('h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-10 dark:bg-slate-900 dark:border-slate-800', className)}>
      <D className="flex items-center gap-4">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        )}
        <span className="text-xl font-bold text-slate-900 md:hidden dark:text-white">EduBridge</span>
        {centerLinks && centerLinks.length > 0 && (
          <nav className="hidden md:flex items-center gap-8 h-20">
            {centerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'text-sm font-semibold h-full flex items-center border-b-2 transition-all',
                  link.active
                    ? 'border-navy-900 text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </D>

      <D className="flex items-center gap-3 md:gap-4">
        {showSearch && (
          <D className="flex items-center bg-slate-100 rounded-full px-4 py-2 border border-transparent focus-within:border-slate-300 focus-within:bg-white transition-all w-48 lg:w-64 hidden sm:flex dark:bg-slate-800 dark:focus-within:bg-slate-900">
            <Search size={16} className="text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search anything..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none w-full ml-2 text-xs text-slate-900 placeholder-slate-400 dark:text-white"
            />
          </D>
        )}

        <button
          type="button"
          onClick={toggleLang}
          className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Switch language"
        >
          <Globe size={16} />
          {language.toUpperCase()}
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <D className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((o) => !o);
              setProfileOpen(false);
            }}
            className="relative p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {notifications.some((n) => !n.read) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>
          <NotificationDropdown
            notifications={notifications}
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            onMarkRead={onMarkNotificationRead}
            onMarkAllRead={onMarkAllNotificationsRead}
          />
        </D>

        <D ref={profileRef} className="relative flex items-center gap-2 pl-3 md:pl-4 border-l border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((o) => !o);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2"
          >
            <D className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </D>
            <ChevronDown size={16} className="text-slate-500 hidden sm:block" />
          </button>

          {profileOpen && (
            <D className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 dark:bg-slate-900 dark:border-slate-700">
              <D className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-extrabold text-slate-900 truncate dark:text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </D>
              <Link
                to={settingsPath}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => setProfileOpen(false)}
              >
                <User size={16} />
                Profile
              </Link>
              <Link
                to={settingsPath}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => setProfileOpen(false)}
              >
                <Settings size={16} />
                Settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full dark:hover:bg-red-950/30"
              >
                <LogOut size={16} />
                Logout
              </button>
            </D>
          )}
        </D>
      </D>
    </header>
  );
}

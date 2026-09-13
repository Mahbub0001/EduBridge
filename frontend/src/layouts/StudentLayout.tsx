import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Calendar,
  Folder,
  ClipboardList,
  Settings,
  Megaphone,
} from 'lucide-react';
import Sidebar, { type NavItem } from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useLogout } from '../hooks/useLogout';
import { cn } from '../lib/utils';
import { getStudentUnreadAnnouncementCount } from '../services/announcementService';
import {
  getNotifications,
  markAsRead as markNotifRead,
  markAllNotificationsRead
} from '../services/notificationService';
import type { Notification } from '../types';

export default function StudentLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const location = useLocation();
  const handleLogout = useLogout();

  const refreshUnreadCounts = useCallback(() => {
    getStudentUnreadAnnouncementCount()
      .then((count) => setUnreadAnnouncements(count || 0))
      .catch(() => {});
    getNotifications()
      .then((notifs) => setNotifications(notifs || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnreadCounts();

    const handleUpdate = () => refreshUnreadCounts();
    window.addEventListener('announcements-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('announcements-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [refreshUnreadCounts]);

  // Refresh counts on route change
  useEffect(() => {
    refreshUnreadCounts();
  }, [location.pathname, refreshUnreadCounts]);

  const handleMarkNotifRead = async (id: string) => {
    try {
      await markNotifRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  const handleMarkAllNotifRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/student/dashboard', icon: Home },
    { name: 'My Courses', path: '/student/my-courses', icon: BookOpen },
    {
      name: 'Announcements',
      path: '/student/announcements',
      icon: Megaphone,
      badge: unreadAnnouncements,
    },
    { name: 'Calendar', path: '/student/calendar', icon: Calendar },
    { name: 'Resources', path: '/student/resources', icon: Folder },
    { name: 'Assignments', path: '/student/assignments', icon: ClipboardList },
    { name: 'Settings', path: '/student/settings', icon: Settings },
  ];

  const centerLinks = [
    {
      label: 'Dashboard',
      to: '/student/dashboard',
      active: location.pathname.includes('/student/dashboard'),
    },
    {
      label: 'Courses',
      to: '/student/my-courses',
      active: location.pathname.includes('/student/my-courses') || location.pathname.includes('/student/courses'),
    },
    {
      label: 'Announcements',
      to: '/student/announcements',
      active: location.pathname.includes('/student/announcements'),
    },
  ];

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      <aside className="hidden md:flex md:shrink-0">
        <Sidebar navItems={navItems} onLogout={handleLogout} />
      </aside>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar
          navItems={navItems}
          onLogout={handleLogout}
          onNavigate={closeDrawer}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setDrawerOpen(true)}
          centerLinks={centerLinks}
          settingsPath="/student/settings"
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotifRead}
          onMarkAllNotificationsRead={handleMarkAllNotifRead}
        />

        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

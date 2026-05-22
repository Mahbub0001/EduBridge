import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Calendar,
  Folder,
  ClipboardList,
  Settings,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import StudentFooter from '../components/layout/StudentFooter';
import { useLogout } from '../hooks/useLogout';
import { cn } from '../lib/utils';

const navItems = [
  { name: 'Dashboard', path: '/student/dashboard', icon: Home },
    { name: 'My Courses', path: '/student/my-courses', icon: BookOpen },
  { name: 'Calendar', path: '/student/calendar', icon: Calendar },
  { name: 'Resources', path: '/student/resources', icon: Folder },
  { name: 'Assignments', path: '/student/assignments', icon: ClipboardList },
  { name: 'Settings', path: '/student/settings', icon: Settings },
];

export default function StudentLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const handleLogout = useLogout();

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
  ];

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      <aside className="hidden md:flex md:shrink-0">
        <Sidebar navItems={navItems} onLogout={handleLogout} helpPath="/student/help" />
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
          helpPath="/student/help"
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setDrawerOpen(true)}
          centerLinks={centerLinks}
          settingsPath="/student/settings"
        />

        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-6 md:p-8">
            <Outlet />
          </div>
          <StudentFooter />
        </main>
      </div>
    </div>
  );
}

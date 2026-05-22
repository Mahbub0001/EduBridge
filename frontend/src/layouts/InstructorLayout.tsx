import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Users,
  BarChart3,
  PlusCircle,
  Megaphone,
  MessageSquare,
  Settings,
  HelpCircle,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useLogout } from '../hooks/useLogout';
import { cn } from '../lib/utils';

const navItems = [
  { name: 'Dashboard', path: '/instructor/dashboard', icon: Home },
  { name: 'Courses', path: '/instructor/courses', icon: BookOpen },
  { name: 'Create Course', path: '/instructor/create-course', icon: PlusCircle },
  { name: 'Course Builder', path: '/instructor/course-builder', icon: BookOpen },
  { name: 'Quizzes', path: '/instructor/quizzes', icon: BookOpen },
  { name: 'Assignments', path: '/instructor/assignments', icon: BookOpen },
  { name: 'Submissions', path: '/instructor/submissions', icon: Users },
  { name: 'Announcements', path: '/instructor/announcements', icon: Megaphone },
  { name: 'Discussions', path: '/instructor/discussions', icon: MessageSquare },
  { name: 'Analytics', path: '/instructor/analytics', icon: BarChart3 },
  { name: 'Students', path: '/instructor/students', icon: Users },
  { name: 'Settings', path: '/instructor/settings', icon: Settings },
  { name: 'Help Center', path: '/instructor/help', icon: HelpCircle },
];


export default function InstructorLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleLogout = useLogout();
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      <aside className="hidden md:flex md:shrink-0">
        <Sidebar
          navItems={navItems}
          onLogout={handleLogout}
          helpPath="/instructor/help"
        />
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
          helpPath="/instructor/help"
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setDrawerOpen(true)}
          settingsPath="/instructor/settings"
          showSearch
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

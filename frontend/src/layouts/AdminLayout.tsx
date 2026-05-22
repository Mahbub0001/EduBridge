import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Home,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Shield,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useLogout } from '../hooks/useLogout';
import { cn } from '../lib/utils';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Courses', path: '/admin/courses', icon: BookOpen },
  { name: 'Categories', path: '/admin/categories', icon: Shield },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleLogout = useLogout();
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      <aside className="hidden md:flex md:shrink-0">
        <Sidebar
          navItems={navItems}
          onLogout={handleLogout}
          helpPath="/admin/help"
          className="bg-white dark:bg-slate-900"
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
          helpPath="/admin/help"
          className="bg-white dark:bg-slate-900"
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setDrawerOpen(true)}
          settingsPath="/admin/settings"
          showSearch
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
              <Shield size={16} className="text-red-600" />
              <span>Administration Panel</span>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

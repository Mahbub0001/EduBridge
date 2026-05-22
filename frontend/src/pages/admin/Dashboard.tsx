import { useEffect, useState } from 'react';
import { Users, BookOpen, Shield, UserCheck } from 'lucide-react';
import { useAuthStore } from '../../store';
import { getAdminAnalytics } from '../../services/adminService';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAnalytics()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500 text-sm">Loading dashboard...</div>;

  const statItems = [
    { label: 'Total Users', value: String(stats.total_users ?? 0).padStart(2, '0'), icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Students', value: String(stats.total_students ?? 0).padStart(2, '0'), icon: UserCheck, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Instructors', value: String(stats.total_instructors ?? 0).padStart(2, '0'), icon: Shield, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
    { label: 'Courses', value: String(stats.total_courses ?? 0).padStart(2, '0'), icon: BookOpen, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-navy-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.name?.split(' ')[0] || 'Admin'}!</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((s) => <StatCard key={s.label} {...s} />)}
      </div>
      <Card>
        <h2 className="text-xl font-extrabold text-navy-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-3xl font-black text-navy-900">{stats.total_courses ?? 0}</p>
            <p className="text-[10px] tracking-wider text-slate-500 font-extrabold uppercase mt-1">Total Courses</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-3xl font-black text-navy-900">{stats.published_courses ?? 0}</p>
            <p className="text-[10px] tracking-wider text-slate-500 font-extrabold uppercase mt-1">Published</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-3xl font-black text-navy-900">{stats.total_enrollments ?? 0}</p>
            <p className="text-[10px] tracking-wider text-slate-500 font-extrabold uppercase mt-1">Enrollments</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-3xl font-black text-navy-900">{stats.total_instructors ?? 0}</p>
            <p className="text-[10px] tracking-wider text-slate-500 font-extrabold uppercase mt-1">Instructors</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

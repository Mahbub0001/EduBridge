import { useEffect, useState } from 'react';
import { Users, BookOpen, Shield, UserCheck, TrendingUp } from 'lucide-react';
import { getAdminAnalytics } from '../../services/adminService';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAnalytics()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500 text-sm">Loading analytics...</div>;

  const statItems = [
    { label: 'Total Users', value: String(stats.total_users ?? 0).padStart(2, '0'), icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Students', value: String(stats.total_students ?? 0).padStart(2, '0'), icon: UserCheck, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Instructors', value: String(stats.total_instructors ?? 0).padStart(2, '0'), icon: Shield, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
    { label: 'Courses', value: String(stats.total_courses ?? 0).padStart(2, '0'), icon: BookOpen, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Platform Analytics" description="View platform-wide metrics and reports." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((s) => <StatCard key={s.label} {...s} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-navy-900">{stats.total_enrollments ?? 0}</p>
          <p className="text-[10px] tracking-wider text-slate-500 font-extrabold uppercase mt-1">Total Enrollments</p>
        </Card>
        <Card>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <BookOpen size={20} className="text-amber-600" />
          </div>
          <p className="text-3xl font-black text-navy-900">{stats.published_courses ?? 0}</p>
          <p className="text-[10px] tracking-wider text-slate-500 font-extrabold uppercase mt-1">Published Courses</p>
        </Card>
        <Card>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
            <Users size={20} className="text-purple-600" />
          </div>
          <p className="text-3xl font-black text-navy-900">{stats.total_users ?? 0}</p>
          <p className="text-[10px] tracking-wider text-slate-500 font-extrabold uppercase mt-1">Platform Users</p>
        </Card>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  UserPlus,
  Shield,
  GraduationCap,
  Calendar,
  ArrowRight,
  Server,
  Zap,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useAuthStore } from '../../store';
import { getAdminDashboardStats } from '../../services/adminService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import UserAvatar from '../../components/ui/UserAvatar';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboardStats()
      .then(setData)
      .catch((err) => console.error('Failed to load dashboard stats', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500">Loading Admin Command Center...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentUsers = data?.recent_users || [];
  const recentEnrollments = data?.recent_enrollments || [];
  const monthlyTrends = data?.monthly_trends || [];
  const topCourses = data?.top_courses || [];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-navy-950 via-slate-900 to-teal-950 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-black uppercase tracking-widest">
            <Zap size={14} /> System Operational • Platform Admin
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Here is the live pulse and activity report for the EduBridge platform.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link to="/admin/users">
            <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 gap-1.5">
              <UserPlus size={16} /> Add User
            </Button>
          </Link>
          <Link to="/admin/courses">
            <Button variant="primary" size="sm" className="!bg-teal-500 hover:!bg-teal-400 text-navy-950 font-black gap-1.5 shadow-lg">
              <BookOpen size={16} /> Manage Courses
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 Key KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Students */}
        <Card padding="md" className="space-y-2 border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">
              {stats.total_students || 0}
            </p>
            <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Total Students
            </p>
          </div>
        </Card>

        {/* Instructors */}
        <Card padding="md" className="space-y-2 border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">
              {stats.total_instructors || 0}
            </p>
            <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Instructors
            </p>
          </div>
        </Card>

        {/* Published Courses */}
        <Card padding="md" className="space-y-2 border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">
              {stats.published_courses || 0}
              <span className="text-xs text-slate-400 font-normal"> / {stats.total_courses || 0}</span>
            </p>
            <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Live Courses
            </p>
          </div>
        </Card>

        {/* Total Enrollments */}
        <Card padding="md" className="space-y-2 border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">
              {stats.total_enrollments || 0}
            </p>
            <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Total Enrollments
            </p>
          </div>
        </Card>

        {/* Completion Rate */}
        <Card padding="md" className="space-y-2 border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">
              {stats.completion_rate || 0}%
            </p>
            <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Completion Rate
            </p>
          </div>
        </Card>

        {/* Certificates */}
        <Card padding="md" className="space-y-2 border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
            <Award size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">
              {stats.total_certificates || 0}
            </p>
            <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Certificates Issued
            </p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Visual Trends & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Monthly Trends Chart */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-navy-900 dark:text-white">
                  Monthly Enrollment &amp; Completion Trends
                </h2>
                <p className="text-xs text-slate-400">Past 6 months platform growth overview</p>
              </div>
              <Link to="/admin/analytics" className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1">
                View Full Analytics <ArrowRight size={14} />
              </Link>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="enrollments" name="New Enrollments" fill="#0D9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completions" name="Completions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top Courses Leaderboard */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-navy-900 dark:text-white">
                  Top Performing Courses
                </h2>
                <p className="text-xs text-slate-400">Ranked by total enrolled students</p>
              </div>
              <Link to="/admin/courses" className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1">
                All Courses <ArrowRight size={14} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {topCourses.map((c: any, index: number) => (
                <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-xs font-black text-slate-400 text-center">
                      #{index + 1}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <BookOpen size={18} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-navy-900 dark:text-white truncate">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Instructor: {c.instructor_name} • <span className="text-teal-600 dark:text-teal-400 font-semibold">{c.category}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 text-right">
                    <div>
                      <p className="text-xs font-black text-navy-900 dark:text-white">
                        {c.enrollments}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Students</p>
                    </div>
                    <div className="w-20 hidden sm:block">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>{c.completion_rate}%</span>
                      </div>
                      <ProgressBar value={c.completion_rate} />
                    </div>
                  </div>
                </div>
              ))}

              {topCourses.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">No courses published yet.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Col: Health & Quick Operations */}
        <div className="space-y-6">
          {/* Quick Operations */}
          <Card className="space-y-4">
            <h3 className="text-xs font-extrabold text-navy-900 dark:text-white uppercase tracking-wider">
              Quick Administrative Actions
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              <Link to="/admin/users" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <UserPlus size={16} className="text-blue-600" />
                  <span className="text-xs font-bold text-navy-900 dark:text-white">Create New User</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>

              <Link to="/admin/enrollments" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <GraduationCap size={16} className="text-teal-600" />
                  <span className="text-xs font-bold text-navy-900 dark:text-white">Manual Student Enrollment</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>

              <Link to="/admin/categories" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <BookOpen size={16} className="text-purple-600" />
                  <span className="text-xs font-bold text-navy-900 dark:text-white">Add Course Category</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>

              <Link to="/admin/settings" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-amber-600" />
                  <span className="text-xs font-bold text-navy-900 dark:text-white">Global Announcement</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
            </div>
          </Card>

          {/* System Health */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Server size={14} className="text-teal-600" /> System Infrastructure
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Firestore Database</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Connected
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Firebase Authentication</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Active
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">FastAPI Application</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> v1.0.0 Online
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Server Time (UTC)</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                  {new Date().toISOString().substring(11, 19)}
                </span>
              </div>
            </div>
          </Card>

          {/* User Distribution */}
          <Card className="space-y-3">
            <h3 className="text-xs font-extrabold text-navy-900 dark:text-white uppercase tracking-wider">
              Account Roles Breakdown
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Students</span>
                <span className="font-bold text-navy-900 dark:text-white">{stats.total_students || 0}</span>
              </div>
              <ProgressBar value={((stats.total_students || 0) / Math.max(stats.total_users || 1, 1)) * 100} />

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-medium text-slate-500">Instructors</span>
                <span className="font-bold text-navy-900 dark:text-white">{stats.total_instructors || 0}</span>
              </div>
              <ProgressBar value={((stats.total_instructors || 0) / Math.max(stats.total_users || 1, 1)) * 100} />

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-medium text-slate-500">Admins</span>
                <span className="font-bold text-navy-900 dark:text-white">{stats.total_admins || 0}</span>
              </div>
              <ProgressBar value={((stats.total_admins || 0) / Math.max(stats.total_users || 1, 1)) * 100} />
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Recent Registrations & Live Enrollments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-navy-900 dark:text-white">
                Recent User Registrations
              </h2>
              <p className="text-xs text-slate-400">Newly joined learners and instructors</p>
            </div>
            <Link to="/admin/users" className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1">
              All Users <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar src={u.photo_url} name={u.name} size="sm" />
                  <div>
                    <p className="text-xs font-extrabold text-navy-900 dark:text-white leading-tight">
                      {u.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                      {u.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={u.role === 'instructor' ? 'purple' : u.role === 'admin' ? 'danger' : 'default'}>
                    {u.role}
                  </Badge>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            ))}

            {recentUsers.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">No user accounts found.</p>
            )}
          </div>
        </Card>

        {/* Recent Enrollments */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-navy-900 dark:text-white">
                Recent Course Enrollments
              </h2>
              <p className="text-xs text-slate-400">Live student course enrollments</p>
            </div>
            <Link to="/admin/enrollments" className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1">
              All Enrollments <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentEnrollments.map((e: any) => (
              <div key={e.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar src={e.student_photo} name={e.student_name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-navy-900 dark:text-white truncate">
                      {e.student_name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {e.course_title}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-navy-900 dark:text-teal-400">
                    {Math.round(e.progress_percent || 0)}%
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {e.status === 'completed' ? 'Completed' : 'Studying'}
                  </p>
                </div>
              </div>
            ))}

            {recentEnrollments.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">No enrollments recorded yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

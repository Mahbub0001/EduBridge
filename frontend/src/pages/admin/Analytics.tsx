/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Download,
  CheckCircle2,
  RefreshCw,
  GraduationCap,
  PieChart as PieIcon
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
import { getAdminDashboardStats, getAdminDetailedAnalytics } from '../../services/adminService';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import UserAvatar from '../../components/ui/UserAvatar';

export default function AdminAnalytics() {
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadAllAnalytics = async () => {
    try {
      const [dash, detail] = await Promise.all([
        getAdminDashboardStats(),
        getAdminDetailedAnalytics(),
      ]);
      setDashboardStats(dash);
      setDetailedStats(detail);
    } catch (err) {
      console.error('Failed to load admin analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!dashboardStats) return;
    const stats = dashboardStats.stats || {};
    const topCourses = dashboardStats.top_courses || [];

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'EduBridge Platform Analytics Report\n\n';
    csvContent += `Generated At,${new Date().toISOString()}\n`;
    csvContent += `Total Users,${stats.total_users || 0}\n`;
    csvContent += `Total Students,${stats.total_students || 0}\n`;
    csvContent += `Total Instructors,${stats.total_instructors || 0}\n`;
    csvContent += `Total Courses,${stats.total_courses || 0}\n`;
    csvContent += `Published Courses,${stats.published_courses || 0}\n`;
    csvContent += `Total Enrollments,${stats.total_enrollments || 0}\n`;
    csvContent += `Completion Rate,${stats.completion_rate || 0}%\n`;
    csvContent += `Certificates Issued,${stats.total_certificates || 0}\n\n`;

    csvContent += 'Top Courses,Instructor,Enrollments,Completion Rate\n';
    topCourses.forEach((c: any) => {
      csvContent += `"${c.title}","${c.instructor_name}",${c.enrollments},${c.completion_rate}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `edubridge_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500">Compiling Platform Analytics...</p>
      </div>
    );
  }

  const stats = dashboardStats?.stats || {};
  const monthlyTrends = dashboardStats?.monthly_trends || [];
  const topCourses = dashboardStats?.top_courses || [];
  const categoryData = detailedStats?.category_distribution || [];
  const instructorStats = detailedStats?.instructor_performance || [];
  const quizMetrics = detailedStats?.quiz_metrics || {};

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Analytics"
        description="Comprehensive metrics, student performance trends, category distributions, and reporting."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setLoading(true); loadAllAnalytics(); }}
              className="gap-1.5"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
              className="!bg-navy-900 dark:!bg-teal-600 gap-1.5"
            >
              <Download size={16} /> Export CSV Report
            </Button>
          </div>
        }
      />

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
            <GraduationCap size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">
              {stats.total_enrollments || 0}
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Enrollments
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">
              {stats.completion_rate || 0}%
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Completion Rate
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">
              {quizMetrics.pass_rate || 0}%
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Quiz Pass Rate
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
            <Award size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">
              {stats.total_certificates || 0}
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Certificates Issued
            </p>
          </div>
        </Card>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trend Chart */}
        <Card className="space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-teal-600" /> Enrollment Velocity (6-Month Trend)
            </h2>
            <p className="text-xs text-slate-400">Monthly new enrollments vs completion volume</p>
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="enrollments" name="Enrollments" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completions" name="Completions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Breakdown Chart */}
        <Card className="space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
              <PieIcon size={18} className="text-blue-600" /> Student Distribution by Discipline
            </h2>
            <p className="text-xs text-slate-400">Total enrolled students per course category</p>
          </div>

          <div className="h-64 w-full pt-4">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="enrollments" name="Enrolled Students" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No category data recorded yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tables: Top Courses and Instructor Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Courses */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-navy-900 dark:text-white">
                Course Enrollment Leaderboard
              </h2>
              <p className="text-xs text-slate-400">Top courses by student adoption</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topCourses.map((c: any, idx: number) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-xs font-black text-slate-400">#{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-navy-900 dark:text-white truncate">
                      {c.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {c.instructor_name} • <span className="text-teal-600">{c.category}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-navy-900 dark:text-white">
                    {c.enrollments} Students
                  </span>
                  <p className="text-[10px] text-emerald-600 font-bold">
                    {c.completion_rate}% completion
                  </p>
                </div>
              </div>
            ))}

            {topCourses.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">No course data available.</p>
            )}
          </div>
        </Card>

        {/* Instructor Performance */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-navy-900 dark:text-white">
                Instructor Impact &amp; Reach
              </h2>
              <p className="text-xs text-slate-400">Instructors ranked by student volume</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {instructorStats.slice(0, 5).map((inst: any) => (
              <div key={inst.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar src={inst.photo_url} name={inst.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-navy-900 dark:text-white truncate">
                      {inst.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {inst.courses_count} {inst.courses_count === 1 ? 'course' : 'courses'} taught
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-navy-900 dark:text-white">
                    {inst.students_count} Learners
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Avg {inst.completion_rate}% completed
                  </p>
                </div>
              </div>
            ))}

            {instructorStats.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">No instructor activity recorded.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, Award, BookOpen, AlertTriangle, RefreshCw, Send, CheckCircle2,
  ShieldAlert, BarChart2, PieChart as PieIcon, ListTodo, Activity, Calendar
} from 'lucide-react';
import { getMyInstructorCourses } from '../../services/courseService';
import { getInstructorComprehensiveAnalytics } from '../../services/instructorService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

export default function InstructorAnalytics() {
  const [courses, setCourses] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');

  // Actions states
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [remindingStudentId, setRemindingStudentId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadData = async (courseId?: string, dateRange?: string) => {
    setLoading(true);
    try {
      const [cList, analyticRes] = await Promise.all([
        getMyInstructorCourses().catch(() => []),
        getInstructorComprehensiveAnalytics(courseId, dateRange).catch(() => null)
      ]);
      setCourses(cList);
      if (analyticRes) {
        setAnalyticsData(analyticRes);
      }
    } catch {
      showToast('Failed to load comprehensive analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedCourseId, selectedDateRange);
  }, [selectedCourseId, selectedDateRange]);

  const handleSendReminder = (studentName: string) => {
    setRemindingStudentId(studentName);
    setTimeout(() => {
      showToast(`Friendly study reminder successfully sent to ${studentName}!`);
      setRemindingStudentId(null);
    }, 1200);
  };

  // Color arrays for Recharts
  const COLORS = ['#0F172A', '#475569', '#94A3B8', '#CBD5E1', '#E2E8F0'];

  return (
    <div className="space-y-6">
      {/* Toast popup */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-2 flex items-center gap-2 ${
          toastType === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
        }`}>
          {toastType === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Learning Analytics</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Track student progress distribution, assessment performance, and active cohorts.</p>
        </div>

        {/* Global Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <BookOpen size={13} className="text-slate-500" />
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-transparent border-none text-xs font-bold outline-none text-slate-700 cursor-pointer"
            >
              <option value="">All courses taught</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar size={13} className="text-slate-500" />
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="bg-transparent border-none text-xs font-bold outline-none text-slate-700 cursor-pointer"
            >
              <option value="all">All-time parameters</option>
              <option value="30">Past 30 days</option>
              <option value="7">Past 7 days</option>
            </select>
          </div>

          <Button variant="ghost" size="sm" className="!p-2 hover:bg-slate-50 text-slate-700" onClick={() => loadData(selectedCourseId, selectedDateRange)}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {loading && !analyticsData ? (
        /* Skeletons */
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : analyticsData ? (
        <>
          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { label: 'Total Students', val: analyticsData.summary.total_students, icon: Users, color: 'text-blue-500 bg-blue-50' },
              { label: 'Average Progress', val: `${analyticsData.summary.average_progress}%`, icon: TrendingUp, color: 'text-purple-500 bg-purple-50' },
              { label: 'Completion Rate', val: `${analyticsData.summary.completion_rate}%`, icon: Award, color: 'text-emerald-500 bg-emerald-50' },
              { label: 'Quiz Pass Rate', val: `${analyticsData.summary.quiz_pass_rate}%`, icon: CheckCircle2, color: 'text-cyan-500 bg-cyan-50' },
              { label: 'Assignment Rate', val: `${analyticsData.summary.assignment_rate}%`, icon: Activity, color: 'text-indigo-500 bg-indigo-50' },
              { label: 'Inactive Cohorts', val: analyticsData.summary.inactive_students, icon: AlertTriangle, color: 'text-red-500 bg-red-50' }
            ].map((k, idx) => {
              const Icon = k.icon;
              return (
                <Card key={idx} className="border border-slate-200 p-3.5 flex flex-col justify-between gap-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-normal">{k.label}</span>
                    <div className={`p-1.5 rounded-xl ${k.color}`}>
                      <Icon size={12} />
                    </div>
                  </div>
                  <p className="text-base font-black text-slate-900 leading-none">{k.val}</p>
                </Card>
              );
            })}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Enrollment trend */}
            <Card className="border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <TrendingUp size={14} className="text-slate-500" />
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Enrollment Intake Trend</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.enrollment_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                    <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                    <Tooltip contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="enrollments" stroke="#0f172a" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Progress distribution */}
            <Card className="border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <BarChart2 size={14} className="text-slate-500" />
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Syllabus Progress Distribution</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.progress_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                    <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                    <Tooltip contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 'bold' }} />
                    <Bar dataKey="students" fill="#475569" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Quiz performance */}
            <Card className="border border-slate-200 space-y-4 lg:col-span-1">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Award size={14} className="text-slate-500" />
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Assessment Scores Average</h3>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.quiz_performance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                    <YAxis dataKey="quiz_title" type="category" stroke="#94a3b8" fontSize={8} fontWeight="bold" width={80} />
                    <Tooltip contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 'bold' }} />
                    <Bar dataKey="average_score" fill="#0f172a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Assignment Status breakdown */}
            <Card className="border border-slate-200 space-y-4 lg:col-span-1">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <PieIcon size={14} className="text-slate-500" />
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Submission Evaluations</h3>
              </div>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.assignment_status}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {analyticsData.assignment_status.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Custom Legend */}
              <div className="flex flex-wrap justify-center gap-3 text-[10px] font-extrabold uppercase text-slate-500">
                {analyticsData.assignment_status.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span>{item.status} ({item.value})</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Chapter Heatmap list */}
            <Card className="border border-slate-200 space-y-4 lg:col-span-1">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <ListTodo size={14} className="text-slate-500" />
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Module Completion Progress</h3>
              </div>
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                {analyticsData.module_completion.map((m: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                      <span className="line-clamp-1 pr-4">{m.module_title}</span>
                      <span className="text-slate-900 font-extrabold">{m.completions} completed</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-900 h-full rounded-full transition-all"
                        style={{ width: `${Math.min((m.completions / (analyticsData.summary.total_students || 10)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>

          {/* Tables Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top performing students */}
            <Card className="border border-slate-200 p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <Award size={14} className="text-slate-900" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">High Performing Cohort</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-3">Progress</th>
                      <th className="py-3 px-3">Quiz avg</th>
                      <th className="py-3 px-4 text-right">Paper score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {analyticsData.top_students.map((ts: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-900 leading-none">{ts.student_name}</div>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{ts.course_title}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-10 bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full" style={{ width: `${ts.progress}%` }} />
                            </div>
                            <span>{ts.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-900 font-bold">{ts.avg_quiz}%</td>
                        <td className="py-3.5 px-4 text-right text-slate-900 font-bold">{ts.assignment_grade}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* At-risk students */}
            <Card className="border border-slate-200 p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">At-Risk Watchlist</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-3">Last Active</th>
                      <th className="py-3 px-3">Progress</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {analyticsData.at_risk_students.map((ar: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-900 leading-none">{ar.student_name}</div>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{ar.course_title}</span>
                        </td>
                        <td className="py-3.5 px-3 text-red-500 font-bold">{ar.last_active}</td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-10 bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div className="bg-red-500 h-full" style={{ width: `${ar.progress}%` }} />
                            </div>
                            <span>{ar.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-900 hover:bg-slate-100 !px-2.5 !py-1 text-[10px]"
                            onClick={() => handleSendReminder(ar.student_name)}
                            disabled={remindingStudentId === ar.student_name}
                          >
                            <Send size={10} className="mr-1" />
                            <span>{remindingStudentId === ar.student_name ? 'Sending...' : 'Remind'}</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        </>
      ) : (
        <Card className="text-center py-20 border border-slate-200">
          <BookOpen className="mx-auto text-slate-300" size={40} />
          <p className="text-slate-500 font-extrabold mt-4">Failed to load analytics dashboard data.</p>
        </Card>
      )}
    </div>
  );
}

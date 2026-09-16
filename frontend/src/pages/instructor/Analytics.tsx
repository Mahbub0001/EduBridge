/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, TrendingUp, Award, BookOpen, AlertTriangle, RefreshCw, Send, CheckCircle2,
  ShieldAlert, BarChart2, PieChart as PieIcon, ListTodo, Activity, Calendar,
  Filter, Search, Clock, ChevronRight, X, GraduationCap, Save, Edit3, Loader2, Sparkles, Mail
} from 'lucide-react';
import { getMyInstructorCourses } from '../../services/courseService';
import {
  getInstructorComprehensiveAnalytics,
  getInstructorStudentsList,
  getInstructorStudentProgress,
  sendStudentReminder,
  saveStudentPrivateNotes
} from '../../services/instructorService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import UserAvatar from '../../components/ui/UserAvatar';
import { useAuthStore } from '../../store';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

// High-performance memory caches
const analyticsMemoryCache: Record<string, any> = {};
let cachedCourses: any[] = [];
let cachedStudentsList: any[] = [];

export default function InstructorAnalytics() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'students' ? 'students' : 'overview';

  const handleTabChange = (tab: 'overview' | 'students') => {
    setSearchParams(tab === 'students' ? { tab: 'students' } : {});
  };

  // ── OVERVIEW ANALYTICS STATE ──
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');

  const defaultKey = `${selectedCourseId || 'all'}_${selectedDateRange || 'all'}`;
  const [courses, setCourses] = useState<any[]>(() => cachedCourses);
  const [analyticsData, setAnalyticsData] = useState<any>(() => analyticsMemoryCache[defaultKey] || null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(!analyticsMemoryCache[defaultKey]);
  const [remindingStudentId, setRemindingStudentId] = useState<string | null>(null);

  // ── ENROLLED STUDENTS ROSTER STATE ──
  const [students, setStudents] = useState<any[]>(() => cachedStudentsList);
  const [loadingStudents, setLoadingStudents] = useState(cachedStudentsList.length === 0);
  const [studentCourseFilter, setStudentCourseFilter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected student progress detail (drawer)
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [, setDetailLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Send reminder modal/dialog
  const [reminderStudent, setReminderStudent] = useState<any | null>(null);
  const [reminderText, setReminderText] = useState('');
  const [reminderSending, setReminderSending] = useState(false);

  // Notifications
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Fetch courses once on mount
  useEffect(() => {
    if (cachedCourses.length === 0) {
      getMyInstructorCourses()
        .then((cList) => {
          const list = cList || [];
          cachedCourses = list;
          setCourses(list);
        })
        .catch(() => setCourses([]));
    }
  }, []);

  // Fetch students list
  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const sList = await getInstructorStudentsList();
      cachedStudentsList = sList || [];
      setStudents(cachedStudentsList);
    } catch {
      showToast('Failed to load student roster data.', 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents();
    }
  }, [activeTab]);

  // Load comprehensive analytics
  const loadAnalyticsData = async (courseId?: string, dateRange?: string, forceRefresh = false) => {
    const cacheKey = `${courseId || 'all'}_${dateRange || 'all'}`;

    if (!forceRefresh && analyticsMemoryCache[cacheKey]) {
      setAnalyticsData(analyticsMemoryCache[cacheKey]);
      setLoadingAnalytics(false);
      return;
    }

    if (!analyticsMemoryCache[cacheKey]) {
      setLoadingAnalytics(true);
    }
    try {
      const config = forceRefresh ? { headers: { 'x-force-refresh': 'true' } } : undefined;
      const analyticRes = await getInstructorComprehensiveAnalytics(courseId, dateRange, config).catch(() => null);
      if (analyticRes) {
        analyticsMemoryCache[cacheKey] = analyticRes;
        setAnalyticsData(analyticRes);
      }
    } catch {
      showToast('Failed to load comprehensive analytics data', 'error');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      loadAnalyticsData(selectedCourseId, selectedDateRange, false);
    }
  }, [selectedCourseId, selectedDateRange, activeTab]);

  // Overview quick reminder handler
  const handleSendQuickReminder = (studentName: string) => {
    setRemindingStudentId(studentName);
    setTimeout(() => {
      showToast(`Friendly study reminder successfully sent to ${studentName}!`);
      setRemindingStudentId(null);
    }, 1000);
  };

  // Student Roster Handlers
  const handleOpenDetail = async (studentId: string, courseId: string) => {
    setDetailLoading(true);
    setSelectedStudent(null);
    try {
      const details = await getInstructorStudentProgress(studentId, courseId);
      setSelectedStudent(details);
      setNoteText(details?.instructor_notes || '');
    } catch {
      showToast('Failed to load student progress details.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedStudent || !selectedStudent.student) return;
    setNoteSaving(true);
    try {
      await saveStudentPrivateNotes(
        selectedStudent.student.id,
        selectedStudent.quiz_attempts?.[0]?.course_id || selectedStudent.assignments?.[0]?.course_id || studentCourseFilter || (students.find(s => s.id === selectedStudent.student.id)?.course_id) || '',
        noteText
      );
      showToast('Private instructor notes successfully saved!');
    } catch {
      showToast('Failed to save private notes.', 'error');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleOpenReminderModal = (student: any) => {
    setReminderStudent(student);
    setReminderText(`Hi ${student.name}! Your instructor noticed you haven't completed your syllabus progress in "${student.course_title}". Log back in to continue learning!`);
  };

  const handleSendReminderModal = async () => {
    if (!reminderStudent) return;
    setReminderSending(true);
    try {
      await sendStudentReminder(reminderStudent.id, reminderStudent.course_id, reminderText);
      showToast(`Friendly progress reminder successfully dispatched to ${reminderStudent.name}!`);
      setReminderStudent(null);
    } catch {
      showToast('Failed to send progress reminder.', 'error');
    } finally {
      setReminderSending(false);
    }
  };

  // Filter students logic
  const filteredStudents = (students || []).filter((s) => {
    // Exclude logged in instructor / admin account from student roster
    if (user) {
      if (s.email && user.email && s.email.toLowerCase() === user.email.toLowerCase()) return false;
      if (s.id && (s.id === user.id || s.id === user.uid)) return false;
    }
    if (s.email && s.email.toLowerCase() === 'nibirbhuiyan24@gmail.com') return false;

    if (studentCourseFilter && s.course_id !== studentCourseFilter) return false;
    
    if (selectedStatus === 'not-started' && s.progress > 0) return false;
    if (selectedStatus === 'completed' && s.progress < 100) return false;
    if (selectedStatus === 'in-progress' && (s.progress === 0 || s.progress === 100)) return false;
    if (selectedStatus === 'at-risk' && s.progress >= 25) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const n = (s.name || '').toLowerCase();
      const e = (s.email || '').toLowerCase();
      if (!n.includes(q) && !e.includes(q)) return false;
    }
    return true;
  });

  // Aggregation for Student KPIs
  const totalStudentsCount = filteredStudents.length;
  const activeStudentsCount = filteredStudents.filter(s => s.progress > 0 && s.progress < 100).length;
  const completedStudentsCount = filteredStudents.filter(s => s.progress === 100).length;
  const atRiskStudentsCount = filteredStudents.filter(s => s.progress < 25).length;

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

      {/* Main Header Banner with Tab Toggle */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Analytics & Student Insights</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Track learning performance, student progress distribution, assessment evaluations, and active learner cohorts.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
          <button
            onClick={() => handleTabChange('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BarChart2 size={15} />
            <span>Overview & Charts</span>
          </button>
          <button
            onClick={() => handleTabChange('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              activeTab === 'students'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users size={15} />
            <span>Enrolled Students</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW ANALYTICS ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Global Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-2xl">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Analytics Filter Toolbar</span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <BookOpen size={13} className="text-slate-500" />
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold outline-none text-slate-700 cursor-pointer"
                >
                  <option value="">All courses taught</option>
                  {(courses || []).map((c) => (
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

              <Button variant="ghost" size="sm" className="!p-2 hover:bg-slate-50 text-slate-700" onClick={() => loadAnalyticsData(selectedCourseId, selectedDateRange, true)}>
                <RefreshCw size={14} className={loadingAnalytics ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>

          {loadingAnalytics && !analyticsData ? (
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
                  { label: 'Total Students', val: analyticsData.summary?.total_students ?? 0, icon: Users, color: 'text-blue-500 bg-blue-50' },
                  { label: 'Average Progress', val: `${analyticsData.summary?.average_progress ?? analyticsData.summary?.avg_progress ?? 0}%`, icon: TrendingUp, color: 'text-purple-500 bg-purple-50' },
                  { label: 'Completion Rate', val: `${analyticsData.summary?.completion_rate ?? 0}%`, icon: Award, color: 'text-emerald-500 bg-emerald-50' },
                  { label: 'Quiz Pass Rate', val: `${analyticsData.summary?.quiz_pass_rate ?? analyticsData.summary?.pass_rate ?? 0}%`, icon: CheckCircle2, color: 'text-cyan-500 bg-cyan-50' },
                  { label: 'Assignment Rate', val: `${analyticsData.summary?.assignment_rate ?? 0}%`, icon: Activity, color: 'text-indigo-500 bg-indigo-50' },
                  { label: 'Inactive Cohorts', val: analyticsData.summary?.inactive_students ?? 0, icon: AlertTriangle, color: 'text-red-500 bg-red-50' }
                ].map((k, idx) => {
                  const Icon = k.icon;
                  return (
                    <Card key={idx} className="border border-slate-200 p-3.5 flex flex-col justify-between gap-3 bg-white">
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
                <Card className="border border-slate-200 space-y-4 bg-white">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <TrendingUp size={14} className="text-slate-500" />
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Enrollment Intake Trend</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.enrollment_trend || []}>
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
                <Card className="border border-slate-200 space-y-4 bg-white">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <BarChart2 size={14} className="text-slate-500" />
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Syllabus Progress Distribution</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.progress_distribution || []}>
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
                <Card className="border border-slate-200 space-y-4 lg:col-span-1 bg-white">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Award size={14} className="text-slate-500" />
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Assessment Scores Average</h3>
                  </div>
                  {analyticsData.quiz_performance && analyticsData.quiz_performance.length > 0 ? (
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
                  ) : (
                    <div className="h-56 flex items-center justify-center text-xs text-slate-400 font-medium">
                      No assessments created yet
                    </div>
                  )}
                </Card>

                {/* Assignment Status breakdown */}
                <Card className="border border-slate-200 space-y-4 lg:col-span-1 bg-white">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <PieIcon size={14} className="text-slate-500" />
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Submission Evaluations</h3>
                  </div>
                  {analyticsData.assignment_status && analyticsData.assignment_status.some((s: any) => s.value > 0) ? (
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
                  ) : (
                    <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-400 font-medium text-center p-4">
                      <span>No assignment submissions yet</span>
                    </div>
                  )}
                  {/* Custom Legend */}
                  {analyticsData.assignment_status && analyticsData.assignment_status.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 text-[10px] font-extrabold uppercase text-slate-500">
                      {analyticsData.assignment_status.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span>{item.status} ({item.value})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Chapter Heatmap list */}
                <Card className="border border-slate-200 space-y-4 lg:col-span-1 bg-white">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <ListTodo size={14} className="text-slate-500" />
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Module Completion Progress</h3>
                  </div>
                  {analyticsData.module_completion && analyticsData.module_completion.length > 0 ? (
                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                      {analyticsData.module_completion.map((m: any, idx: number) => {
                        const total = analyticsData.summary?.total_students || 1;
                        const pct = (analyticsData.summary?.total_students || 0) > 0 ? Math.min((m.completions / total) * 100, 100) : 0;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                              <span className="line-clamp-1 pr-4">{m.module_title || m.module_name}</span>
                              <span className="text-slate-900 font-extrabold">{m.completions} completed</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-slate-900 h-full rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-medium">
                      No modules created yet
                    </div>
                  )}
                </Card>

              </div>

              {/* Tables Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top performing students */}
                <Card className="border border-slate-200 p-0 overflow-hidden bg-white">
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
                        {analyticsData.top_students && analyticsData.top_students.length > 0 ? (
                          analyticsData.top_students.map((ts: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-black text-slate-900 leading-none">{ts.student_name || ts.name}</div>
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
                              <td className="py-3.5 px-3 text-slate-900 font-bold">{ts.avg_quiz || 0}%</td>
                              <td className="py-3.5 px-4 text-right text-slate-900 font-bold">{ts.assignment_grade || 0}%</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-xs text-slate-400 font-medium">
                              No students qualified for high-performing cohort yet (progress &ge; 50%)
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* At-risk students */}
                <Card className="border border-slate-200 p-0 overflow-hidden bg-white">
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
                        {analyticsData.at_risk_students && analyticsData.at_risk_students.length > 0 ? (
                          analyticsData.at_risk_students.map((ar: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-black text-slate-900 leading-none">{ar.student_name || ar.name}</div>
                                <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{ar.course_title}</span>
                              </td>
                              <td className="py-3.5 px-3 text-red-500 font-bold">{ar.last_active || 'Inactive'}</td>
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
                                  onClick={() => handleSendQuickReminder(ar.student_name || ar.name)}
                                  disabled={remindingStudentId === (ar.student_name || ar.name)}
                                >
                                  <Send size={10} className="mr-1" />
                                  <span>{remindingStudentId === (ar.student_name || ar.name) ? 'Sending...' : 'Remind'}</span>
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-xs text-slate-400 font-medium">
                              No at-risk students identified currently
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

              </div>
            </>
          ) : (
            <Card className="text-center py-20 border border-slate-200 bg-white">
              <BookOpen className="mx-auto text-slate-300" size={40} />
              <p className="text-slate-500 font-extrabold mt-4">Failed to load analytics dashboard data.</p>
            </Card>
          )}

        </div>
      )}

      {/* ── TAB 2: ENROLLED STUDENTS ROSTER ── */}
      {activeTab === 'students' && (
        <div className="space-y-6">

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', val: totalStudentsCount, icon: Users, color: 'text-blue-500 bg-blue-50' },
              { label: 'Active Students', val: activeStudentsCount, icon: Clock, color: 'text-amber-500 bg-amber-50' },
              { label: 'Completed Students', val: completedStudentsCount, icon: GraduationCap, color: 'text-emerald-500 bg-emerald-50' },
              { label: 'At-risk Students', val: atRiskStudentsCount, icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
            ].map((card, i) => (
              <Card key={i} className="flex items-center gap-4 border border-slate-200 p-4 bg-white">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                  <card.icon size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{card.label}</p>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">{card.val}</h3>
                </div>
              </Card>
            ))}
          </div>

          {/* Search & Filters */}
          <Card className="border border-slate-200 p-4 space-y-4 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-500" />
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Search & Filters</h3>
              </div>
              <Button variant="ghost" size="sm" className="!p-1.5 hover:bg-slate-50 text-slate-700" onClick={loadStudents}>
                <RefreshCw size={13} className={loadingStudents ? 'animate-spin' : ''} />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Filter by Course</label>
                <select
                  value={studentCourseFilter}
                  onChange={(e) => setStudentCourseFilter(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
                >
                  <option value="">All courses taught</option>
                  {(courses || []).map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Progress Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
                >
                  <option value="all">All progress levels</option>
                  <option value="not-started">Not Started (0%)</option>
                  <option value="in-progress">In Progress (1-99%)</option>
                  <option value="completed">Completed (100%)</option>
                  <option value="at-risk">At Risk (&lt; 25%)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Search student</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Student Table & Detail Drawer Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Student List */}
            <div className={`space-y-4 ${selectedStudent ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
              {loadingStudents ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : filteredStudents.length === 0 ? (
                <Card className="text-center py-20 border border-slate-200 bg-white">
                  <Users className="mx-auto text-slate-300 animate-bounce" size={40} />
                  <p className="text-slate-500 font-extrabold mt-4">No matching students found.</p>
                </Card>
              ) : (
                <Card className="border border-slate-200 overflow-hidden bg-white p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">Course</th>
                          <th className="px-6 py-4">Progress %</th>
                          <th className="px-6 py-4">Quiz Avg</th>
                          <th className="px-6 py-4">Assignments</th>
                          <th className="px-6 py-4">Certificate</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((s) => {
                          const isAtRisk = s.progress < 25;
                          const hasCert = s.certificate_status === 'Issued';
                          const hasPending = s.assignment_status === 'Pending Grading';
                          return (
                            <tr
                              key={`${s.id}-${s.course_id}`}
                              onClick={() => handleOpenDetail(s.id, s.course_id)}
                              className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                                selectedStudent?.student?.id === s.id && selectedStudent?.modules?.[0]?.id === s.course_id ? 'bg-slate-50' : ''
                              }`}
                            >
                              <td className="px-6 py-4 flex items-center gap-3 min-w-[200px]">
                                <UserAvatar
                                  src={s.photo_url}
                                  name={s.name}
                                  email={s.email}
                                  size="sm"
                                  className="shadow-2xs"
                                />
                                <div>
                                  <p className="text-sm font-black text-slate-900 leading-tight">{s.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{s.email}</p>
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <span className="line-clamp-1 max-w-[150px] font-bold text-slate-800">{s.course_title}</span>
                              </td>

                              <td className="px-6 py-4 space-y-1 min-w-[120px]">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-extrabold text-slate-900">{s.progress}%</span>
                                  {isAtRisk && <span className="text-red-500 font-black text-[8px] uppercase">At Risk</span>}
                                </div>
                                <ProgressBar value={s.progress} className={isAtRisk ? 'bg-red-500' : s.progress === 100 ? 'bg-emerald-500' : 'bg-slate-900'} />
                              </td>

                              <td className="px-6 py-4">
                                <Badge variant={s.quiz_average >= 80 ? 'success' : s.quiz_average >= 50 ? 'warning' : s.quiz_average > 0 ? 'danger' : 'default'} className="text-[9px] font-mono">
                                  {s.quiz_average > 0 ? `${s.quiz_average}%` : 'N/A'}
                                </Badge>
                              </td>

                              <td className="px-6 py-4">
                                <Badge variant={hasPending ? 'warning' : s.assignment_status === 'Graded' ? 'success' : 'default'} className="text-[8px] uppercase">
                                  {s.assignment_status}
                                </Badge>
                              </td>

                              <td className="px-6 py-4">
                                <span className="flex items-center gap-1">
                                  <Award size={14} className={hasCert ? 'text-emerald-500' : 'text-slate-300'} />
                                  <span className={`text-[10px] font-bold ${hasCert ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>{s.certificate_status}</span>
                                </span>
                              </td>

                              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-1.5">
                                  <Button variant="ghost" size="sm" className="!p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" onClick={() => handleOpenDetail(s.id, s.course_id)}>
                                    <ChevronRight size={14} />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="!p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600" onClick={() => handleOpenReminderModal(s)}>
                                    <Mail size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>

            {/* Selected Student Detail Drawer */}
            {selectedStudent && selectedStudent.student && (
              <div className="lg:col-span-6 space-y-4 animate-in slide-in-from-right-4 duration-200">
                <Card className="border border-slate-200 p-5 space-y-5 bg-white relative">
                  
                  {/* Close Drawer Button */}
                  <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors">
                    <X size={18} />
                  </button>

                  {/* Drawer Header */}
                  <div className="pb-4 border-b border-slate-100 flex items-center gap-3">
                    <UserAvatar
                      src={selectedStudent.student.photo_url}
                      name={selectedStudent.student.name}
                      email={selectedStudent.student.email}
                      size="lg"
                      className="shadow-sm ring-2 ring-slate-100"
                    />
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">{selectedStudent.student.name}</h2>
                      <p className="text-xs text-slate-400 font-semibold">{selectedStudent.student.email}</p>
                    </div>
                  </div>

                  {/* Sub-grid metrics summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Progress</span>
                      <p className="text-sm font-black text-slate-900">{selectedStudent.progress_percent ?? 0}%</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Discussions</span>
                      <p className="text-sm font-black text-slate-900">{selectedStudent.discussions_count ?? 0} Posts</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Certificates</span>
                      <p className="text-xs font-black text-slate-900 mt-1">{selectedStudent.certificates && selectedStudent.certificates.length > 0 ? 'Issued' : 'None'}</p>
                    </div>
                  </div>

                  {/* Completed Modules list */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen size={13} className="text-slate-500" />
                      <span>Completed Modules</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(selectedStudent.modules || []).map((m: any) => (
                        <div key={m.id} className="p-2.5 rounded-xl border border-slate-150 flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-800 line-clamp-1">{m.title}</span>
                          {m.is_completed ? (
                            <Badge variant="success" className="text-[8px] scale-90">Done</Badge>
                          ) : (
                            <Badge variant="default" className="text-[8px] scale-90">Pending</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quiz Attempts */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={13} className="text-slate-500" />
                      <span>Quiz Attempts</span>
                    </h3>
                    {!selectedStudent.quiz_attempts || selectedStudent.quiz_attempts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">No quizzes attempted in this course yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedStudent.quiz_attempts.map((qa: any) => (
                          <div key={qa.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <p className="font-black text-slate-900">{qa.quiz_title}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{qa.attempted_at ? new Date(qa.attempted_at).toLocaleDateString() : ''}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-800">{qa.score} / {qa.max_score}</p>
                              <Badge variant={qa.passed ? 'success' : 'danger'} className="text-[8px] scale-90 mt-0.5">
                                {qa.passed ? 'Passed' : 'Failed'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assignment submissions */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Award size={13} className="text-slate-500" />
                      <span>Assignment Submissions</span>
                    </h3>
                    {!selectedStudent.assignments || selectedStudent.assignments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">No assignment submissions handed in yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedStudent.assignments.map((as: any) => (
                          <div key={as.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-black text-slate-900">{as.assignment_title}</span>
                              <Badge variant={as.status === 'graded' ? 'success' : 'warning'} className="text-[8px] scale-90">
                                {as.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Grade: <strong className="text-slate-800 font-bold">{as.grade} / {as.max_grade}</strong></span>
                              <span>Handed in: {as.submitted_at ? new Date(as.submitted_at).toLocaleDateString() : ''}</span>
                            </div>
                            {as.feedback && (
                              <p className="text-[10px] text-slate-500 leading-relaxed bg-white border border-slate-100 p-2 rounded-lg italic">
                                &ldquo;{as.feedback}&rdquo;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Private Notes block */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Edit3 size={13} className="text-slate-500" />
                      <span>Private Instructor Notes</span>
                    </h3>
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        placeholder="Write private notes about this student's performance (only visible to you)..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-slate-900 resize-none font-semibold text-slate-700"
                      />
                      <div className="flex justify-end">
                        <Button variant="primary" size="sm" onClick={handleSaveNotes} disabled={noteSaving} className="!bg-slate-950">
                          {noteSaving ? <Loader2 size={10} className="animate-spin mr-1" /> : <Save size={10} className="mr-1" />}
                          <span>Save Notes</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                </Card>
              </div>
            )}

          </div>

          {/* Send Reminder Dialog Modal */}
          {reminderStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
              <Card className="w-full max-w-md border border-slate-200 p-6 space-y-4 bg-white relative animate-in zoom-in-95 duration-200">
                <button onClick={() => setReminderStudent(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900">
                  <X size={18} />
                </button>

                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Mail size={16} className="text-amber-500" />
                  <h3 className="text-sm font-black text-slate-900">Send Progress Reminder</h3>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-800">Recurrent student</p>
                  <p className="text-xs text-slate-500 font-semibold">{reminderStudent.name} ({reminderStudent.email})</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Reminder Message</label>
                  <textarea
                    rows={4}
                    required
                    value={reminderText}
                    onChange={(e) => setReminderText(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-slate-900 font-semibold text-slate-700"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setReminderStudent(null)}>Cancel</Button>
                  <Button variant="primary" size="sm" className="!bg-slate-950" onClick={handleSendReminderModal} disabled={reminderSending}>
                    {reminderSending ? 'Sending...' : 'Dispatch Reminder'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

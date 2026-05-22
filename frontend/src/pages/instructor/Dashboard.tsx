import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, CheckCircle, FileEdit, Users, ClipboardList, Award,
  BarChart3, ArrowRight, Plus, Layers, PenSquare, Megaphone,
  Eye, Archive, Send, AlertTriangle, Clock, TrendingUp,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import {
  getInstructorDashboardSummary,
  type InstructorDashboardSummary,
  type InstructorCourse,
  type RecentActivity,
  type PendingSubmission,
  type CoursePerformance,
  type AtRiskStudent,
} from '../../services/instructorService';
import { publishCourse, archiveCourse } from '../../services/courseService';
import { formatDate } from '../../lib/utils';

/* ── Skeleton placeholder ── */
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

/* ── Tiny bar for performance chart ── */
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2.5">
      <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<InstructorDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getInstructorDashboardSummary()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handlePublish = async (id: string) => {
    try { await publishCourse(id); toast('Course published'); load(); } catch { toast('Failed to publish'); }
  };
  const handleArchive = async (id: string) => {
    try { await archiveCourse(id); toast('Course archived'); load(); } catch { toast('Failed to archive'); }
  };

  /* ── KPI definitions ── */
  const kpis = data
    ? [
        { label: 'Total Courses', value: data.total_courses, icon: BookOpen, bg: 'bg-blue-50', fg: 'text-blue-600' },
        { label: 'Published', value: data.published_courses, icon: CheckCircle, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
        { label: 'Draft', value: data.draft_courses, icon: FileEdit, bg: 'bg-amber-50', fg: 'text-amber-600' },
        { label: 'Enrollments', value: data.total_enrollments, icon: Users, bg: 'bg-rose-50', fg: 'text-rose-600' },
        { label: 'Pending Subs.', value: data.pending_submissions, icon: ClipboardList, bg: 'bg-orange-50', fg: 'text-orange-600' },
        { label: 'Avg Completion', value: `${data.average_completion_rate}%`, icon: TrendingUp, bg: 'bg-teal-50', fg: 'text-teal-600' },
        { label: 'Quizzes', value: data.total_quizzes, icon: Award, bg: 'bg-purple-50', fg: 'text-purple-600' },
        { label: 'Assignments', value: data.total_assignments, icon: ClipboardList, bg: 'bg-indigo-50', fg: 'text-indigo-600' },
      ]
    : [];

  const quickActions = [
    { label: 'Create Course', icon: Plus, href: '/instructor/create-course', color: 'bg-blue-600 text-white' },
    { label: 'Course Builder', icon: Layers, href: '/instructor/course-builder', color: 'bg-slate-900 text-white' },
    { label: 'Create Quiz', icon: PenSquare, href: '/instructor/quizzes', color: 'bg-purple-600 text-white' },
    { label: 'Create Assignment', icon: ClipboardList, href: '/instructor/assignments', color: 'bg-teal-600 text-white' },
    { label: 'View Submissions', icon: Eye, href: '/instructor/submissions', color: 'bg-orange-600 text-white' },
    { label: 'Post Announcement', icon: Megaphone, href: '/instructor/courses', color: 'bg-rose-600 text-white' },
  ];

  const statusBadge = (s: string) => {
    const map: Record<string, 'success' | 'warning' | 'default' | 'info'> = {
      published: 'success', archived: 'warning', draft: 'default',
    };
    return <Badge variant={map[s] || 'default'}>{s || 'draft'}</Badge>;
  };

  const maxEnroll = data ? Math.max(...(data.course_performance.map((p) => p.enrollments)), 1) : 1;

  /* ───────── RENDER ───────── */
  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-2">
          {toastMsg}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Instructor Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your courses, students, assessments, and learning performance.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/instructor/analytics">
            <Button variant="outline" size="sm"><BarChart3 size={16} /> View Analytics</Button>
          </Link>
          <Link to="/instructor/create-course">
            <Button variant="primary" size="sm" className="!bg-slate-900"><Plus size={16} /> Create New Course</Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="flex items-center gap-3 text-red-600">
          <AlertTriangle size={20} /> <span className="text-sm font-semibold">{error}</span>
          <Button variant="ghost" size="sm" onClick={load}>Retry</Button>
        </Card>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="flex flex-col justify-between min-h-[130px]">
              <Skeleton className="w-12 h-12" />
              <div className="mt-4 space-y-2"><Skeleton className="h-6 w-16" /><Skeleton className="h-3 w-24" /></div>
            </Card>
          ))}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label} className="flex flex-col justify-between min-h-[130px]">
                <div className={`w-12 h-12 rounded-2xl ${k.bg} flex items-center justify-center`}>
                  <Icon className={k.fg} size={20} />
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-black text-slate-900">{String(k.value).padStart(2, '0')}</div>
                  <div className="text-[10px] tracking-wider text-slate-500 font-extrabold uppercase mt-1">{k.label}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <Card className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} to={a.href} className={`flex flex-col items-center gap-2 p-4 rounded-2xl text-center transition-transform hover:scale-[1.03] ${a.color}`}>
                <Icon size={22} />
                <span className="text-xs font-bold leading-tight">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* My Courses Table */}
      <Card padding="none" className="space-y-0">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">My Courses</h2>
          <Link to="/instructor/courses" className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !data || data.courses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto text-slate-300" size={40} />
            <p className="text-sm text-slate-500 mt-3 font-medium">No courses yet. Create your first course to get started!</p>
            <Link to="/instructor/course-builder"><Button variant="primary" size="sm" className="mt-4 !bg-slate-900"><Plus size={14} /> Create Course</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 border-y border-slate-200">
                <tr>
                  {['Title','Status','Enrollments','Modules','Quizzes','Assignments','Completion','Updated','Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.courses.slice(0, 8).map((c: InstructorCourse) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 max-w-[200px] truncate">{c.title}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-slate-600">{c.enrollment_count}</td>
                    <td className="px-4 py-3 text-slate-600">{c.module_count}</td>
                    <td className="px-4 py-3 text-slate-600">{c.quiz_count}</td>
                    <td className="px-4 py-3 text-slate-600">{c.assignment_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5"><div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${c.completion_rate}%` }} /></div>
                        <span className="text-xs font-bold text-slate-600">{c.completion_rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.updated_at ? formatDate(c.updated_at) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link to="/instructor/course-builder"><Button variant="ghost" size="sm" title="Edit"><PenSquare size={14} /></Button></Link>
                        <Link to="/instructor/course-builder"><Button variant="ghost" size="sm" title="Builder"><Layers size={14} /></Button></Link>
                        {c.status !== 'published' && <Button variant="ghost" size="sm" title="Publish" onClick={() => handlePublish(c.id)}><Send size={14} /></Button>}
                        {c.status === 'published' && <Button variant="ghost" size="sm" title="Archive" onClick={() => handleArchive(c.id)}><Archive size={14} /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Two-column: Recent Activity + Pending Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Student Activity */}
        <Card className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Clock size={16} className="text-slate-400" /> Recent Activity</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !data || data.recent_activity.length === 0 ? (
            <div className="py-8 text-center"><Users className="mx-auto text-slate-300" size={32} /><p className="text-sm text-slate-500 mt-2">No recent student activity yet.</p></div>
          ) : (
            <div className="space-y-2">
              {data.recent_activity.map((a: RecentActivity, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {a.student_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{a.student_name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{a.activity} — {a.course_title}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{a.time ? formatDate(a.time) : ''}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Submissions */}
        <Card className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2"><ClipboardList size={16} className="text-slate-400" /> Pending Submissions</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !data || data.pending_submissions_list.length === 0 ? (
            <div className="py-8 text-center"><CheckCircle className="mx-auto text-emerald-300" size={32} /><p className="text-sm text-slate-500 mt-2">All submissions have been graded! 🎉</p></div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Student','Course','Assignment','Submitted','Action'].map((h) => (
                      <th key={h} className="text-left px-4 py-2 text-[10px] font-extrabold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.pending_submissions_list.map((s: PendingSubmission) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">{s.student_name}</td>
                      <td className="px-4 py-2.5 text-slate-600 max-w-[120px] truncate">{s.course_title}</td>
                      <td className="px-4 py-2.5 text-slate-600 max-w-[120px] truncate">{s.assignment_title}</td>
                      <td className="px-4 py-2.5 text-slate-500">{s.submitted_at ? formatDate(s.submitted_at) : '—'}</td>
                      <td className="px-4 py-2.5">
                        <Link to="/instructor/submissions"><Button variant="primary" size="sm" className="!bg-slate-900 !px-2.5 !py-1 !text-[10px]">Grade</Button></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Two-column: Course Performance + At-Risk Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Performance */}
        <Card className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2"><BarChart3 size={16} className="text-slate-400" /> Course Performance</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !data || data.course_performance.length === 0 ? (
            <div className="py-8 text-center"><BarChart3 className="mx-auto text-slate-300" size={32} /><p className="text-sm text-slate-500 mt-2">No course performance data yet.</p></div>
          ) : (
            <div className="space-y-5">
              {data.course_performance.map((cp: CoursePerformance) => (
                <div key={cp.course_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[60%]">{cp.course_title}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{cp.enrollments} enrolled</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1 font-medium">Enrollments</p>
                      <MiniBar value={cp.enrollments} max={maxEnroll} color="bg-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1 font-medium">Completion {cp.completion_rate}%</p>
                      <MiniBar value={cp.completion_rate} max={100} color="bg-emerald-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* At-Risk Students */}
        <Card className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> At-Risk Students</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !data || data.at_risk_students.length === 0 ? (
            <div className="py-8 text-center"><CheckCircle className="mx-auto text-emerald-300" size={32} /><p className="text-sm text-slate-500 mt-2">No at-risk students detected. Great job!</p></div>
          ) : (
            <div className="space-y-2">
              {data.at_risk_students.map((s: AtRiskStudent, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {s.student_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{s.student_name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{s.course_title}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-black text-amber-700">{s.progress}%</div>
                    <div className="text-[9px] text-slate-400 font-medium">progress</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

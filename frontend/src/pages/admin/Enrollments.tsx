/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Search,
  UserPlus,
  Trash2,
  CheckCircle2,
  Clock,
  BookOpen,
  Filter,
  RefreshCw,
  Award,
  GraduationCap
} from 'lucide-react';
import {
  getAdminEnrollments,
  createAdminEnrollment,
  updateAdminEnrollment,
  deleteAdminEnrollment,
  getAllUsers,
} from '../../services/adminService';
import { getCourses } from '../../services/courseService';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import UserAvatar from '../../components/ui/UserAvatar';

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Manual Enroll Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [ens, cs, stus] = await Promise.all([
        getAdminEnrollments({
          search: search || undefined,
          course_id: courseFilter || undefined,
          status: statusFilter || undefined,
        }),
        getCourses().catch(() => []),
        getAllUsers({ role: 'student', limit: 300 }).catch(() => []),
      ]);
      setEnrollments(ens);
      setCourses(cs);
      setStudents(stus);
    } catch (err: any) {
      console.error('Failed to load enrollments data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleManualEnroll = async () => {
    if (!selectedStudentId || !selectedCourseId) {
      setMsg({ text: 'Please select both a student and a course.', type: 'error' });
      return;
    }
    setEnrolling(true);
    try {
      await createAdminEnrollment({ user_id: selectedStudentId, course_id: selectedCourseId });
      setMsg({ text: 'Student successfully enrolled into course!', type: 'success' });
      setShowModal(false);
      setSelectedStudentId('');
      setSelectedCourseId('');
      loadData();
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.detail || 'Failed to enroll student.', type: 'error' });
    } finally {
      setEnrolling(false);
    }
  };

  const handleToggleStatus = async (item: any) => {
    const nextStatus = item.status === 'completed' ? 'active' : 'completed';
    try {
      await updateAdminEnrollment(item.id, {
        status: nextStatus,
        progress_percent: nextStatus === 'completed' ? 100 : item.progress_percent || 0,
      });
      setMsg({ text: `Enrollment status marked as ${nextStatus}`, type: 'success' });
      loadData();
    } catch (err: any) {
      setMsg({ text: 'Failed to update enrollment status', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminEnrollment(deleteTarget.id);
      setMsg({ text: 'Student successfully unenrolled from course.', type: 'success' });
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      setMsg({ text: 'Failed to unenroll student', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Summary Metrics
  const totalCount = enrollments.length;
  const activeCount = enrollments.filter((e) => e.status !== 'completed').length;
  const completedCount = enrollments.filter((e) => e.status === 'completed' || (e.progress_percent || 0) >= 100).length;
  const avgProgress = totalCount > 0
    ? Math.round(enrollments.reduce((acc, curr) => acc + (curr.progress_percent || 0), 0) / totalCount)
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Enrollments Management"
        description="Monitor student progress, handle course enrollments, and track completions."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setLoading(true); loadData(); }}
              className="gap-1.5"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowModal(true)}
              className="!bg-navy-900 dark:!bg-teal-600 gap-1.5"
            >
              <UserPlus size={16} />
              Manual Enrollment
            </Button>
          </div>
        }
      />

      {msg && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-all ${
            msg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900'
          }`}
        >
          <span>{msg.text}</span>
          <button type="button" onClick={() => setMsg(null)} className="text-xs font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
            <GraduationCap size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{totalCount}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{activeCount}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Studying</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{completedCount}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
            <Award size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{avgProgress}%</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Progress</p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="space-y-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, or course..."
              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 hidden sm:block" />
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white max-w-[220px]"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>

            <Button type="submit" variant="outline" size="sm">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Enrollments Table */}
      <Card padding="none" className="overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Enrolled Course</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Enrolled Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {enrollments.map((item) => {
                const isCompleted = item.status === 'completed' || (item.progress_percent || 0) >= 100;
                const dateFormatted = item.enrolled_at
                  ? new Date(item.enrolled_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                    {/* Student Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={item.student_photo}
                          name={item.student_name}
                          size="sm"
                        />
                        <div>
                          <p className="font-extrabold text-navy-900 dark:text-white leading-tight">
                            {item.student_name}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            {item.student_email || 'No email provided'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Course Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5 max-w-xs">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.course_image ? (
                            <img src={item.course_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen size={16} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-navy-900 dark:text-slate-200 text-xs truncate">
                            {item.course_title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            Instructor: {item.instructor_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Progress */}
                    <td className="px-6 py-4 w-44">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-navy-900 dark:text-slate-200">
                          <span>{Math.round(item.progress_percent || 0)}%</span>
                        </div>
                        <ProgressBar value={item.progress_percent || 0} />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <Badge variant={isCompleted ? 'success' : 'teal'}>
                        {isCompleted ? 'Completed' : 'Active'}
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {dateFormatted}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(item)}
                          className={`text-xs ${
                            isCompleted ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                        >
                          {isCompleted ? 'Revert to Active' : 'Mark Completed'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(item)}
                          className="text-rose-600 hover:text-rose-700 dark:hover:bg-rose-950/30 p-1.5"
                          title="Unenroll student"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {enrollments.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <GraduationCap size={44} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-base">No enrollments match your filters.</p>
                    <p className="text-xs mt-1">Try clearing your filters or manually enroll a student.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Enrollment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div>
              <h3 className="text-lg font-black text-navy-900 dark:text-white">Manual Student Enrollment</h3>
              <p className="text-xs text-slate-500 mt-1">Select a student and a course to grant instant enrollment.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Student *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                >
                  <option value="">-- Choose a student --</option>
                  {students.map((s) => (
                    <option key={s.id || s.uid} value={s.id || s.uid}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Course *</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                >
                  <option value="">-- Choose a course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.instructor_name || 'Instructor'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="ghost" onClick={() => setShowModal(false)} disabled={enrolling}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleManualEnroll}
                disabled={enrolling || !selectedStudentId || !selectedCourseId}
                className="!bg-teal-600 hover:!bg-teal-700 text-white font-bold"
              >
                {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete / Unenroll Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-sm space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
              <Trash2 size={18} /> Confirm Unenrollment
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to unenroll <strong>{deleteTarget.student_name}</strong> from{' '}
              <strong>{deleteTarget.course_title}</strong>? Their learning progress will be removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {deleting ? 'Unenrolling...' : 'Yes, Unenroll'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

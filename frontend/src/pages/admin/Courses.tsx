/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Search,
  BookOpen,
  Eye,
  Trash2,
  RefreshCw,
  X,
  Play,
  FileText,
  Clock
} from 'lucide-react';
import {
  getCourses,
  adminUpdateCourseStatus,
  getCourseModules
} from '../../services/courseService';
import { getCategories } from '../../services/categoryService';
import { deleteAdminCourse } from '../../services/adminService';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import type { Course } from '../../types';

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Preview Syllabus Modal
  const [previewCourse, setPreviewCourse] = useState<any | null>(null);
  const [courseModules, setCourseModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [cs, cats] = await Promise.all([
        getCourses(),
        getCategories().catch(() => []),
      ]);
      setCourses(cs);
      setCategories(cats);
    } catch (err: any) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await adminUpdateCourseStatus(id, status);
      setMsg({ text: `Course status updated to ${status}.`, type: 'success' });
      loadData();
    } catch {
      setMsg({ text: 'Failed to update course status.', type: 'error' });
    }
  };

  const handleOpenPreview = async (c: Course) => {
    setPreviewCourse(c);
    setLoadingModules(true);
    try {
      const m = await getCourseModules(c.id);
      setCourseModules(m);
    } catch (err) {
      console.error('Failed to load course modules', err);
    } finally {
      setLoadingModules(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminCourse(deleteTarget.id);
      setMsg({ text: `Course "${deleteTarget.title}" and its resources were deleted.`, type: 'success' });
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.detail || 'Failed to delete course.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = courses.filter((c) => {
    if (search && !c.title?.toLowerCase().includes(search.toLowerCase()) && !c.instructor_name?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter && c.status !== statusFilter) return false;
    if (categoryFilter && (c as any).category !== categoryFilter) return false;
    return true;
  });

  // Summary Metrics
  const totalCount = courses.length;
  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const draftCount = courses.filter((c) => c.status === 'draft' || !c.status).length;
  const archivedCount = courses.filter((c) => c.status === 'archived').length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Course Management"
        description="Review instructor submissions, approve courses, inspect syllabi, and manage catalogs."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setLoading(true); loadData(); }}
            className="gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      {msg && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{totalCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Courses</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{publishedCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Published</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{draftCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Draft / In Review</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{archivedCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Archived</p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course title or instructor..."
              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white max-w-[180px]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Courses Table */}
      <Card padding="none" className="overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Instructor</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Students</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((c) => {
                const img = c.thumbnail_url || (c as any).image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600';

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                    {/* Course Title & Thumbnail */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-extrabold text-navy-900 dark:text-white text-xs leading-snug">
                            {c.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">
                            Level: {(c as any).level || 'All levels'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Instructor */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {c.instructor_name || 'Instructor'}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {(c as any).category || 'General'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <Badge variant={c.status === 'published' ? 'success' : c.status === 'archived' ? 'default' : 'warning'}>
                        {c.status || 'draft'}
                      </Badge>
                    </td>

                    {/* Students */}
                    <td className="px-6 py-4 font-bold text-xs text-navy-900 dark:text-slate-200">
                      {c.enrollment_count || 0}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenPreview(c)}
                          className="p-1.5 text-slate-600 hover:text-navy-900 dark:text-slate-300 dark:hover:text-white"
                          title="Inspect course syllabus"
                        >
                          <Eye size={16} />
                        </Button>

                        {c.status !== 'published' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(c.id, 'published')}
                            className="!bg-teal-600 text-white text-xs px-2.5 py-1 font-bold"
                          >
                            Publish
                          </Button>
                        )}

                        {c.status === 'published' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(c.id, 'draft')}
                            className="text-xs px-2.5 py-1"
                          >
                            Unpublish
                          </Button>
                        )}

                        {c.status !== 'archived' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(c.id, 'archived')}
                            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                          >
                            Archive
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(c)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 dark:hover:bg-rose-950/30"
                          title="Delete course"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <BookOpen size={44} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-base">No courses found matching criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Course Syllabus Preview Modal */}
      {previewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-navy-900 dark:text-white leading-tight">
                  {previewCourse.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Instructor: {previewCourse.instructor_name} • Category: {(previewCourse as any).category || 'General'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCourse(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {loadingModules ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading syllabus structure...</div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-extrabold uppercase text-slate-500 text-[11px] tracking-wider">
                  Course Modules &amp; Lessons ({courseModules.length} Modules)
                </h4>

                <div className="space-y-3">
                  {courseModules.map((mod: any, idx: number) => (
                    <div key={mod.id} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 font-bold text-xs text-navy-900 dark:text-slate-200 flex justify-between items-center">
                        <span>Module {idx + 1}: {mod.title}</span>
                        <span className="text-[10px] text-slate-400">{(mod.lessons || []).length} lessons</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
                        {(mod.lessons || []).map((lesson: any) => (
                          <div key={lesson.id} className="px-3 py-2 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {lesson.type === 'video' ? (
                                <Play size={14} className="text-teal-500" />
                              ) : (
                                <FileText size={14} className="text-blue-500" />
                              )}
                              <span className="font-medium text-slate-700 dark:text-slate-300">{lesson.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{lesson.estimated_duration || 10} min</span>
                          </div>
                        ))}
                        {(mod.lessons || []).length === 0 && (
                          <p className="text-[11px] text-slate-400 p-2">No lessons added to this module yet.</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {courseModules.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No modules configured for this course.</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setPreviewCourse(null)}>
                Close Preview
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-sm space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
              <Trash2 size={18} /> Delete Course
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>? All modules, lessons, quizzes, and enrollments will be permanently removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Course'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Megaphone, Search, BookOpen, CheckCircle2,
  Clock, Sparkles, Layers, ArrowRight,
  CheckCheck, RefreshCw, BellRing
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import {
  getStudentAnnouncements,
  markAnnouncementAsRead,
  markAllAnnouncementsAsRead,
  type StudentAnnouncementsPayload
} from '../../services/announcementService';
import { getCourseModules } from '../../services/courseService';

export default function StudentAnnouncements() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  // Filters
  const initialCourseId = searchParams.get('course_id') || '';
  const initialModuleId = searchParams.get('module_id') || '';
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(initialModuleId);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Course modules for dropdown
  const [modules, setModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const loadData = async (cId?: string, mId?: string) => {
    setLoading(true);
    try {
      const res: StudentAnnouncementsPayload = await getStudentAnnouncements({
        courseId: cId || undefined,
        moduleId: mId || undefined,
      });
      setAnnouncements(res.announcements || []);
      setUnreadCount(res.unread_count || 0);
      if (res.enrolled_courses) {
        setEnrolledCourses(res.enrolled_courses);
      }
    } catch {
      showToast('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedCourseId, selectedModuleId);
  }, [selectedCourseId, selectedModuleId]);

  // Load modules when selectedCourseId changes
  useEffect(() => {
    if (selectedCourseId) {
      setLoadingModules(true);
      getCourseModules(selectedCourseId)
        .then((mList) => setModules(mList || []))
        .catch(() => setModules([]))
        .finally(() => setLoadingModules(false));
    } else {
      setModules([]);
      setSelectedModuleId('');
    }
  }, [selectedCourseId]);

  const handleMarkAsRead = async (annId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await markAnnouncementAsRead(annId);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === annId ? { ...a, is_read: true } : a))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      // Notify sidebar badge
      window.dispatchEvent(new CustomEvent('announcements-updated'));
    } catch {
      showToast('Could not update read status.');
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllAnnouncementsAsRead();
      setAnnouncements((prev) => prev.map((a) => ({ ...a, is_read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('announcements-updated'));
      showToast('All announcements marked as read.');
    } catch {
      showToast('Failed to mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  // Filter announcements client-side for search query and read/unread tab
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      // Status filter
      if (selectedStatus === 'unread' && item.is_read) return false;
      if (selectedStatus === 'read' && !item.is_read) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const contentMatch = item.content?.toLowerCase().includes(q);
        const courseMatch = item.course_title?.toLowerCase().includes(q);
        const modMatch = item.module_title?.toLowerCase().includes(q);
        if (!titleMatch && !contentMatch && !courseMatch && !modMatch) return false;
      }

      return true;
    });
  }, [announcements, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in flex items-center gap-2">
          <Sparkles size={14} className="text-teal-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-navy-900 dark:bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-navy-950/10">
            <Megaphone size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Announcements</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Important course notices, schedule alerts, and module-specific announcements from your instructors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-xs font-bold gap-1.5 border-slate-200 hover:bg-slate-50 dark:border-slate-800"
            >
              <CheckCheck size={14} className="text-teal-600 dark:text-teal-400" />
              <span>{markingAll ? 'Marking...' : 'Mark all as read'}</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadData(selectedCourseId, selectedModuleId)}
            className="!p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card padding="sm" className="space-y-3 dark:bg-slate-900 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-navy-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-teal-500"
            />
          </div>

          {/* Course Filter Dropdown */}
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 dark:bg-slate-950 dark:border-slate-800">
            <BookOpen size={14} className="text-slate-400 mr-2 shrink-0" />
            <select
              value={selectedCourseId}
              onChange={(e) => {
                const cid = e.target.value;
                setSelectedCourseId(cid);
                setSelectedModuleId('');
                setSearchParams(cid ? { course_id: cid } : {});
              }}
              className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer truncate"
            >
              <option value="" className="dark:bg-slate-900">All Enrolled Courses</option>
              {enrolledCourses.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-slate-900">
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Module Filter Dropdown */}
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 dark:bg-slate-950 dark:border-slate-800">
            <Layers size={14} className="text-slate-400 mr-2 shrink-0" />
            <select
              value={selectedModuleId}
              disabled={!selectedCourseId || loadingModules}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer truncate disabled:opacity-50"
            >
              <option value="" className="dark:bg-slate-900">
                {!selectedCourseId ? 'Select Course first for Modules' : loadingModules ? 'Loading Modules...' : 'All Modules'}
              </option>
              {modules.map((m, idx) => (
                <option key={m.id} value={m.id} className="dark:bg-slate-900">
                  Module {idx + 1}: {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Read / Unread Status Tab Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl dark:bg-slate-800">
            {(['all', 'unread', 'read'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg capitalize transition-all ${
                  selectedStatus === st
                    ? 'bg-white text-navy-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="text-center py-16 border border-slate-200/80 dark:border-slate-800">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <BellRing size={28} />
          </div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No announcements found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedStatus === 'unread'
              ? 'You have caught up with all announcements! No unread notices.'
              : selectedCourseId
              ? 'No announcements posted for the selected course or module yet.'
              : 'Your instructors have not posted any announcements for your enrolled courses yet.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => {
            const isUnread = !ann.is_read;
            const isUrgent = ann.priority === 'urgent';
            const isImportant = ann.priority === 'important';
            const isModuleTargeted = ann.target === 'module' && !!ann.module_title;

            return (
              <div
                key={ann.id}
                onClick={() => isUnread && handleMarkAsRead(ann.id)}
                className={`relative rounded-2xl border transition-all p-5 ${
                  isUnread
                    ? 'bg-white border-teal-500/40 shadow-md shadow-teal-500/5 ring-1 ring-teal-500/20 dark:bg-slate-900 dark:border-teal-500/50'
                    : 'bg-white border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {/* Unread Top Right Indicator */}
                {isUnread && (
                  <span className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black uppercase dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    New
                  </span>
                )}

                {/* Tags Row */}
                <div className="flex flex-wrap items-center gap-2 pr-16 mb-2.5">
                  {/* Priority Pill */}
                  <Badge
                    variant={isUrgent ? 'danger' : isImportant ? 'warning' : 'default'}
                    className="text-[9px] font-extrabold uppercase tracking-wide"
                  >
                    {ann.priority || 'Normal'} Priority
                  </Badge>

                  {/* Course Tag */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg dark:bg-slate-800 dark:text-slate-300">
                    <BookOpen size={11} className="text-teal-600 dark:text-teal-400" />
                    {ann.course_title || 'Course'}
                  </span>

                  {/* Module Tag */}
                  {isModuleTargeted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-lg dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50">
                      <Layers size={11} className="text-teal-600 dark:text-teal-400" />
                      Module: {ann.module_title}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      Course-Wide
                    </span>
                  )}
                </div>

                {/* Announcement Title */}
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {ann.title}
                </h3>

                {/* Content */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2 whitespace-pre-wrap">
                  {ann.content}
                </p>

                {/* Footer Metadata & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    <span>By <strong className="text-slate-700 dark:text-slate-300">{ann.author_name || 'Instructor'}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(ann.published_at || ann.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isUnread ? (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(ann.id, e)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <CheckCircle2 size={13} className="text-teal-600 dark:text-teal-400" />
                        Mark as read
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-bold px-2 py-1">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        Seen
                      </span>
                    )}

                    {ann.course_id && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isUnread) handleMarkAsRead(ann.id);
                          navigate(`/student/courses/${ann.course_id}/learn`);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 px-2 py-1"
                      >
                        <span>Go to Course</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

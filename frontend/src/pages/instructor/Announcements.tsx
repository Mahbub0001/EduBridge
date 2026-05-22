/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Megaphone, Search, Filter, Plus, Trash2, Edit,
  Play, Pause, X, CheckCircle2, ShieldAlert, BookOpen, Clock
} from 'lucide-react';
import { getMyInstructorCourses } from '../../services/courseService';
import {
  getInstructorAnnouncements,
  createInstructorAnnouncement,
  updateInstructorAnnouncement,
  deleteInstructorAnnouncement,
  publishInstructorAnnouncement
} from '../../services/announcementService';
import { getCourseModules } from '../../services/courseService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function InstructorAnnouncements() {
  const [courses, setCourses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<any | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [courseId, setCourseId] = useState('');
  const [target, setTarget] = useState('all');
  const [moduleId, setModuleId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [publishNow, setPublishNow] = useState(true);
  const [scheduleDate, setScheduleDate] = useState('');

  // Course modules for selection
  const [modules, setModules] = useState<any[]>([]);

  // Confirmation dialogs
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, aList] = await Promise.all([
        getMyInstructorCourses(),
        getInstructorAnnouncements()
      ]);
      setCourses(cList);
      setAnnouncements(aList);
    } catch {
      showToast('Failed to load announcements parameters.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch modules when selected course inside modal changes
  useEffect(() => {
    if (courseId) {
      getCourseModules(courseId)
        .then(setModules)
        .catch(() => setModules([]));
    } else {
      setModules([]);
    }
  }, [courseId]);

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingAnn(null);
    setTitle('');
    setContent('');
    setCourseId('');
    setTarget('all');
    setModuleId('');
    setPriority('normal');
    setPublishNow(true);
    setScheduleDate('');
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (ann: any) => {
    setEditingAnn(ann);
    setTitle(ann.title || '');
    setContent(ann.content || '');
    setCourseId(ann.course_id || '');
    setTarget(ann.target || 'all');
    setModuleId(ann.module_id || '');
    setPriority(ann.priority || 'normal');
    setPublishNow(ann.status === 'published');
    setScheduleDate(ann.schedule_date || '');
    setModalOpen(true);
  };

  // Save Announcement
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !courseId) {
      showToast('Please fill out all mandatory fields.', 'error');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        title,
        content,
        course_id: courseId,
        target,
        module_id: target === 'module' ? moduleId : null,
        priority,
        status: publishNow ? 'published' : 'draft',
        schedule_date: !publishNow && scheduleDate ? scheduleDate : null
      };

      if (editingAnn) {
        await updateInstructorAnnouncement(editingAnn.id, payload);
        showToast('Announcement successfully saved!');
      } else {
        await createInstructorAnnouncement(payload);
        showToast('New Announcement created successfully!');
      }
      setModalOpen(false);
      loadData();
    } catch {
      showToast('Failed to save announcement details.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (ann: any) => {
    try {
      const nextStatus = ann.status === 'published' ? 'draft' : 'published';
      await publishInstructorAnnouncement(ann.id, nextStatus);
      showToast(`Announcement successfully ${nextStatus === 'published' ? 'published' : 'unreleased'}!`);
      loadData();
    } catch {
      showToast('Failed to change publication status.', 'error');
    }
  };

  // Delete Announcement
  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteInstructorAnnouncement(deleteConfirmId);
      showToast('Announcement permanently deleted.');
      setDeleteConfirmId(null);
      loadData();
    } catch {
      showToast('Failed to delete announcement.', 'error');
    }
  };

  // Filter logic
  const filteredAnnouncements = announcements.filter((ann) => {
    if (selectedCourseId && ann.course_id !== selectedCourseId) return false;
    if (selectedStatus !== 'all' && ann.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const t = (ann.title || '').toLowerCase();
      const m = (ann.content || '').toLowerCase();
      if (!t.includes(q) && !m.includes(q)) return false;
    }
    return true;
  });

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

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Instructor Announcements</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Share updates, deadline extensions, and notes with student cohorts.</p>
        </div>
        <Button variant="primary" size="sm" className="!bg-slate-900" onClick={handleOpenCreate}>
          <Plus size={14} className="mr-1" />
          <span>New Announcement</span>
        </Button>
      </div>

      {/* Filters Toolbar */}
      <Card className="border border-slate-200 p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Filter size={14} className="text-slate-500" />
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Search & Filters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Course Enrolled</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
            >
              <option value="">All courses taught</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Publication Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft / Scheduled</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Search announcement</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="text-center py-20 border border-slate-200">
          <Megaphone className="mx-auto text-slate-300 animate-bounce" size={40} />
          <p className="text-slate-500 font-extrabold mt-4">No announcements match selected parameters.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => {
            const isUrgent = ann.priority === 'urgent';
            const isImportant = ann.priority === 'important';
            return (
              <Card key={ann.id} className={`border p-5 space-y-4 transition-all relative overflow-hidden ${
                isUrgent ? 'border-red-200 bg-red-50/20' : isImportant ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 bg-white'
              }`}>
                {/* Lateral high priority badge ribbon */}
                {(isUrgent || isImportant) && (
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isUrgent ? 'bg-red-500' : 'bg-amber-500'}`} />
                )}

                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={ann.status === 'published' ? 'success' : 'warning'} className="text-[8px] uppercase">
                        {ann.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                      <Badge variant={isUrgent ? 'danger' : isImportant ? 'warning' : 'default'} className="text-[8px] uppercase">
                        {ann.priority} Priority
                      </Badge>
                      <span className="text-[10px] font-extrabold text-slate-400">/</span>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                        <BookOpen size={10} />
                        {ann.course_title}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 leading-snug">{ann.title}</h3>
                  </div>

                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="!p-2 hover:bg-slate-100 text-slate-700" onClick={() => handleTogglePublish(ann)}>
                      {ann.status === 'published' ? <Pause size={12} /> : <Play size={12} />}
                    </Button>
                    <Button variant="ghost" size="sm" className="!p-2 hover:bg-slate-100 text-slate-700" onClick={() => handleOpenEdit(ann)}>
                      <Edit size={12} />
                    </Button>
                    <Button variant="ghost" size="sm" className="!p-2 hover:bg-red-50 text-red-600" onClick={() => setDeleteConfirmId(ann.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Author: <span className="text-slate-800 font-black">{ann.author_name}</span></span>
                  <div className="flex items-center gap-1.5">
                    <Clock size={10} />
                    <span>Created: {new Date(ann.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT DIALOG MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setModalOpen(false)} />
          
          <Card className="relative w-full max-w-lg bg-white shadow-2xl z-10 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {editingAnn ? 'Edit Announcement Details' : 'Compose New Announcement'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs font-semibold text-slate-700">
              
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm extension parameters details"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Selected Course *</label>
                  <select
                    required
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-slate-900 bg-white"
                  >
                    <option value="">Choose Course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-slate-900 bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Target Audience</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-slate-900 bg-white"
                  >
                    <option value="all">All Enrolled Students</option>
                    <option value="module">Specific Module Enrolled</option>
                  </select>
                </div>

                {target === 'module' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Select Module</label>
                    <select
                      value={moduleId}
                      onChange={(e) => setModuleId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-slate-900 bg-white"
                    >
                      <option value="">Choose Module</option>
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Message Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write clear, informative announcement message..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-slate-900 resize-none"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishNow}
                    onChange={(e) => setPublishNow(e.target.checked)}
                    className="accent-slate-900 cursor-pointer h-4 w-4 rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">Publish Announcement immediately</span>
                </label>

                {!publishNow && (
                  <div className="space-y-1.5 pt-1 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Schedule Time</label>
                    <input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-slate-900 bg-white text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" className="!bg-slate-900" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Save Announcement'}
                </Button>
              </div>

            </form>
          </Card>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <ConfirmDialog
          open={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={handleDelete}
          title="Delete Announcement"
          message="Are you sure you want to permanently delete this announcement? This action is irreversible."
        />
      )}
    </div>
  );
}

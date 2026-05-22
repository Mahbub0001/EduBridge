import { useEffect, useState } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { getMyInstructorCourses, createCourse, updateCourse, publishCourse, archiveCourse } from '../../services/courseService';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import type { Course } from '../../types';

export default function InstructorCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', level: 'Beginner', estimated_hours: 0 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getMyInstructorCourses().then(setCourses).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', category: '', level: 'Beginner', estimated_hours: 0 });
    setMsg('');
    setShowModal(true);
  };

  const openEdit = (c: Course) => {
    setEditing(c);
    setForm({ title: c.title || '', description: c.description || '', category: c.category || '', level: c.level || 'Beginner', estimated_hours: c.estimated_hours || 0 });
    setMsg('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      if (editing) {
        await updateCourse(editing.id, form);
        setMsg('Course updated!');
      } else {
        await createCourse(form);
        setMsg('Course created!');
      }
      setTimeout(() => { setShowModal(false); getMyInstructorCourses().then(setCourses).catch(() => {}); }, 1000);
    } catch {
      setMsg('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: string) => {
    try { await publishCourse(id); getMyInstructorCourses().then(setCourses).catch(() => {}); } catch { /* ignore */ }
  };
  const handleArchive = async (id: string) => {
    try { await archiveCourse(id); getMyInstructorCourses().then(setCourses).catch(() => {}); } catch { /* ignore */ }
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading courses...</div>;

  return (
    <div className="space-y-8">
      <PageHeader title="My Courses" description="Manage your published and draft courses." action={
        <Button variant="primary" className="!bg-navy-900" onClick={openCreate}><Plus size={16} /> New Course</Button>
      } />

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Title</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Category</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Level</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Enrolled</th>
                <th className="text-right px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-navy-900">{c.title}</td>
                  <td className="px-6 py-4 text-slate-600">{c.category || '-'}</td>
                  <td className="px-6 py-4"><Badge variant="info">{c.level || 'N/A'}</Badge></td>
                  <td className="px-6 py-4">
                    <Badge variant={c.status === 'published' ? 'success' : c.status === 'archived' ? 'warning' : 'default'}>
                      {c.status || 'draft'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{c.enrollment_count || 0}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit2 size={14} /></Button>
                    {c.status !== 'published' && (
                      <Button variant="ghost" size="sm" onClick={() => handlePublish(c.id)}>Pub</Button>
                    )}
                    {c.status === 'published' && (
                      <Button variant="ghost" size="sm" onClick={() => handleArchive(c.id)}>Arc</Button>
                    )}
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No courses yet. Click "New Course" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg space-y-5">
            <h3 className="text-lg font-extrabold text-navy-900">{editing ? 'Edit Course' : 'Create New Course'}</h3>
            {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.includes('success') || msg.includes('updated') || msg.includes('created') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy-900" placeholder="Course title" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy-900 resize-none" placeholder="Course description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Category</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy-900" placeholder="e.g. Technology" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Level</label>
                <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy-900">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Estimated Hours</label>
              <input type="number" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy-900" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
              <Button variant="primary" className="!bg-navy-900" onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? 'Saving...' : editing ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

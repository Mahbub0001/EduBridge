/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Plus, Trash2, Bell } from 'lucide-react';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../../services/adminService';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function AdminSettings() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAnnouncements().then(setAnnouncements).catch(() => setAnnouncements([])).finally(() => setLoading(false));
  }, []);

  const refreshAnnouncements = () => getAnnouncements().then(setAnnouncements).catch(() => setAnnouncements([]));

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await createAnnouncement({ ...form, type: 'global' });
      setMsg('Announcement created!');
      setShowForm(false);
      refreshAnnouncements();
    } catch { setMsg('Failed to create'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteAnnouncement(id); setMsg('Announcement deleted'); refreshAnnouncements(); }
    catch { setMsg('Failed to delete'); }
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading settings...</div>;

  return (
    <div className="space-y-8">
      <PageHeader title="Admin Settings" description="Configure platform settings and policies." />

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.includes('Failed') ? 'bg-red-50 text-red-700 dark:bg-rose-950/30 dark:text-rose-450' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450'}`}>{msg}</div>
      )}

      <Card className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
            <Bell size={20} /> Global Announcements
          </h2>
          <Button variant="primary" className="!bg-navy-900 dark:!bg-teal-600 dark:!text-white" size="sm" onClick={() => { setShowForm(true); setForm({ title: '', content: '' }); }}>
            <Plus size={16} /> New Announcement
          </Button>
        </div>

        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id} padding="md" className="border-slate-100 dark:border-slate-800/60">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-navy-900 dark:text-white">{a.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{a.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{a.author_name || 'Admin'}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
                    {a.type === 'course' && a.course_id && <Badge variant="info">Course</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></Button>
              </div>
            </Card>
          ))}
          {announcements.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No announcements yet.</p>}
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg space-y-4">
            <h3 className="text-lg font-extrabold text-navy-900 dark:text-white">New Announcement</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Content</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              <Button variant="primary" className="!bg-navy-900 dark:!bg-teal-600 dark:!text-white" onClick={handleCreate} disabled={saving || !form.title.trim()}>
                {saving ? 'Creating...' : 'Create Announcement'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const loadCategories = () => getCategories().then(setCategories).catch(() => setCategories([]));

  useEffect(() => {
    loadCategories().finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setShowForm(true);
  };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name || '', description: c.description || '' });
    setShowForm(true);
  };
  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, form);
        setMsg('Category updated!');
      } else {
        await createCategory(form);
        setMsg('Category created!');
      }
      setTimeout(() => { setShowForm(false); loadCategories(); }, 1000);
    } catch { setMsg('Failed to save'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    try { await deleteCategory(id); setMsg('Category deleted'); loadCategories(); }
    catch { setMsg('Failed to delete'); }
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading categories...</div>;

  return (
    <div className="space-y-8">
      <PageHeader title="Categories" description="Organize course categories and tags." action={
        <Button variant="primary" className="!bg-navy-900" onClick={openCreate}><Plus size={16} /> New Category</Button>
      } />

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Name</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Description</th>
                <th className="text-right px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-navy-900">{c.name}</td>
                  <td className="px-6 py-4 text-slate-600">{c.description || '-'}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit2 size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></Button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">No categories yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md space-y-4">
            <h3 className="text-lg font-extrabold text-navy-900">{editing ? 'Edit Category' : 'New Category'}</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy-900" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy-900 resize-none" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              <Button variant="primary" className="!bg-navy-900" onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

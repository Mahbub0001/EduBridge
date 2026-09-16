/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Tags,
  Search,
  BookOpen,
  RefreshCw,
  FolderPlus,
  X
} from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService';
import { getCourses } from '../../services/courseService';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form Modal
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [cats, cs] = await Promise.all([
        getCategories(),
        getCourses().catch(() => []),
      ]);
      setCategories(cats);
      setCourses(cs);
    } catch (err: any) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, form);
        setMsg({ text: 'Category updated successfully!', type: 'success' });
      } else {
        await createCategory(form);
        setMsg({ text: 'New category created successfully!', type: 'success' });
      }
      setShowForm(false);
      loadData();
    } catch {
      setMsg({ text: 'Failed to save category.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      setMsg({ text: 'Category deleted.', type: 'success' });
      setDeleteTarget(null);
      loadData();
    } catch {
      setMsg({ text: 'Failed to delete category.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const getCourseCountForCategory = (catName: string) => {
    return courses.filter((c) => (c.category || '').toLowerCase() === catName.toLowerCase()).length;
  };

  const filtered = categories.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Course Categories"
        description="Organize subject areas, disciplines, and taxonomy across all academy courses."
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
              className="!bg-navy-900 dark:!bg-teal-600 gap-1.5"
              onClick={openCreate}
            >
              <Plus size={16} /> New Category
            </Button>
          </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
            <Tags size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{categories.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Categories</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{courses.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Classified Courses</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
            <FolderPlus size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">Active</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalog Taxonomy</p>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name or description..."
            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>
      </Card>

      {/* Categories Table */}
      <Card padding="none" className="overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Category Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Courses Linked</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((c) => {
                const count = getCourseCountForCategory(c.name);

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 font-black text-navy-900 dark:text-white text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        {c.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-md truncate">
                      {c.description || 'No description provided.'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {count} {count === 1 ? 'course' : 'courses'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-slate-600 hover:text-navy-900 dark:text-slate-300 dark:hover:text-white"
                        title="Edit category"
                      >
                        <Edit2 size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(c)}
                        className="p-1.5 text-rose-600 hover:text-rose-700 dark:hover:bg-rose-950/30"
                        title="Delete category"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                    <Tags size={44} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-base">No categories found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-navy-900 dark:text-white">
                {editing ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Data Science & Machine Learning"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Brief summary of this discipline..."
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={saving || !form.name.trim()} className="!bg-teal-600 text-white font-bold">
                  {saving ? 'Saving...' : editing ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-sm space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
              <Trash2 size={18} /> Delete Category
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete category <strong>{deleteTarget.name}</strong>?
              {getCourseCountForCategory(deleteTarget.name) > 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 font-semibold">
                  Notice: {getCourseCountForCategory(deleteTarget.name)} course(s) currently belong to this category.
                </span>
              )}
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
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

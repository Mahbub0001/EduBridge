import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getCourses, adminUpdateCourseStatus } from '../../services/courseService';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import type { Course } from '../../types';

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getCourses().then(setCourses).catch(() => setCourses([])).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await adminUpdateCourseStatus(id, status);
      setMsg(`Course ${status}`);
      getCourses().then(setCourses).catch(() => setCourses([]));
    } catch { setMsg('Failed to update course'); }
  };

  const filtered = courses.filter((c) => {
    if (search && !c.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  if (loading) return <div className="text-slate-500 text-sm">Loading courses...</div>;

  return (
    <div className="space-y-8">
      <PageHeader title="Course Management" description="Approve, publish, and moderate platform courses." />

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {msg}
        </div>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-navy-900"
              placeholder="Search courses..." />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy-900">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Title</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Instructor</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Enrolled</th>
                <th className="text-right px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-navy-900">{c.title}</td>
                  <td className="px-6 py-4 text-slate-600">{c.instructor_name || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <Badge variant={c.status === 'published' ? 'success' : c.status === 'archived' ? 'warning' : 'default'}>
                      {c.status || 'draft'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{c.enrollment_count || 0}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    {c.status !== 'published' && (
                      <Button variant="primary" size="sm" className="!bg-navy-900" onClick={() => handleStatusChange(c.id, 'published')}>
                        Publish
                      </Button>
                    )}
                    {c.status === 'published' && (
                      <Button variant="outline" size="sm" onClick={() => handleStatusChange(c.id, 'archived')}>
                        Archive
                      </Button>
                    )}
                    {c.status === 'archived' && (
                      <Button variant="outline" size="sm" onClick={() => handleStatusChange(c.id, 'draft')}>
                        Restore
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No courses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

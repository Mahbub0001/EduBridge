import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Video, ExternalLink, Search, Presentation, LayoutGrid, List } from 'lucide-react';
import { getResources } from '../../services/resourceService';
import type { Resource } from '../../types';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const TYPE_FILTERS = ['all', 'pdf', 'video', 'slides', 'link'] as const;
const TYPE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  video: Video,
  slides: Presentation,
  link: ExternalLink,
};
const TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-rose-50 text-rose-600',
  video: 'bg-blue-50 text-blue-600',
  slides: 'bg-purple-50 text-purple-600',
  link: 'bg-teal-50 text-teal-600',
};

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>('all');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResources().then(setResources).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return resources.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(q) ||
        (r.course_name?.toLowerCase().includes(q) ?? false);
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [resources, search, typeFilter]);

  if (loading) return <div className="text-slate-500 text-sm">Loading resources...</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Learning Resources"
        description="Download slides, reference booklets, and course materials."
        action={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center bg-slate-100 rounded-2xl px-4 py-2.5 focus-within:bg-white focus-within:border-slate-300 border border-transparent flex-1 sm:w-64">
              <Search size={16} className="text-slate-500" />
              <input
                type="text"
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none w-full ml-2 text-xs"
              />
            </div>
            <div className="flex border border-slate-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-navy-900 text-white' : 'bg-white text-slate-500'}`}>
                <LayoutGrid size={16} />
              </button>
              <button type="button" onClick={() => setView('table')} className={`p-2 ${view === 'table' ? 'bg-navy-900 text-white' : 'bg-white text-slate-500'}`}>
                <List size={16} />
              </button>
            </div>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              typeFilter === t ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((res) => {
            const Icon = TYPE_ICONS[res.type] || FileText;
            return (
              <Card key={res.id} className="flex flex-col justify-between hover:border-slate-300 group">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-2xl ${TYPE_COLORS[res.type]} flex items-center justify-center`}>
                      <Icon size={20} />
                    </div>
                    <Badge>{res.type.toUpperCase()}</Badge>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-navy-900 text-sm line-clamp-1 group-hover:text-navy-800">{res.title}</h3>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1">{res.course_name}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-6">
                  <span className="text-[10px] font-bold text-slate-400">{res.size || '—'}</span>
                  <button type="button" className="text-xs font-bold text-navy-900 flex items-center gap-1">
                    {res.type === 'link' ? <><ExternalLink size={14} /> Visit</> : <><Download size={14} /> Download</>}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-extrabold text-slate-500 uppercase">Title</th>
                <th className="text-left px-6 py-3 text-xs font-extrabold text-slate-500 uppercase">Course</th>
                <th className="text-left px-6 py-3 text-xs font-extrabold text-slate-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-extrabold text-slate-500 uppercase">Size</th>
                <th className="text-right px-6 py-3 text-xs font-extrabold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((res) => (
                <tr key={res.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-navy-900">{res.title}</td>
                  <td className="px-6 py-4 text-slate-500">{res.course_name}</td>
                  <td className="px-6 py-4"><Badge>{res.type}</Badge></td>
                  <td className="px-6 py-4 text-slate-500">{res.size || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" className="text-xs font-bold text-navy-800 hover:underline">
                      {res.type === 'link' ? 'Visit' : 'Download'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!filtered.length && (
        <Card className="text-center py-12 text-slate-500 text-sm">No resources match your search.</Card>
      )}
    </div>
  );
}

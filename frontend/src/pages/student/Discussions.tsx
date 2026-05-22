import { MessageSquare, Users, Pin } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const PLACEHOLDER_THREADS = [
  { id: '1', title: 'Best practices for React state management?', course: 'Advanced React Architectures', author: 'Jamie L.', replies: 12, pinned: true, lastActive: '2h ago' },
  { id: '2', title: 'Module 3 assignment clarification', course: 'Introduction to Data Science', author: 'Prof. Turing', replies: 8, pinned: false, lastActive: '5h ago' },
  { id: '3', title: 'Study group for final exam?', course: 'Digital Marketing Masterclass', author: 'Sarah M.', replies: 24, pinned: false, lastActive: '1d ago' },
];

export default function Discussions() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Discussions"
        description="Connect with peers and instructors. Full forum coming soon."
      />

      <Card className="bg-slate-50 dark:bg-slate-800/40 border-dashed text-center py-8">
        <MessageSquare className="mx-auto text-slate-400 dark:text-slate-500 mb-3" size={40} />
        <p className="text-sm font-bold text-navy-900 dark:text-white">Discussion forum is under development</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Browse placeholder threads below.</p>
      </Card>

      <div className="space-y-4">
        {PLACEHOLDER_THREADS.map((thread) => (
          <Card key={thread.id} className="flex items-start justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-colors">
            <div className="flex gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-navy-900 dark:bg-slate-800 text-white dark:text-slate-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {thread.author.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {thread.pinned && <Pin size={14} className="text-amber-500" />}
                  <h3 className="font-extrabold text-navy-900 dark:text-white text-sm truncate">{thread.title}</h3>
                  {thread.pinned && <Badge variant="warning">Pinned</Badge>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{thread.course} • by {thread.author}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                <Users size={14} /> {thread.replies}
              </span>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{thread.lastActive}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { getModuleDiscussion, postModuleComment } from '../../services/discussionService';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface ModuleFeedbackProps {
  moduleId: string;
  moduleTitle: string;
}

export default function ModuleFeedback({ moduleId, moduleTitle }: ModuleFeedbackProps) {
  const [thread, setThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  const loadDiscussion = async () => {
    setLoading(true);
    try {
      const data = await getModuleDiscussion(moduleId);
      setThread(data.thread);
      setReplies(data.replies || []);
    } catch {
      // Silently fail — component is non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscussion();
  }, [moduleId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const result = await postModuleComment(moduleId, newComment);
      setReplies((prev) => [...prev, result]);
      setNewComment('');
    } catch {
      // Silent fail
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <Card className="space-y-4">
        <div className="h-5 w-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-20 bg-slate-50 rounded-xl animate-pulse" />
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <MessageSquare size={16} className="text-navy-900" />
        <h3 className="text-sm font-extrabold text-navy-900">Feedback & Questions &mdash; {moduleTitle}</h3>
        <span className="text-[10px] font-bold text-slate-400 ml-auto">{replies.length} comment{replies.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {replies.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-6">No feedback yet. Be the first to ask a question!</p>
        ) : (
          replies.map((reply: any) => {
            const isInstructor = reply.is_instructor || reply.author_role === 'instructor' || reply.author_role === 'admin';
            return (
              <div key={reply.id} className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                isInstructor ? 'bg-slate-900/5 border-slate-900/10' : 'bg-white border-slate-100'
              }`}>
                <div className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {reply.author_photo ? (
                      <img src={reply.author_photo} alt={reply.author_name} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={10} /></div>
                    )}
                    <span className="font-extrabold text-slate-800">{reply.author_name}</span>
                    {isInstructor && (
                      <Badge variant="default" className="!bg-slate-900 text-white text-[8px] scale-90">Instructor</Badge>
                    )}
                  </div>
                  <span className="text-slate-400 font-semibold">{new Date(reply.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-600 leading-relaxed pl-1 whitespace-pre-wrap">{reply.content}</p>
              </div>
            );
          })
        )}
        <div ref={listEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-100">
        <div className="relative">
          <textarea
            rows={2}
            required
            placeholder="Ask a question or share feedback..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs outline-none focus:border-slate-900 resize-none font-semibold text-slate-700"
          />
          <button
            type="submit"
            disabled={posting || !newComment.trim()}
            className="absolute bottom-3 right-3 text-slate-500 hover:text-navy-900 disabled:opacity-30 transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </Card>
  );
}

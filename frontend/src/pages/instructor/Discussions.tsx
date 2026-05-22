/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  MessageSquare, Pin, EyeOff, Trash2, Eye, CheckCircle2, ShieldAlert,
  Search, Filter, Send, X, AlertTriangle, User, BookOpen, Clock
} from 'lucide-react';
import { getMyInstructorCourses } from '../../services/courseService';
import {
  getInstructorDiscussions,
  getInstructorDiscussionDetail,
  replyToDiscussionAsInstructor,
  pinDiscussionThread,
  hideDiscussionThread,
  deleteDiscussionThread,
  toggleDiscussionAnswered
} from '../../services/discussionService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function InstructorDiscussions() {
  const [courses, setCourses] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected discussion detail (drawer control)
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Delete control
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Toast
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
      const [cList, dList] = await Promise.all([
        getMyInstructorCourses(),
        getInstructorDiscussions()
      ]);
      setCourses(cList);
      setDiscussions(dList);
    } catch {
      showToast('Failed to load discussion parameters.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenThread = async (id: string) => {
    setDetailLoading(true);
    setSelectedThread(null);
    try {
      const detail = await getInstructorDiscussionDetail(id);
      setSelectedThread(detail);
    } catch {
      showToast('Failed to retrieve discussion thread details.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedThread) return;
    setReplyLoading(true);
    try {
      await replyToDiscussionAsInstructor(selectedThread.id, replyText);
      showToast('Moderator reply posted successfully!');
      setReplyText('');
      // Reload detail
      handleOpenThread(selectedThread.id);
      loadData();
    } catch {
      showToast('Failed to submit reply.', 'error');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await pinDiscussionThread(id);
      showToast('Discussion pin status updated.');
      loadData();
      if (selectedThread?.id === id) {
        handleOpenThread(id);
      }
    } catch {
      showToast('Failed to update pin status.', 'error');
    }
  };

  const handleToggleHide = async (id: string) => {
    try {
      await hideDiscussionThread(id);
      showToast('Discussion visibility status updated.');
      loadData();
      if (selectedThread?.id === id) {
        handleOpenThread(id);
      }
    } catch {
      showToast('Failed to toggle visibility.', 'error');
    }
  };

  const handleToggleAnswered = async (id: string) => {
    try {
      await toggleDiscussionAnswered(id);
      showToast('Discussion answered state toggled.');
      loadData();
      if (selectedThread?.id === id) {
        handleOpenThread(id);
      }
    } catch {
      showToast('Failed to update answered state.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDiscussionThread(deleteConfirmId);
      showToast('Discussion thread permanently deleted.');
      if (selectedThread?.id === deleteConfirmId) {
        setSelectedThread(null);
      }
      setDeleteConfirmId(null);
      loadData();
    } catch {
      showToast('Failed to delete discussion thread.', 'error');
    }
  };

  // Filter discussion cards
  const filteredDiscussions = discussions.filter((d) => {
    if (selectedCourseId && d.course_id !== selectedCourseId) return false;
    
    if (selectedStatus === 'pinned' && !d.is_pinned) return false;
    if (selectedStatus === 'hidden' && !d.is_hidden) return false;
    if (selectedStatus === 'unanswered' && d.is_answered) return false;
    if (selectedStatus === 'reported' && (!d.report_count || d.report_count === 0)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const t = (d.title || '').toLowerCase();
      const c = (d.content || '').toLowerCase();
      if (!t.includes(q) && !c.includes(q)) return false;
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
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900">Course Discussions</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Moderate questions, pinned threads, and post official replies to student forums.</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <Card className="border border-slate-200 p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Filter size={14} className="text-slate-500" />
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Search & Filters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Filter by Course</label>
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
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Moderation Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
            >
              <option value="all">All threads</option>
              <option value="pinned">Pinned Threads</option>
              <option value="reported">Reported / Flagged</option>
              <option value="hidden">Hidden Threads</option>
              <option value="unanswered">Unanswered</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Search post</label>
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

      {/* Main Grid: left list, right detail drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Discussion threads list */}
        <div className={`space-y-4 ${selectedThread ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredDiscussions.length === 0 ? (
            <Card className="text-center py-20 border border-slate-200 bg-white">
              <MessageSquare className="mx-auto text-slate-300 animate-bounce" size={40} />
              <p className="text-slate-500 font-extrabold mt-4">No discussions found.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredDiscussions.map((d) => {
                const isReported = d.report_count > 0;
                return (
                  <Card
                    key={d.id}
                    className={`border p-5 space-y-4 cursor-pointer hover:border-slate-300 transition-all relative overflow-hidden ${
                      selectedThread?.id === d.id ? 'border-slate-900 bg-slate-50/20' : 'border-slate-200 bg-white'
                    }`}
                    onClick={() => handleOpenThread(d.id)}
                  >
                    {isReported && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500" />
                    )}

                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {d.is_pinned && <Badge variant="info" className="text-[8px] uppercase flex items-center gap-0.5"><Pin size={8} /> Pinned</Badge>}
                          {d.is_hidden && <Badge variant="warning" className="text-[8px] uppercase flex items-center gap-0.5"><EyeOff size={8} /> Hidden</Badge>}
                          {d.is_answered ? (
                            <Badge variant="success" className="text-[8px] uppercase flex items-center gap-0.5"><CheckCircle2 size={8} /> Answered</Badge>
                          ) : (
                            <Badge variant="default" className="text-[8px] uppercase">Unanswered</Badge>
                          )}
                          {isReported && (
                            <Badge variant="danger" className="text-[8px] uppercase flex items-center gap-0.5"><AlertTriangle size={8} /> Reported ({d.report_count})</Badge>
                          )}
                          <span className="text-[10px] font-extrabold text-slate-400">/</span>
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                            <BookOpen size={10} />
                            {d.course_title}
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-slate-900 leading-snug">{d.title}</h3>
                      </div>

                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="!p-2 hover:bg-slate-100 text-slate-700" onClick={() => handleTogglePin(d.id)}>
                          <Pin size={12} className={d.is_pinned ? 'fill-slate-900 text-slate-900' : ''} />
                        </Button>
                        <Button variant="ghost" size="sm" className="!p-2 hover:bg-slate-100 text-slate-700" onClick={() => handleToggleHide(d.id)}>
                          {d.is_hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                        </Button>
                        <Button variant="ghost" size="sm" className="!p-2 hover:bg-red-50 text-red-600" onClick={() => setDeleteConfirmId(d.id)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">{d.content}</p>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        {d.author_photo ? (
                          <img src={d.author_photo} alt={d.author_name} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={10} /></div>
                        )}
                        <span className="text-slate-800 font-black">{d.author_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><MessageSquare size={10} /> {d.reply_count} Replies</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(d.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected discussion detail panel */}
        {selectedThread && (
          <div className="lg:col-span-6 space-y-4 animate-in slide-in-from-right-4 duration-200">
            <Card className="border border-slate-200 p-5 space-y-4 bg-white relative">
              
              {/* Close Button */}
              <button onClick={() => setSelectedThread(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors">
                <X size={18} />
              </button>

              {/* Thread Info */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {selectedThread.is_pinned && <Badge variant="info" className="text-[8px] uppercase"><Pin size={8} className="inline mr-0.5" /> Pinned</Badge>}
                  {selectedThread.is_answered && <Badge variant="success" className="text-[8px] uppercase">Answered</Badge>}
                  <span className="text-[10px] text-slate-505 font-black uppercase flex items-center gap-1">
                    <BookOpen size={10} />
                    {selectedThread.course_title}
                  </span>
                </div>

                <h2 className="text-sm font-extrabold text-slate-900 leading-snug">{selectedThread.title}</h2>
                
                {/* Author row */}
                <div className="flex items-center gap-3">
                  {selectedThread.author_photo ? (
                    <img src={selectedThread.author_photo} alt={selectedThread.author_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={14} /></div>
                  )}
                  <div>
                    <p className="text-xs font-black text-slate-800">{selectedThread.author_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(selectedThread.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-650 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-wrap">{selectedThread.content}</p>
              </div>

              {/* Moderation settings tools */}
              <div className="flex flex-wrap gap-2 py-1">
                <Button variant="outline" size="sm" onClick={() => handleTogglePin(selectedThread.id)}>
                  <Pin size={10} className="mr-1" />
                  <span>{selectedThread.is_pinned ? 'Unpin thread' : 'Pin thread'}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleHide(selectedThread.id)}>
                  {selectedThread.is_hidden ? <Eye size={10} className="mr-1" /> : <EyeOff size={10} className="mr-1" />}
                  <span>{selectedThread.is_hidden ? 'Unhide thread' : 'Hide thread'}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleAnswered(selectedThread.id)}>
                  <CheckCircle2 size={10} className="mr-1 text-emerald-600" />
                  <span>{selectedThread.is_answered ? 'Mark unanswered' : 'Mark as answered'}</span>
                </Button>
              </div>

              {/* Replies Thread */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare size={13} />
                  <span>Thread Replies ({selectedThread.reply_count})</span>
                </h4>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {selectedThread.replies.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No responses to this topic yet.</p>
                  ) : (
                    selectedThread.replies.map((reply: any) => {
                      const isInstructor = reply.is_instructor || reply.author_role === 'instructor' || reply.author_role === 'admin';
                      return (
                        <div key={reply.id} className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                          isInstructor ? 'bg-slate-900/5 border-slate-900/10' : 'bg-white border-slate-150'
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
                                <Badge variant="default" className="!bg-slate-900 text-white text-[8px] scale-90">Instructor Badge</Badge>
                              )}
                            </div>
                            <span className="text-slate-400 font-semibold">{new Date(reply.created_at).toLocaleDateString()}</span>
                          </div>

                          <p className="text-slate-650 leading-relaxed pl-1 whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Instructor Reply Box */}
              <form onSubmit={handlePostReply} className="pt-4 border-t border-slate-100 space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Post response as Moderator</label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      required
                      placeholder="Write your professional response details..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs outline-none focus:border-slate-900 resize-none font-semibold text-slate-700"
                    />
                    <button
                      type="submit"
                      disabled={replyLoading || !replyText.trim()}
                      className="absolute bottom-3 right-3 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </form>

            </Card>
          </div>
        )}

      </div>

      {/* Delete confirm dialog */}
      {deleteConfirmId && (
        <ConfirmDialog
          open={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={handleDelete}
          title="Delete Discussion Thread"
          message="Are you sure you want to permanently delete this discussion thread and all its replies? This action cannot be undone."
        />
      )}
    </div>
  );
}

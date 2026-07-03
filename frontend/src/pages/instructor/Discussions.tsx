/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import {
  MessageSquare, Pin, EyeOff, Trash2, Eye, CheckCircle2,
  Search, Send, X, User, BookOpen, ChevronDown, ChevronRight, RefreshCw,
} from 'lucide-react';
import { getMyInstructorCourses, getCourseModules } from '../../services/courseService';
import {
  getInstructorDiscussions,
  getInstructorDiscussionDetail,
  replyToDiscussionAsInstructor,
  pinDiscussionThread,
  hideDiscussionThread,
  deleteDiscussionThread,
  toggleDiscussionAnswered,
  getModuleDiscussion,
} from '../../services/discussionService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

function timeAgo(dateVal: any): string {
  if (!dateVal) return '';
  const date = dateVal?.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function InstructorDiscussions() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [moduleThread, setModuleThread] = useState<{ thread: any; replies: any[] } | null>(null);
  const [allDiscussions, setAllDiscussions] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [toastErr, setToastErr] = useState(false);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, err = false) => {
    setToast(msg); setToastErr(err);
    setTimeout(() => setToast(''), 3000);
  };

  // Load courses + all discussions on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cList, dList] = await Promise.all([
          getMyInstructorCourses(),
          getInstructorDiscussions(),
        ]);
        setCourses(cList);
        setAllDiscussions(dList);
        if (cList.length > 0) setSelectedCourseId(cList[0].id);
      } catch {
        showToast('Failed to load discussions.', true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load modules when course changes
  useEffect(() => {
    setSelectedModuleId('');
    setModuleThread(null);
    setSelectedThread(null);
    if (!selectedCourseId) { setModules([]); return; }
    getCourseModules(selectedCourseId)
      .then((mods) => {
        setModules(mods);
        if (mods.length > 0) setSelectedModuleId(mods[0].id);
      })
      .catch(() => setModules([]));
  }, [selectedCourseId]);

  // Load module discussion thread when module changes
  useEffect(() => {
    if (!selectedModuleId) { setModuleThread(null); return; }
    setThreadLoading(true);
    getModuleDiscussion(selectedModuleId)
      .then(setModuleThread)
      .catch(() => setModuleThread(null))
      .finally(() => setThreadLoading(false));
  }, [selectedModuleId]);

  // Scroll to latest reply when thread updates
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moduleThread?.replies?.length]);

  const handleReply = async () => {
    if (!replyText.trim() || !moduleThread?.thread?.id) return;
    setReplyLoading(true);
    try {
      await replyToDiscussionAsInstructor(moduleThread.thread.id, replyText.trim());
      setReplyText('');
      showToast('Reply posted!');
      // Refresh thread
      const updated = await getModuleDiscussion(selectedModuleId);
      setModuleThread(updated);
    } catch {
      showToast('Failed to post reply.', true);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleOpenLegacyThread = async (id: string) => {
    try {
      const detail = await getInstructorDiscussionDetail(id);
      setSelectedThread(detail);
    } catch {
      showToast('Failed to load thread.', true);
    }
  };

  const handlePostLegacyReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    setReplyLoading(true);
    try {
      await replyToDiscussionAsInstructor(selectedThread.id, replyText.trim());
      setReplyText('');
      showToast('Reply posted!');
      const detail = await getInstructorDiscussionDetail(selectedThread.id);
      setSelectedThread(detail);
    } catch {
      showToast('Failed to post reply.', true);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDiscussionThread(deleteConfirmId);
      showToast('Thread deleted.');
      setDeleteConfirmId(null);
      setSelectedThread(null);
      const dList = await getInstructorDiscussions();
      setAllDiscussions(dList);
      if (selectedModuleId) {
        const updated = await getModuleDiscussion(selectedModuleId);
        setModuleThread(updated);
      }
    } catch {
      showToast('Delete failed.', true);
    }
  };

  // Filter non-module discussions
  const legacyDiscussions = allDiscussions.filter((d) => {
    if (d.is_module_feedback) return false;
    if (selectedCourseId && d.course_id !== selectedCourseId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (d.title || '').toLowerCase().includes(q) || (d.content || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Count unread per module (replies from students without instructor reply)
  const getModuleUnreadCount = (modId: string) => {
    const disc = allDiscussions.find(
      (d) => d.is_module_feedback && d.module_id === modId
    );
    if (!disc) return 0;
    return (disc.replies || []).filter((r: any) => !r.is_instructor).length;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${toastErr ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
          {toastErr ? <X size={16} /> : <CheckCircle2 size={16} />}
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="text-teal-500" size={22} />
            Module Discussions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View student questions per module and reply to them directly.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={async () => {
          const dList = await getInstructorDiscussions();
          setAllDiscussions(dList);
          if (selectedModuleId) {
            const updated = await getModuleDiscussion(selectedModuleId);
            setModuleThread(updated);
          }
        }}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

          {/* Left sidebar: Course + Module selector */}
          <div className="lg:col-span-1 space-y-4">
            {/* Course picker */}
            <Card className="p-4 space-y-3">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <BookOpen size={11} /> Select Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-teal-400 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              >
                <option value="">All courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </Card>

            {/* Module list */}
            {modules.length > 0 && (
              <Card className="p-3 space-y-1">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide px-1 pb-1">Modules</p>
                {modules.map((mod: any) => {
                  const unread = getModuleUnreadCount(mod.id);
                  const isActive = selectedModuleId === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setSelectedModuleId(mod.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <ChevronRight size={12} className={isActive ? 'text-white' : 'text-slate-400'} />
                        <span className="truncate">{mod.title}</span>
                      </span>
                      {unread > 0 && (
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${isActive ? 'bg-white text-teal-600' : 'bg-teal-500 text-white'}`}>
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </Card>
            )}
          </div>

          {/* Main content: Module thread */}
          <div className="lg:col-span-3 space-y-4">
            {selectedModuleId ? (
              <Card className="space-y-4">
                {/* Thread header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <MessageSquare size={14} className="text-teal-500" />
                      {modules.find(m => m.id === selectedModuleId)?.title || 'Module'} — Q&amp;A
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {moduleThread?.replies?.length || 0} message{(moduleThread?.replies?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {moduleThread?.thread?.id && (
                    <div className="flex gap-1">
                      <button
                        title="Pin thread"
                        onClick={() => pinDiscussionThread(moduleThread.thread.id).then(() => showToast('Pin updated.'))}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
                      >
                        <Pin size={13} />
                      </button>
                      <button
                        title="Mark answered"
                        onClick={() => toggleDiscussionAnswered(moduleThread.thread.id).then(() => showToast('Answered status toggled.'))}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600"
                      >
                        <CheckCircle2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Replies */}
                {threadLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse" />)}
                  </div>
                ) : (moduleThread?.replies || []).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-bold">No student questions yet.</p>
                    <p className="text-xs mt-1">Questions students ask will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {(moduleThread?.replies || []).map((reply: any) => {
                      const isInstructor = reply.is_instructor || reply.author_role === 'instructor' || reply.author_role === 'admin';
                      return (
                        <div
                          key={reply.id}
                          className={`flex gap-3 p-4 rounded-xl border ${
                            isInstructor
                              ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {reply.author_photo
                              ? <img src={reply.author_photo} alt="" className="w-full h-full object-cover" />
                              : <User size={14} className="text-slate-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white">{reply.author_name || 'Student'}</span>
                              {isInstructor && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-teal-600 text-white uppercase tracking-wide">You</span>
                              )}
                              <span className="text-[10px] text-slate-400 ml-auto">{timeAgo(reply.created_at)}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={repliesEndRef} />
                  </div>
                )}

                {/* Reply input */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-teal-600" />
                  </div>
                  <div className="flex-1 flex gap-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                      placeholder="Reply to students in this module... (Enter to send)"
                      className="flex-1 resize-none border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-400 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400"
                    />
                    <button
                      type="button"
                      disabled={!replyText.trim() || replyLoading}
                      onClick={handleReply}
                      className="self-end px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white transition-all flex-shrink-0"
                    >
                      {replyLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="text-center py-16 text-slate-400">
                <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">Select a course and module to view its discussion.</p>
              </Card>
            )}

            {/* General (non-module) discussions section */}
            {legacyDiscussions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <ChevronDown size={13} /> General Course Discussions
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-slate-400" size={12} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-1.5 text-xs outline-none focus:border-teal-400 bg-white dark:bg-slate-900 w-44"
                    />
                  </div>
                </div>
                {legacyDiscussions.map((d) => (
                  <Card
                    key={d.id}
                    className={`p-4 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-all border ${
                      selectedThread?.id === d.id ? 'border-teal-400 bg-teal-50/30 dark:bg-teal-900/10' : 'border-slate-200 dark:border-slate-800'
                    }`}
                    onClick={() => handleOpenLegacyThread(d.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {d.is_pinned && <Badge variant="info" className="text-[8px]"><Pin size={8} className="inline mr-0.5" />Pinned</Badge>}
                          {d.is_answered && <Badge variant="success" className="text-[8px]"><CheckCircle2 size={8} className="inline mr-0.5" />Answered</Badge>}
                          {!d.is_answered && <Badge variant="default" className="text-[8px]">Unanswered</Badge>}
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{d.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{d.author_name} · {timeAgo(d.created_at)} · {d.reply_count} replies</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => pinDiscussionThread(d.id).then(() => showToast('Updated.'))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                          <Pin size={12} />
                        </button>
                        <button onClick={() => hideDiscussionThread(d.id).then(() => showToast('Updated.'))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                          {d.is_hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                        <button onClick={() => setDeleteConfirmId(d.id)} className="p-1 hover:bg-red-50 rounded-lg text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Inline reply panel when selected */}
                    {selectedThread?.id === d.id && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedThread(null)} className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-1">
                          <X size={10} /> Close
                        </button>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(selectedThread.replies || []).map((r: any) => {
                            const isInst = r.is_instructor || r.author_role === 'instructor';
                            return (
                              <div key={r.id} className={`p-2.5 rounded-lg text-xs ${isInst ? 'bg-teal-50 dark:bg-teal-900/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{r.author_name}</span>
                                  {isInst && <span className="text-[8px] bg-teal-600 text-white rounded-full px-1 font-black">Instructor</span>}
                                  <span className="text-slate-400 ml-auto text-[10px]">{timeAgo(r.created_at)}</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300">{r.content}</p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <textarea
                            rows={2}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            className="flex-1 resize-none border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-400 bg-white dark:bg-slate-900"
                          />
                          <button
                            disabled={!replyText.trim() || replyLoading}
                            onClick={handlePostLegacyReply}
                            className="self-end px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white"
                          >
                            <Send size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <ConfirmDialog
          open={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={handleDelete}
          title="Delete Thread"
          message="Permanently delete this discussion thread and all replies?"
        />
      )}
    </div>
  );
}

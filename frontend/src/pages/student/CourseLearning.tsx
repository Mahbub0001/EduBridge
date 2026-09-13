/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Play, FileText, CheckCircle2, ChevronDown, ChevronUp, Download,
  ChevronLeft, ChevronRight, Clock, Award, ClipboardList,
  ExternalLink, Lock, HelpCircle, XCircle, RotateCcw, MessageSquare, Send, User,
  Calendar, AlertCircle,
} from 'lucide-react';
import { getCourse, getCourseModules } from '../../services/courseService';
import { getCourseProgress, markLessonComplete } from '../../services/progressService';
import {
  getModuleUnlockStatus, getQuizQuestions, getMyAttempts, submitQuiz,
  type ModuleUnlockStatus,
} from '../../services/quizService';
import { getModuleDiscussion, postModuleComment } from '../../services/discussionService';
import api, { unwrap } from '../../services/api';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && (match[2].length === 11 || match[2].length === 12))
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
}

function getVimeoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(vimeo\.com\/|video\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2])
    ? `https://player.vimeo.com/video/${match[2]}`
    : null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function resolveUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.startsWith('http://localhost:8000') && API_BASE_URL !== 'http://localhost:8000') {
      return url.replace('http://localhost:8000', API_BASE_URL);
    }
    return url;
  }
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  return `${API_BASE_URL}/${url}`;
}

async function getCourseQuizzesList(courseId: string): Promise<any[]> {
  const res = await api.get(`/courses/${courseId}/quizzes`);
  return unwrap<any[]>(res);
}

async function getCourseAssignmentsList(courseId: string): Promise<any[]> {
  const res = await api.get(`/courses/${courseId}/assignments`);
  return unwrap<any[]>(res);
}

async function getAssignmentSubmission(assignmentId: string): Promise<any> {
  const res = await api.get(`/assignments/${assignmentId}/submission`);
  return unwrap<any>(res);
}

type FlatItem =
  | { kind: 'lesson'; id: string; moduleId: string; moduleTitle: string; [key: string]: any }
  | { kind: 'quiz'; id: string; moduleId: string; moduleTitle: string; quiz: any }
  | { kind: 'assignment'; id: string; moduleId: string; moduleTitle: string; assignment: any };

export default function CourseLearning() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const assignmentIdParam = searchParams.get('assignmentId');

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [moduleUnlockStatus, setModuleUnlockStatus] = useState<ModuleUnlockStatus[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<any[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Record<string, any>>({});
  const [assignmentsBoxExpanded, setAssignmentsBoxExpanded] = useState<boolean>(true);

  const [activeItemId, setActiveItemId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Quiz-taking state
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizCurrentQ, setQuizCurrentQ] = useState(0);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Assignment submission state
  const [assignmentSubmitText, setAssignmentSubmitText] = useState('');
  const [assignmentSubmitUrl, setAssignmentSubmitUrl] = useState('');
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentSuccessMsg, setAssignmentSuccessMsg] = useState('');
  const [assignmentErrorMsg, setAssignmentErrorMsg] = useState('');
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);

  // Module discussion state
  const [moduleDiscussion, setModuleDiscussion] = useState<{ thread: any; replies: any[] } | null>(null);
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentPosting, setCommentPosting] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        const [c, m, p, quizzes, unlockStat, assigns] = await Promise.all([
          getCourse(courseId),
          getCourseModules(courseId).catch(() => []),
          getCourseProgress(courseId).catch(() => null),
          getCourseQuizzesList(courseId).catch(() => []),
          getModuleUnlockStatus(courseId).catch(() => []),
          getCourseAssignmentsList(courseId).catch(() => []),
        ]);
        setCourse(c);
        setModules(m);
        setProgress(p);
        // Include published quizzes and quizzes with no status set (seeded/legacy quizzes)
        setCourseQuizzes(quizzes.filter((q: any) => q.status === 'published' || !q.status));
        setModuleUnlockStatus(unlockStat);

        const validAssignments = (assigns || []).filter((a: any) => a.status === 'published' || !a.status);
        setCourseAssignments(validAssignments);

        // Fetch student submissions for assignments in parallel
        const subMap: Record<string, any> = {};
        await Promise.all(
          validAssignments.map(async (a: any) => {
            try {
              const sub = await getAssignmentSubmission(a.id);
              if (sub) subMap[a.id] = sub;
            } catch {}
          })
        );
        setAssignmentSubmissions(subMap);

        if (assignmentIdParam) {
          setActiveItemId(`assignment-${assignmentIdParam}`);
        } else if (p?.last_lesson_id) {
          setActiveItemId(p.last_lesson_id);
        } else if (m.length > 0 && m[0].lessons?.length > 0) {
          setActiveItemId(m[0].lessons[0].id);
        } else if (validAssignments.length > 0) {
          setActiveItemId(`assignment-${validAssignments[0].id}`);
        }

        const expanded: Record<string, boolean> = {};
        m.forEach((mod: any) => { expanded[mod.id] = true; });
        setExpandedModules(expanded);
      } catch (err) {
        console.error('Failed to load course', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, assignmentIdParam]);

  const refreshUnlockStatus = () => {
    if (courseId) {
      getModuleUnlockStatus(courseId)
        .then(setModuleUnlockStatus)
        .catch((err: any) => console.error('Failed to refresh unlock status', err));
    }
  };

  const isModuleLocked = (moduleId?: string) => {
    if (!moduleId || moduleUnlockStatus.length === 0) return false;
    const status = moduleUnlockStatus.find((x) => x.module_id === moduleId);
    return status ? status.locked : false;
  };

  const getModStatus = (moduleId: string) => {
    return moduleUnlockStatus.find((s) => s.module_id === moduleId);
  };

  const flatItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = [];
    const assignedQuizIds = new Set<string>();
    const assignedAssignmentIds = new Set<string>();

    modules.forEach((mod) => {
      (mod.lessons || []).forEach((l: any) => {
        items.push({ kind: 'lesson', ...l, moduleId: mod.id, moduleTitle: mod.title });
      });
      // Find quiz for this module
      const modQuiz = courseQuizzes.find((q: any) => q.module_id === mod.id);
      if (modQuiz) {
        assignedQuizIds.add(modQuiz.id);
        items.push({
          kind: 'quiz',
          id: `quiz-${modQuiz.id}`,
          moduleId: mod.id,
          moduleTitle: mod.title,
          quiz: modQuiz,
        });
      }
      // Module-specific assignments
      const modAssigns = courseAssignments.filter((a: any) => a.module_id === mod.id);
      modAssigns.forEach((a: any) => {
        assignedAssignmentIds.add(a.id);
        items.push({
          kind: 'assignment',
          id: `assignment-${a.id}`,
          moduleId: mod.id,
          moduleTitle: mod.title,
          assignment: a,
        });
      });
    });

    // Attach unassigned quizzes (no module_id) to the last module
    const unassignedQuizzes = courseQuizzes.filter(
      (q: any) => !assignedQuizIds.has(q.id) && (!q.module_id || q.module_id === 'None')
    );
    const lastMod = modules[modules.length - 1];
    if (lastMod) {
      unassignedQuizzes.forEach((q: any) => {
        items.push({
          kind: 'quiz',
          id: `quiz-${q.id}`,
          moduleId: lastMod.id,
          moduleTitle: lastMod.title,
          quiz: q,
        });
      });
    }

    // Attach course-level assignments
    const unassignedAssignments = courseAssignments.filter(
      (a: any) => !assignedAssignmentIds.has(a.id)
    );
    unassignedAssignments.forEach((a: any) => {
      items.push({
        kind: 'assignment',
        id: `assignment-${a.id}`,
        moduleId: lastMod ? lastMod.id : '',
        moduleTitle: 'Assignments',
        assignment: a,
      });
    });

    return items;
  }, [modules, courseQuizzes, courseAssignments]);

  const activeIndex = flatItems.findIndex((i) => i.id === activeItemId);
  const activeItem = flatItems[activeIndex] || flatItems[0] || null;
  const prevItem = activeIndex > 0 ? flatItems[activeIndex - 1] : null;
  const nextItem = activeIndex < flatItems.length - 1 ? flatItems[activeIndex + 1] : null;

  const completedIds = progress?.completed_lessons || [];
  const progressPct = progress?.progress_percent || 0;

  // Load module discussion when active module changes (placed after activeItem is derived)
  useEffect(() => {
    const moduleId = activeItem?.moduleId;
    if (!moduleId) { setModuleDiscussion(null); return; }
    setDiscussionLoading(true);
    getModuleDiscussion(moduleId)
      .then(setModuleDiscussion)
      .catch(() => setModuleDiscussion(null))
      .finally(() => setDiscussionLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.moduleId]);

  const handlePostComment = async () => {
    const moduleId = activeItem?.moduleId;
    if (!commentText.trim() || !moduleId) return;
    setCommentPosting(true);
    try {
      const newReply = await postModuleComment(moduleId, commentText.trim());
      setCommentText('');
      setModuleDiscussion((prev) => prev
        ? { ...prev, replies: [...prev.replies, newReply] }
        : null
      );
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setCommentPosting(false);
    }
  };

  // Load quiz details when active item switches to a quiz
  useEffect(() => {
    if (!activeItem || activeItem.kind !== 'quiz') {
      setQuizQuestions([]);
      setQuizAnswers({});
      setQuizCurrentQ(0);
      setQuizResult(null);
      setQuizAttempts([]);
      return;
    }
    const quizId = activeItem.quiz.id;
    setLoadingQuiz(true);
    setQuizResult(null);
    setQuizAnswers({});
    setQuizCurrentQ(0);
    Promise.all([
      getQuizQuestions(quizId),
      getMyAttempts(quizId).catch(() => []),
    ])
      .then(([questions, attempts]) => {
        setQuizQuestions(questions);
        setQuizAttempts(attempts);
      })
      .catch((err) => console.error('Failed to load quiz details', err))
      .finally(() => setLoadingQuiz(false));
  }, [activeItem?.id]);

  const handleSubmitQuiz = async () => {
    if (!activeItem || activeItem.kind !== 'quiz') return;
    setQuizSubmitting(true);
    try {
      const res = await submitQuiz(activeItem.quiz.id, quizAnswers);
      setQuizResult(res);
      setQuizAttempts((prev) => [res, ...prev]);
      if (res.passed) {
        refreshUnlockStatus();
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit quiz.');
    } finally {
      setQuizSubmitting(false);
    }
  };

  useEffect(() => {
    if (activeItem?.kind === 'assignment' && activeItem.assignment) {
      const sub = assignmentSubmissions[activeItem.assignment.id];
      setAssignmentSubmitText(sub?.submission_text || '');
      setAssignmentSubmitUrl(sub?.file_url || '');
      setAssignmentSuccessMsg('');
      setAssignmentErrorMsg('');
      setIsEditingAssignment(!sub);
    }
  }, [activeItem?.id, assignmentSubmissions]);

  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!assignmentSubmitText.trim() && !assignmentSubmitUrl.trim()) {
      setAssignmentErrorMsg('Please enter your submission text or provide an attachment link.');
      return;
    }
    setAssignmentSubmitting(true);
    setAssignmentErrorMsg('');
    setAssignmentSuccessMsg('');
    try {
      await api.post(`/assignments/${assignmentId}/submit`, {
        submission_text: assignmentSubmitText.trim(),
        file_url: assignmentSubmitUrl.trim() || undefined,
      });
      const updatedSub = await getAssignmentSubmission(assignmentId).catch(() => ({
        id: `temp-${Date.now()}`,
        assignment_id: assignmentId,
        submission_text: assignmentSubmitText.trim(),
        file_url: assignmentSubmitUrl.trim(),
        submitted_at: new Date().toISOString(),
        status: 'pending',
      }));
      setAssignmentSubmissions((prev) => ({
        ...prev,
        [assignmentId]: updatedSub,
      }));
      setAssignmentSuccessMsg('Assignment submitted successfully!');
      setIsEditingAssignment(false);
    } catch (err: any) {
      setAssignmentErrorMsg(err?.response?.data?.detail || 'Failed to submit assignment. Please try again.');
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const activeAssignment = activeItem?.kind === 'assignment' ? activeItem.assignment : null;
  const activeSubmission = activeAssignment ? assignmentSubmissions[activeAssignment.id] : null;

  const activeLesson = activeItem?.kind === 'lesson' ? activeItem : null;
  const lessonType = activeLesson?.type || activeLesson?.content_type || 'video';
  const lessonDuration = activeLesson?.estimated_duration || activeLesson?.duration_minutes || 0;

  const activeModule = useMemo(() => {
    return modules.find((m) => m.id === activeItem?.moduleId);
  }, [modules, activeItem]);

  const lessonResources = useMemo(() => {
    if (!activeLesson) return [];
    const moduleResources = activeModule?.resources || [];
    const resourcesList = [...moduleResources];
    const itemType = activeLesson.type || activeLesson.content_type || 'video';
    if ((itemType === 'pdf' || itemType === 'ppt' || itemType === 'link') && activeLesson.file_url) {
      const alreadyExists = resourcesList.some(r => r.url === activeLesson.file_url);
      if (!alreadyExists) {
        resourcesList.unshift({
          id: `lesson-file-${activeLesson.id}`,
          title: `${activeLesson.title} (${itemType.toUpperCase()})`,
          type: itemType,
          url: activeLesson.file_url,
          downloadable: true
        });
      }
    }
    return resourcesList;
  }, [activeModule, activeLesson]);

  const handleMarkComplete = async () => {
    if (!courseId || !activeLesson) return;
    setMarking(true);
    try {
      const result = await markLessonComplete(activeLesson.id, courseId);
      setProgress((prev: any) => ({
        ...prev,
        progress_percent: result.progress_percent,
        completed_lessons: [...(prev?.completed_lessons || []), activeLesson.id],
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const navigateTo = (item: FlatItem) => {
    if (!isModuleLocked(item.moduleId)) {
      setActiveItemId(item.id);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading lesson...</div>;
  if (!course) return <div className="text-slate-500">Course not found.</div>;

  const imgSrc = course.thumbnail_url || course.image || course.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200';
  const hasPreviousPass = quizAttempts.some((a) => a.passed);
  const maxAttempts = activeItem?.kind === 'quiz' ? (activeItem.quiz.max_attempts || 3) : 3;
  const attemptsLeft = maxAttempts - quizAttempts.length;
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'My Courses', href: '/student/my-courses' },
          { label: course?.title || 'Course', href: courseId ? `/student/courses/${courseId}` : undefined },
          {
            label:
              activeItem?.kind === 'quiz'
                ? `Quiz: ${activeItem.quiz.title}`
                : activeItem?.kind === 'assignment'
                ? `Assignment: ${activeItem.assignment.title}`
                : (activeLesson?.title || 'Lesson'),
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              {activeItem?.moduleTitle || 'Module'}
              {activeItem?.kind === 'quiz' && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">· Module Quiz</span>
              )}
              {activeItem?.kind === 'assignment' && (
                <span className="ml-2 text-teal-600 dark:text-teal-400">· Course Assignment</span>
              )}
            </p>
            <h1 className="text-xl font-extrabold text-navy-900 dark:text-white">
              {activeItem?.kind === 'quiz'
                ? activeItem.quiz.title
                : activeItem?.kind === 'assignment'
                ? activeItem.assignment.title
                : (activeLesson?.title || 'Select a lesson')}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Award size={14} /> {Math.round(progressPct)}% complete</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {flatItems.filter(i => i.kind === 'lesson').length} lessons</span>
              {courseAssignments.length > 0 && (
                <span className="flex items-center gap-1"><ClipboardList size={14} /> {courseAssignments.length} assignments</span>
              )}
            </div>
          </div>

          {/* Render Assignment UI if active item is an assignment */}
          {activeItem?.kind === 'assignment' && activeAssignment && (
            <div className="space-y-6">
              {/* Assignment Header Card */}
              <Card className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                        Assignment
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {activeItem.moduleTitle}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-navy-900 dark:text-white">
                      {activeAssignment.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    {activeSubmission?.status === 'graded' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                        Graded: {activeSubmission.score ?? activeSubmission.grade} / {activeAssignment.total_marks || 100}
                      </span>
                    ) : activeSubmission ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                        <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                        Submitted • Under Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />
                        Pending Submission
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <Award size={14} className="text-teal-500" />
                      {activeAssignment.total_marks || 100} Points
                    </span>
                  </div>
                </div>

                {/* Due Date & Submission Policy Details */}
                <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  {activeAssignment.due_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Due: </span>
                      <span className="font-bold text-navy-900 dark:text-slate-200">
                        {new Date(activeAssignment.due_date).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  )}
                  {activeAssignment.submission_type && (
                    <div className="flex items-center gap-1.5">
                      <FileText size={14} className="text-slate-400" />
                      <span>Format: </span>
                      <span className="font-bold capitalize text-navy-900 dark:text-slate-200">
                        {activeAssignment.submission_type}
                      </span>
                    </div>
                  )}
                  {activeAssignment.allow_late && (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <span>Late Submissions Allowed ({activeAssignment.late_penalty || 0}% penalty)</span>
                    </div>
                  )}
                </div>

                {/* Instructions Section */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Assignment Instructions
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">
                    {activeAssignment.instructions || 'No detailed instructions provided for this assignment.'}
                  </div>
                </div>

                {/* Rubrics (if present) */}
                {activeAssignment.rubrics && activeAssignment.rubrics.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Evaluation Rubrics
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeAssignment.rubrics.map((rubric: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-start gap-2"
                        >
                          <div>
                            <p className="text-xs font-bold text-navy-900 dark:text-white capitalize">
                              {rubric.name || rubric.criterion_name}
                            </p>
                            {rubric.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {rubric.description}
                              </p>
                            )}
                          </div>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 shrink-0">
                            {rubric.max_marks} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Graded Result Card (if graded) */}
              {activeSubmission?.status === 'graded' && (
                <Card className="border-2 border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-200 dark:border-emerald-800/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-base font-black text-navy-900 dark:text-white">
                        Grade &amp; Instructor Feedback
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {activeSubmission.score ?? activeSubmission.grade}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {' '}/ {activeAssignment.total_marks || 100}
                      </span>
                    </div>
                  </div>

                  {activeSubmission.feedback ? (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Instructor Comment:
                      </p>
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {activeSubmission.feedback}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No written feedback provided.</p>
                  )}
                </Card>
              )}

              {/* Existing Submission Details (if submitted) */}
              {activeSubmission && !isEditingAssignment && (
                <Card className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-extrabold text-navy-900 dark:text-white">
                        Your Submission
                      </h3>
                      {activeSubmission.submitted_at && (
                        <p className="text-xs text-slate-400">
                          Submitted on {new Date(activeSubmission.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {activeSubmission.status !== 'graded' && activeAssignment.allow_resubmission !== false && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingAssignment(true)}
                      >
                        Edit / Resubmit
                      </Button>
                    )}
                  </div>

                  {activeSubmission.submission_text && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Submitted Text:</p>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono text-xs">
                        {activeSubmission.submission_text}
                      </div>
                    </div>
                  )}

                  {activeSubmission.file_url && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Attached File / Link:</p>
                      <a
                        href={resolveUrl(activeSubmission.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 text-xs font-bold hover:underline"
                      >
                        <ExternalLink size={14} />
                        {activeSubmission.file_url}
                      </a>
                    </div>
                  )}
                </Card>
              )}

              {/* Submission Form (if not submitted or if editing) */}
              {(isEditingAssignment || !activeSubmission) && (
                <Card className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-extrabold text-navy-900 dark:text-white">
                      {activeSubmission ? 'Update Your Submission' : 'Submit Assignment'}
                    </h3>
                    {activeSubmission && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingAssignment(false)}
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </div>

                  {assignmentSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      {assignmentSuccessMsg}
                    </div>
                  )}

                  {assignmentErrorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-2">
                      <XCircle size={16} />
                      {assignmentErrorMsg}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Your Solution / Answer Text
                    </label>
                    <textarea
                      rows={6}
                      value={assignmentSubmitText}
                      onChange={(e) => setAssignmentSubmitText(e.target.value)}
                      placeholder="Write your assignment solution, code snippet, notes, or explanation here..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-2xl px-4 py-3 text-sm outline-none resize-none dark:bg-white dark:border-slate-300 dark:text-black dark:focus:border-slate-500 text-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Project Link or File URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={assignmentSubmitUrl}
                      onChange={(e) => setAssignmentSubmitUrl(e.target.value)}
                      placeholder="e.g. Google Drive link, GitHub repository link, or cloud file URL"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-2xl px-4 py-3 text-sm outline-none dark:bg-white dark:border-slate-300 dark:text-black dark:focus:border-slate-500 text-black"
                    />
                    <p className="text-[11px] text-slate-400">
                      Make sure links (e.g. Google Drive) are set to "Anyone with the link can view".
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    {activeSubmission && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={assignmentSubmitting}
                        onClick={() => setIsEditingAssignment(false)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={assignmentSubmitting || (!assignmentSubmitText.trim() && !assignmentSubmitUrl.trim())}
                      onClick={() => handleSubmitAssignment(activeAssignment.id)}
                      className="!bg-navy-900 dark:!bg-teal-600 dark:!text-white"
                    >
                      {assignmentSubmitting ? 'Submitting...' : activeSubmission ? 'Update Submission' : 'Submit Assignment'}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Navigation buttons at bottom */}
              <div className="flex justify-between items-center mt-6">
                {prevItem ? (
                  <button
                    type="button"
                    onClick={() => navigateTo(prevItem)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    <ChevronLeft size={18} /> Previous: {prevItem.kind === 'quiz' ? prevItem.quiz.title : prevItem.kind === 'assignment' ? prevItem.assignment.title : prevItem.title}
                  </button>
                ) : <span />}

                {nextItem && (
                  <button
                    type="button"
                    onClick={() => !isModuleLocked(nextItem.moduleId) && navigateTo(nextItem)}
                    disabled={isModuleLocked(nextItem.moduleId)}
                    className={`flex items-center gap-2 text-sm font-bold transition-all ${
                      isModuleLocked(nextItem.moduleId)
                        ? 'text-amber-500 cursor-not-allowed'
                        : 'text-navy-900 hover:text-navy-800 dark:text-teal-400 dark:hover:text-teal-300'
                    }`}
                  >
                    {isModuleLocked(nextItem.moduleId) ? (
                      <><Lock size={14} /> Pass quiz to unlock next module</>
                    ) : (
                      <>Next: {nextItem.kind === 'quiz' ? nextItem.quiz.title : nextItem.kind === 'assignment' ? nextItem.assignment.title : nextItem.title} <ChevronRight size={18} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Render Quiz UI if active item is a quiz */}
          {activeItem?.kind === 'quiz' && (
            <Card className="space-y-6">
              {loadingQuiz ? (
                <div className="text-center py-8 text-slate-500">Loading quiz details...</div>
              ) : quizResult ? (
                <div className="text-center space-y-5 py-4">
                  {quizResult.passed ? (
                    <CheckCircle2 size={52} className="mx-auto text-emerald-500" />
                  ) : (
                    <XCircle size={52} className="mx-auto text-rose-500" />
                  )}
                  <div>
                    <h2 className="text-2xl font-black text-navy-900 dark:text-white">
                      {quizResult.passed ? 'You Passed!' : 'Not Passed Yet'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">{activeItem.quiz.title}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-2xl font-black text-navy-900 dark:text-white">{quizResult.score}%</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Your Score</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-navy-900 dark:text-white">
                        {quizResult.correct_count}/{quizResult.total_questions}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Correct</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-navy-900 dark:text-white">
                        {activeItem.quiz.passing_score || 60}%
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Passing Score</p>
                    </div>
                  </div>

                  {quizResult.passed ? (
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      Congratulations! The next module has been unlocked.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {attemptsLeft > 0
                          ? `You need ${activeItem.quiz.passing_score || 60}% to pass. You have ${attemptsLeft} attempts left.`
                          : 'No attempts left. Contact instructor to reset.'}
                      </p>
                      {attemptsLeft > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setQuizResult(null);
                            setQuizAnswers({});
                            setQuizCurrentQ(0);
                          }}
                          className="mx-auto"
                        >
                          <RotateCcw size={14} /> Try Again
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : quizQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-bold">No questions added to this quiz yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeItem.quiz.instructions && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-xs text-amber-800 dark:text-amber-300 font-semibold">
                      {activeItem.quiz.instructions}
                    </div>
                  )}

                  {hasPreviousPass && (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 size={14} /> You have already passed this quiz. You can retake it for practice.
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Question {quizCurrentQ + 1} of {quizQuestions.length}</span>
                    <span>{Object.keys(quizAnswers).length} of {quizQuestions.length} answered</span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                    <div
                      className="h-1.5 bg-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${((quizCurrentQ + 1) / quizQuestions.length) * 100}%` }}
                    />
                  </div>

                  {(() => {
                    const question = quizQuestions[quizCurrentQ];
                    if (!question) return null;
                    const selectedAnswer = quizAnswers[question.id] || '';
                    return (
                      <div className="space-y-4">
                        <p className="text-base font-bold text-navy-900 dark:text-white leading-relaxed">
                          {question.question_text}
                        </p>
                        <div className="space-y-3">
                          {(question.options || []).map((option: string, optIdx: number) => {
                            const isSelected = selectedAnswer === option;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => {
                                  setQuizAnswers((prev) => ({ ...prev, [question.id]: option }));
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                                  isSelected
                                    ? 'border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-900/30 dark:text-teal-300'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={quizCurrentQ === 0}
                            onClick={() => setQuizCurrentQ((prev) => prev - 1)}
                          >
                            <ChevronLeft size={14} /> Previous
                          </Button>

                          {quizCurrentQ < quizQuestions.length - 1 ? (
                            <Button
                              size="sm"
                              onClick={() => setQuizCurrentQ((prev) => prev + 1)}
                            >
                              Next <ChevronRight size={14} />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={quizSubmitting || Object.keys(quizAnswers).length < quizQuestions.length}
                              onClick={handleSubmitQuiz}
                            >
                              {quizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </Card>
          )}
          {/* Render Lesson Details if active item is a lesson */}
          {activeItem?.kind === 'lesson' && (
            <>
              {lessonType !== 'text' && (
                <Card padding="none" className="aspect-video bg-navy-950 overflow-hidden relative group rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md">
                  {lessonType === 'video' && (
                    (() => {
                      const ytUrl = getYouTubeEmbedUrl(activeLesson?.video_url);
                      const vimeoUrl = getVimeoEmbedUrl(activeLesson?.video_url);
                      if (ytUrl) {
                        return (
                          <iframe
                            src={ytUrl}
                            title={activeLesson?.title}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        );
                      } else if (vimeoUrl) {
                        return (
                          <iframe
                            src={vimeoUrl}
                            title={activeLesson?.title}
                            className="w-full h-full border-0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          />
                        );
                      } else if (activeLesson?.video_url) {
                        return (
                          <video
                            src={resolveUrl(activeLesson.video_url)}
                            controls
                            className="w-full h-full object-contain bg-black"
                            poster={imgSrc}
                          />
                        );
                      } else {
                        return (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/60">
                            <img src={imgSrc} alt="Course" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                            <div className="relative z-10 flex flex-col items-center space-y-2">
                              <Play size={40} className="text-white/50" />
                              <span className="text-xs font-bold text-slate-300">No video URL provided</span>
                            </div>
                          </div>
                        );
                      }
                    })()
                  )}

                  {lessonType === 'pdf' && activeLesson?.file_url && (
                    <iframe
                      src={resolveUrl(activeLesson.file_url)}
                      title={activeLesson?.title}
                      className="w-full h-full border-0 bg-white"
                    />
                  )}

                  {(lessonType === 'pdf' || lessonType === 'ppt') && !activeLesson?.file_url && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-navy-950 text-white">
                      <div className="p-4 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                        <FileText size={48} />
                      </div>
                      <h2 className="text-lg font-black mt-4">{activeLesson?.title}</h2>
                      <p className="text-xs text-slate-500 italic mt-2">No file uploaded yet.</p>
                    </div>
                  )}

                  {lessonType === 'link' && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-navy-950 text-white">
                      <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <ExternalLink size={48} />
                      </div>
                      <h2 className="text-lg font-black mt-4">{activeLesson?.title}</h2>
                      {activeLesson?.file_url ? (
                        <a
                          href={resolveUrl(activeLesson.file_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 px-6 py-3 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                          Go to External Site <ExternalLink size={14} />
                        </a>
                      ) : (
                        <p className="text-xs text-slate-500 italic mt-2">No web link has been set for this reference yet.</p>
                      )}
                    </div>
                  )}
                </Card>
              )}

              <Card className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {activeLesson?.content || 'Select a lesson from the curriculum to begin learning.'}
                </p>
                <div className="flex flex-wrap gap-4 text-xs font-bold text-navy-900 dark:text-teal-400">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><Clock size={14} /> {lessonDuration} min</span>
                  {lessonResources.length > 0 && (
                    <span className="flex items-center gap-1.5"><Award size={14} /> {lessonResources.length} {lessonResources.length === 1 ? 'Resource' : 'Resources'} included</span>
                  )}
                </div>

                {lessonResources.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                    <h3 className="text-sm font-extrabold text-navy-900 dark:text-white">Lesson Resources</h3>
                    <div className="space-y-2">
                      {lessonResources.map((res: any) => {
                        const isLink = res.type === 'link';
                        const fileExt = res.url?.split('.').pop()?.toLowerCase();
                        const isPDF = res.type === 'pdf' || fileExt === 'pdf';
                        const isPPT = res.type === 'ppt' || ['ppt', 'pptx'].includes(fileExt || '');
                        const isVideo = res.type === 'video' || ['mp4', 'mov', 'avi'].includes(fileExt || '');

                        return (
                          <div key={res.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-880/60 transition-colors">
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <FileText
                                size={18}
                                className={isPDF ? "text-rose-500" : isPPT ? "text-amber-500" : isVideo ? "text-sky-500" : "text-blue-500"}
                              />
                              <span className="text-xs font-bold text-navy-900 dark:text-white truncate" title={res.title}>
                                {res.title}
                              </span>
                            </div>
                            {isLink ? (
                              <a
                                href={resolveUrl(res.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-teal-400 flex items-center gap-1 flex-shrink-0"
                              >
                                <ExternalLink size={14} /> Open Link
                              </a>
                            ) : (
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <a href={resolveUrl(res.url)} target="_blank" rel="noreferrer" className="text-xs font-bold text-navy-800 dark:text-slate-350 flex items-center gap-1">View</a>
                                <a href={resolveUrl(res.url)} download className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1"><Download size={14} /> Download</a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                  {prevItem ? (
                    <button
                      type="button"
                      onClick={() => navigateTo(prevItem)}
                      className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      <ChevronLeft size={18} /> Previous
                    </button>
                  ) : <span />}

                  <div className="flex gap-2">
                    {activeLesson && !completedIds.includes(activeLesson.id) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={marking}
                        onClick={handleMarkComplete}
                      >
                        <CheckCircle2 size={16} />
                        {marking ? 'Saving...' : 'Mark Complete'}
                      </Button>
                    )}
                    {nextItem && (
                      <button
                        type="button"
                        onClick={() => navigateTo(nextItem)}
                        disabled={isModuleLocked(nextItem.moduleId)}
                        className={`flex items-center gap-2 text-sm font-bold transition-all ${
                          isModuleLocked(nextItem.moduleId)
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-navy-900 hover:text-navy-800 dark:text-teal-400 dark:hover:text-teal-300'
                        }`}
                      >
                        {nextItem.kind === 'quiz' ? (
                          <><HelpCircle size={16} /> Take Quiz</>
                        ) : (
                          <>Next <ChevronRight size={18} /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Module Discussion / Q&A Section */}
          {activeItem?.moduleId && activeItem.kind !== 'assignment' && (
            <Card className="space-y-4 mt-2">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <MessageSquare size={16} className="text-teal-500" />
                <h3 className="text-sm font-extrabold text-navy-900 dark:text-white">
                  Module Discussion &amp; Q&amp;A
                </h3>
                <span className="text-xs text-slate-400 font-medium">— {activeItem.moduleTitle}</span>
              </div>

              {/* Reply list */}
              {discussionLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
                </div>
              ) : (moduleDiscussion?.replies || []).length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <MessageSquare size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">No questions yet. Be the first to ask!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {(moduleDiscussion?.replies || []).map((reply: any) => {
                    const isInstructor = reply.is_instructor || reply.author_role === 'instructor' || reply.author_role === 'admin';
                    return (
                      <div
                        key={reply.id}
                        className={`flex gap-3 p-3 rounded-xl border text-xs ${
                          isInstructor
                            ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                          {reply.author_photo
                            ? <img src={reply.author_photo} alt={reply.author_name} className="w-7 h-7 rounded-full object-cover" />
                            : <User size={12} className="text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-extrabold text-navy-900 dark:text-white">{reply.author_name || 'Student'}</span>
                            {isInstructor && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-teal-600 text-white tracking-wide">Instructor</span>
                            )}
                            <span className="text-slate-400 text-[10px] ml-auto">
                              {reply.created_at ? new Date(reply.created_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Comment input */}
              <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                  <User size={12} className="text-teal-600" />
                </div>
                <div className="flex-1 flex gap-2">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                    placeholder="Ask a question or share feedback about this module..."
                    className="flex-1 resize-none border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-400 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    disabled={!commentText.trim() || commentPosting}
                    onClick={handlePostComment}
                    className="self-end px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white transition-all flex-shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </Card>
          )}

          {activeItem?.kind === 'quiz' && (
            <div className="flex justify-between items-center mt-6">
              {prevItem ? (
                <button
                  type="button"
                  onClick={() => navigateTo(prevItem)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <ChevronLeft size={18} /> Previous Lesson
                </button>
              ) : <span />}

              {nextItem && (
                <button
                  type="button"
                  onClick={() => !isModuleLocked(nextItem.moduleId) && navigateTo(nextItem)}
                  disabled={isModuleLocked(nextItem.moduleId)}
                  className={`flex items-center gap-2 text-sm font-bold transition-all ${
                    isModuleLocked(nextItem.moduleId)
                      ? 'text-amber-500 cursor-not-allowed'
                      : 'text-navy-900 hover:text-navy-800 dark:text-teal-400 dark:hover:text-teal-300'
                  }`}
                >
                  {isModuleLocked(nextItem.moduleId) ? (
                    <><Lock size={14} /> Pass quiz to unlock next module</>
                  ) : (
                    <>Next Module <ChevronRight size={18} /></>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Curriculum panel */}
        <Card className="h-fit space-y-4">
          <h3 className="font-extrabold text-sm text-navy-900 dark:text-white uppercase tracking-wider">Curriculum</h3>
          <div className="space-y-3">
            {modules.map((mod) => {
              const locked = isModuleLocked(mod.id);
              const modStatus = getModStatus(mod.id);
              const modQuiz = courseQuizzes.find((q: any) => q.module_id === mod.id);
              const modAssignments = courseAssignments.filter((a: any) => a.module_id === mod.id);

              return (
                <div
                  key={mod.id}
                  className={`border rounded-2xl overflow-hidden transition-all ${
                    locked
                      ? 'border-amber-200 dark:border-amber-900/50 opacity-75'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => !locked && toggleModule(mod.id)}
                    className={`w-full flex items-center justify-between p-3 text-left transition-all ${
                      locked
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 cursor-not-allowed'
                        : 'bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-[11px] font-black text-navy-900 dark:text-slate-200 uppercase truncate pr-2">
                      {mod.title}
                    </span>
                    {locked ? (
                      <Lock size={14} className="shrink-0 text-amber-500" />
                    ) : expandedModules[mod.id] ? (
                      <ChevronUp size={16} className="shrink-0 dark:text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="shrink-0 dark:text-slate-400" />
                    )}
                  </button>

                  {!locked && expandedModules[mod.id] && (
                    <div className="p-2 space-y-1 bg-white dark:bg-slate-950">
                      {(mod.lessons || []).map((lesson: any) => {
                        const isActive = lesson.id === activeItemId;
                        const isCompleted = completedIds.includes(lesson.id);
                        const itemType = lesson.type || lesson.content_type || 'video';
                        const itemDuration = lesson.estimated_duration || lesson.duration_minutes || 0;
                        const IconComponent = itemType === 'video' ? Play : itemType === 'link' ? ExternalLink : FileText;

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => setActiveItemId(lesson.id)}
                            className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all ${
                              isActive
                                ? 'bg-navy-900 text-white dark:bg-teal-600'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <IconComponent size={14} className={isActive ? 'text-teal-400' : 'text-slate-500 dark:text-slate-400'} />
                              <span className="text-xs font-bold truncate">{lesson.title}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[10px] ${isActive ? 'text-slate-400' : 'text-slate-450 dark:text-slate-500'}`}>
                                {itemDuration} min
                              </span>
                              {isCompleted && <CheckCircle2 size={14} className="text-emerald-500" />}
                            </div>
                          </button>
                        );
                      })}

                      {modQuiz && (() => {
                        const quizItemId = `quiz-${modQuiz.id}`;
                        const isActive = quizItemId === activeItemId;
                        const isPassed = modStatus?.passed;

                        return (
                          <button
                            key={quizItemId}
                            type="button"
                            onClick={() => setActiveItemId(quizItemId)}
                            className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all border ${
                              isActive
                                ? 'bg-amber-600 text-white border-amber-600'
                                : isPassed
                                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/60'
                                  : 'border-amber-250 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <HelpCircle size={14} className={isActive ? 'text-white' : isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} />
                              <span className={`text-xs font-bold truncate ${
                                isActive ? 'text-white' : isPassed ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'
                              }`}>
                                {modQuiz.title}
                              </span>
                            </div>
                            {isPassed ? (
                              <CheckCircle2 size={14} className={isActive ? 'text-white' : 'text-emerald-500'} />
                            ) : (
                              <HelpCircle size={14} className={isActive ? 'text-white' : 'text-amber-500'} />
                            )}
                          </button>
                        );
                      })()}

                      {modAssignments.map((assign: any) => {
                        const assignItemId = `assignment-${assign.id}`;
                        const isActive = assignItemId === activeItemId;
                        const sub = assignmentSubmissions[assign.id];
                        const isGraded = sub?.status === 'graded';
                        const isSubmitted = sub && sub.status !== 'graded';

                        return (
                          <button
                            key={assignItemId}
                            type="button"
                            onClick={() => setActiveItemId(assignItemId)}
                            className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all border ${
                              isActive
                                ? 'bg-navy-900 text-white dark:bg-teal-600 border-navy-900 dark:border-teal-600'
                                : isGraded
                                  ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50'
                                  : isSubmitted
                                    ? 'border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50'
                                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <ClipboardList
                                size={14}
                                className={
                                  isActive
                                    ? 'text-teal-300'
                                    : isGraded
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : isSubmitted
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-slate-500 dark:text-slate-400'
                                }
                              />
                              <span className="text-xs font-bold truncate">{assign.title}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isGraded ? (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isActive ? 'bg-emerald-500/30 text-white' : 'text-emerald-700 dark:text-emerald-300'
                                }`}>
                                  {sub.score ?? sub.grade ?? 'Graded'}
                                </span>
                              ) : isSubmitted ? (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isActive ? 'bg-blue-500/30 text-white' : 'text-blue-700 dark:text-blue-300'
                                }`}>
                                  Submitted
                                </span>
                              ) : (
                                <span className={`text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                  {assign.total_marks || 100} pts
                                </span>
                              )}
                              {isGraded && <CheckCircle2 size={14} className={isActive ? 'text-white' : 'text-emerald-500'} />}
                            </div>
                          </button>
                        );
                      })}

                      {modStatus?.passed && (
                        <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 size={12} /> Module Completed
                        </div>
                      )}
                    </div>
                  )}

                  {locked && (
                    <div className="px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50/60 dark:bg-amber-950/20">
                      Pass the previous quiz to unlock
                    </div>
                  )}
                </div>
              );
            })}

            {/* Dedicated Assignment Box styled like a Module */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-xs">
              <button
                type="button"
                onClick={() => setAssignmentsBoxExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 text-left transition-all bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <ClipboardList size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="text-[11px] font-black text-navy-900 dark:text-slate-200 uppercase truncate">
                    Assignments
                  </span>
                  {courseAssignments.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                      {courseAssignments.length}
                    </span>
                  )}
                </div>
                {assignmentsBoxExpanded ? (
                  <ChevronUp size={16} className="shrink-0 dark:text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="shrink-0 dark:text-slate-400" />
                )}
              </button>

              {assignmentsBoxExpanded && (
                <div className="p-2 space-y-1 bg-white dark:bg-slate-950">
                  {courseAssignments.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                      No assignments for this course
                    </div>
                  ) : (
                    courseAssignments.map((assign) => {
                      const assignItemId = `assignment-${assign.id}`;
                      const isActive = assignItemId === activeItemId;
                      const sub = assignmentSubmissions[assign.id];
                      const isGraded = sub?.status === 'graded';
                      const isSubmitted = sub && sub.status !== 'graded';

                      return (
                        <button
                          key={assign.id}
                          type="button"
                          onClick={() => setActiveItemId(assignItemId)}
                          className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all border ${
                            isActive
                              ? 'bg-navy-900 text-white dark:bg-teal-600 border-navy-900 dark:border-teal-600'
                              : isGraded
                                ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50'
                                : isSubmitted
                                  ? 'border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50'
                                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <ClipboardList
                              size={14}
                              className={
                                isActive
                                  ? 'text-teal-300'
                                  : isGraded
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : isSubmitted
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : 'text-slate-500 dark:text-slate-400'
                              }
                            />
                            <span className="text-xs font-bold truncate">{assign.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isGraded ? (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isActive ? 'bg-emerald-500/30 text-white' : 'text-emerald-700 dark:text-emerald-300'
                              }`}>
                                {sub.score ?? sub.grade ?? 'Graded'}
                              </span>
                            ) : isSubmitted ? (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isActive ? 'bg-blue-500/30 text-white' : 'text-blue-700 dark:text-blue-300'
                              }`}>
                                Submitted
                              </span>
                            ) : (
                              <span className={`text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                {assign.total_marks || 100} pts
                              </span>
                            )}
                            {isGraded && <CheckCircle2 size={14} className={isActive ? 'text-white' : 'text-emerald-500'} />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {courseId && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <Link to={`/student/courses/${courseId}`} className="block text-center text-xs font-bold text-navy-800 hover:underline dark:text-slate-400 dark:hover:text-white">
                Back to course overview
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

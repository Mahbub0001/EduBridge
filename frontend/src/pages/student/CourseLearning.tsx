/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Play, FileText, CheckCircle2, ChevronDown, ChevronUp, Download,
  ChevronLeft, ChevronRight, Clock, Award, ClipboardList,
  ExternalLink, Lock, HelpCircle, XCircle, RotateCcw, MessageSquare, Send, User,
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

type FlatItem =
  | { kind: 'lesson'; id: string; moduleId: string; moduleTitle: string; [key: string]: any }
  | { kind: 'quiz'; id: string; moduleId: string; moduleTitle: string; quiz: any };
export default function CourseLearning() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [moduleUnlockStatus, setModuleUnlockStatus] = useState<ModuleUnlockStatus[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);
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

  // Module discussion state
  const [moduleDiscussion, setModuleDiscussion] = useState<{ thread: any; replies: any[] } | null>(null);
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentPosting, setCommentPosting] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        const [c, m, p, quizzes, unlockStat] = await Promise.all([
          getCourse(courseId),
          getCourseModules(courseId).catch(() => []),
          getCourseProgress(courseId).catch(() => null),
          getCourseQuizzesList(courseId).catch(() => []),
          getModuleUnlockStatus(courseId).catch(() => []),
        ]);
        setCourse(c);
        setModules(m);
        setProgress(p);
        // Include published quizzes and quizzes with no status set (seeded/legacy quizzes)
        setCourseQuizzes(quizzes.filter((q: any) => q.status === 'published' || !q.status));
        setModuleUnlockStatus(unlockStat);

        if (p?.last_lesson_id) {
          setActiveItemId(p.last_lesson_id);
        } else if (m.length > 0 && m[0].lessons?.length > 0) {
          setActiveItemId(m[0].lessons[0].id);
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
  }, [courseId]);


  const refreshUnlockStatus = () => {
    if (courseId) {
      getModuleUnlockStatus(courseId)
        .then(setModuleUnlockStatus)
        .catch((err: any) => console.error('Failed to refresh unlock status', err));
    }
  };

  const isModuleLocked = (moduleId: string) => {
    if (moduleUnlockStatus.length === 0) return false;
    const status = moduleUnlockStatus.find((x) => x.module_id === moduleId);
    return status ? status.locked : false;
  };

  const getModStatus = (moduleId: string) => {
    return moduleUnlockStatus.find((s) => s.module_id === moduleId);
  };

  const flatItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = [];
    const assignedQuizIds = new Set<string>();

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

    return items;
  }, [modules, courseQuizzes]);

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
          { label: activeItem?.kind === 'quiz' ? `Quiz: ${activeItem.quiz.title}` : (activeLesson?.title || 'Lesson') },
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
            </p>
            <h1 className="text-xl font-extrabold text-navy-900 dark:text-white">
              {activeItem?.kind === 'quiz' ? activeItem.quiz.title : (activeLesson?.title || 'Select a lesson')}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Award size={14} /> {Math.round(progressPct)}% complete</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {flatItems.filter(i => i.kind === 'lesson').length} lessons</span>
            </div>
          </div>

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
          {activeItem?.moduleId && (
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
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
            {courseId && (
              <Link to={`/student/courses/${courseId}/assignments`}>
                <Button variant="outline" size="sm" className="w-full">
                  <ClipboardList size={14} /> View Assignments
                </Button>
              </Link>
            )}
          </div>
          {courseId && (
            <Link to={`/student/courses/${courseId}`} className="block text-center text-xs font-bold text-navy-800 hover:underline dark:text-slate-400 dark:hover:text-white">
              Back to course overview
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}

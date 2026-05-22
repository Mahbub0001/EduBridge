/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Play, FileText, CheckCircle2, ChevronDown, ChevronUp, Download,
  ChevronLeft, ChevronRight, Clock, Award, ClipboardList, HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { getCourse, getCourseModules } from '../../services/courseService';
import { getCourseProgress, markLessonComplete } from '../../services/progressService';
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

export default function CourseLearning() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        const [c, m, p] = await Promise.all([
          getCourse(courseId),
          getCourseModules(courseId).catch((err) => {
            console.error('getCourseModules failed:', err);
            return [];
          }),
          getCourseProgress(courseId).catch((err) => {
            console.error('getCourseProgress failed:', err);
            return null;
          }),
        ]);
        setCourse(c);
        setModules(m);
        setProgress(p);
        if (p?.last_lesson_id) {
          setActiveLessonId(p.last_lesson_id);
        } else if (m.length > 0 && m[0].lessons?.length > 0) {
          setActiveLessonId(m[0].lessons[0].id);
        }
        const expanded: Record<string, boolean> = {};
        m.forEach((mod) => { expanded[mod.id] = true; });
        setExpandedModules(expanded);
      } catch (err) {
        console.error('Failed to load course', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const flatLessons = useMemo(
    () => modules.flatMap((m) =>
      (m.lessons || []).map((l: any) => ({ ...l, moduleTitle: m.title, moduleId: m.id }))
    ),
    [modules]
  );

  const activeIndex = flatLessons.findIndex((l) => l.id === activeLessonId);
  const activeLesson = flatLessons[activeIndex] || flatLessons[0] || null;
  const prevLesson = activeIndex > 0 ? flatLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < flatLessons.length - 1 ? flatLessons[activeIndex + 1] : null;
  const totalLessons = flatLessons.length;
  const completedIds = progress?.completed_lessons || [];
  const progressPct = progress?.progress_percent || 0;

  const lessonType = activeLesson?.type || activeLesson?.content_type || 'video';
  const activeModule = useMemo(() => {
    return modules.find((m) => m.id === activeLesson?.moduleId);
  }, [modules, activeLesson]);

  const lessonResources = useMemo(() => {
    const moduleResources = activeModule?.resources || [];
    const resourcesList = [...moduleResources];
    if (activeLesson && (lessonType === 'pdf' || lessonType === 'ppt' || lessonType === 'link') && activeLesson.file_url) {
      const alreadyExists = resourcesList.some(r => r.url === activeLesson.file_url);
      if (!alreadyExists) {
        resourcesList.unshift({
          id: `lesson-file-${activeLesson.id}`,
          title: `${activeLesson.title} (${lessonType.toUpperCase()})`,
          type: lessonType,
          url: activeLesson.file_url,
          downloadable: true
        });
      }
    }
    return resourcesList;
  }, [activeModule, activeLesson, lessonType]);

  const lessonDuration = activeLesson?.estimated_duration || activeLesson?.duration_minutes || 0;

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
      console.error('Failed to mark complete', err);
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading lesson...</div>;
  if (!course) return <div className="text-slate-500">Course not found.</div>;

  const imgSrc = course.thumbnail_url || course.image || course.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200';

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'My Courses', href: '/student/my-courses' },
          { label: course?.title || 'Course', href: courseId ? `/student/courses/${courseId}` : undefined },
          { label: activeLesson?.title || 'Lesson' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {activeLesson?.moduleTitle || 'Module'}
            </p>
            <h1 className="text-xl font-extrabold text-navy-900">{activeLesson?.title || 'Select a lesson'}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Award size={14} /> {Math.round(progressPct)}% complete</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {totalLessons} lessons</span>
            </div>
          </div>

          {lessonType !== 'text' && (
            <Card padding="none" className="aspect-video bg-navy-950 overflow-hidden relative group rounded-2xl border border-slate-100 shadow-md">
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
                      <div className="w-full h-full relative flex flex-col items-center justify-center p-6 text-center bg-slate-900/60">
                        <img
                          src={imgSrc}
                          alt="Lesson"
                          className="absolute inset-0 w-full h-full object-cover opacity-20"
                        />
                        <div className="relative z-10 flex flex-col items-center space-y-2">
                          <Play size={40} className="text-white/50" />
                          <span className="text-xs font-bold text-slate-300">No video URL provided for this lesson</span>
                        </div>
                      </div>
                    );
                  }
                })()
              )}

              {lessonType === 'pdf' && activeLesson?.file_url ? (
                <iframe
                  src={resolveUrl(activeLesson.file_url)}
                  title={activeLesson?.title}
                  className="w-full h-full border-0 bg-white"
                />
              ) : (lessonType === 'pdf' || lessonType === 'ppt') ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-navy-950 text-white relative">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-400 via-navy-900 to-navy-950 pointer-events-none" />
                  <div className="relative z-10 flex flex-col items-center max-w-md text-center space-y-4">
                    <div className="p-4 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                      <FileText size={48} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black tracking-widest text-teal-400 uppercase">
                        {lessonType.toUpperCase()} DOCUMENT
                      </span>
                      <h2 className="text-lg font-black tracking-tight line-clamp-2">
                        {activeLesson?.title}
                      </h2>
                      {activeLesson?.file_url && (
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
                          {activeLesson.file_url.split('/').pop()}
                        </p>
                      )}
                    </div>
                    {activeLesson?.file_url ? (
                      <div className="flex gap-3 pt-2">
                        <a
                          href={resolveUrl(activeLesson.file_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-navy-955 hover:bg-teal-400 transition-all flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
                        >
                          View Document
                        </a>
                        <a
                          href={resolveUrl(activeLesson.file_url)}
                          download
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all flex items-center gap-1.5"
                        >
                          <Download size={14} /> Download
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic pt-2">No file has been uploaded for this document yet.</p>
                    )}
                  </div>
                </div>
              ) : null}

              {lessonType === 'link' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-navy-950 text-white relative">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 via-navy-900 to-navy-950 pointer-events-none" />
                  <div className="relative z-10 flex flex-col items-center max-w-md text-center space-y-4">
                    <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      <ExternalLink size={48} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">
                        EXTERNAL WEB REFERENCE
                      </span>
                      <h2 className="text-lg font-black tracking-tight line-clamp-2">
                        {activeLesson?.title}
                      </h2>
                      {activeLesson?.file_url && (
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
                          {activeLesson.file_url}
                        </p>
                      )}
                    </div>
                    {activeLesson?.file_url ? (
                      <div className="pt-2">
                        <a
                          href={resolveUrl(activeLesson.file_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 py-3 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                          Go to External Site <ExternalLink size={14} />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic pt-2">No web link has been set for this reference yet.</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card className="space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {activeLesson?.content || 'Select a lesson from the curriculum to begin learning.'}
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-bold text-navy-900">
              <span className="flex items-center gap-1.5"><Clock size={14} /> {lessonDuration} min</span>
              {lessonResources.length > 0 && (
                <span className="flex items-center gap-1.5"><Award size={14} /> {lessonResources.length} {lessonResources.length === 1 ? 'Resource' : 'Resources'} included</span>
              )}
            </div>

            {lessonResources.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="text-sm font-extrabold text-navy-900">Lesson Resources</h3>
                <div className="space-y-2">
                  {lessonResources.map((res: any) => {
                    const isLink = res.type === 'link';
                    const fileExt = res.url?.split('.').pop()?.toLowerCase();
                    const isPDF = res.type === 'pdf' || fileExt === 'pdf';
                    const isPPT = res.type === 'ppt' || fileExt === 'ppt' || fileExt === 'pptx';
                    const isVideo = res.type === 'video' || fileExt === 'mp4' || fileExt === 'mov' || fileExt === 'avi';
                    
                    return (
                      <div key={res.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <FileText
                            size={18}
                            className={
                              isPDF
                                ? "text-rose-500"
                                : isPPT
                                  ? "text-amber-500"
                                  : isVideo
                                    ? "text-sky-500"
                                    : "text-blue-500"
                            }
                          />
                          <span className="text-xs font-bold text-navy-900 truncate" title={res.title}>
                            {res.title}
                          </span>
                        </div>
                        {isLink ? (
                          <a
                            href={resolveUrl(res.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 flex-shrink-0"
                          >
                            <ExternalLink size={14} /> Open Link
                          </a>
                        ) : (
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <a
                              href={resolveUrl(res.url)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-navy-800 hover:text-navy-900 flex items-center gap-1"
                            >
                              View
                            </a>
                            <a
                              href={resolveUrl(res.url)}
                              download
                              className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                            >
                              <Download size={14} /> Download
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              {prevLesson ? (
                <button
                  type="button"
                  onClick={() => setActiveLessonId(prevLesson.id)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-navy-900"
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
                {nextLesson ? (
                  <button
                    type="button"
                    onClick={() => setActiveLessonId(nextLesson.id)}
                    className="flex items-center gap-2 text-sm font-bold text-navy-900 hover:text-navy-800"
                  >
                    Next <ChevronRight size={18} />
                  </button>
                ) : null}
              </div>
            </div>
          </Card>
        </div>

        <Card className="h-fit space-y-4">
          <h3 className="font-extrabold text-sm text-navy-900 uppercase tracking-wider">Curriculum</h3>
          <div className="space-y-3">
            {modules.map((mod) => (
              <div key={mod.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 text-left"
                >
                  <span className="text-[11px] font-black text-navy-900 uppercase truncate pr-2">{mod.title}</span>
                  {expandedModules[mod.id] ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
                </button>
                {expandedModules[mod.id] && (
                  <div className="p-2 space-y-1">
                    {(mod.lessons || []).map((lesson: any) => {
                      const isActive = lesson.id === activeLessonId;
                      const isCompleted = completedIds.includes(lesson.id);
                      const itemType = lesson.type || lesson.content_type || 'video';
                      const itemDuration = lesson.estimated_duration || lesson.duration_minutes || 0;
                      
                      const IconComponent = itemType === 'video' 
                        ? Play 
                        : itemType === 'link' 
                          ? ExternalLink 
                          : FileText;

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => setActiveLessonId(lesson.id)}
                          className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all ${
                            isActive ? 'bg-navy-900 text-white' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <IconComponent size={14} className={isActive ? 'text-teal-400' : 'text-slate-550'} />
                            <span className="text-xs font-bold truncate">{lesson.title}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                              {itemDuration} min
                            </span>
                            {isCompleted && <CheckCircle2 size={14} className="text-emerald-500" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2">
            {courseId && (
              <>
                <Link to={`/student/courses/${courseId}/quizzes`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <HelpCircle size={14} /> View Quizzes
                  </Button>
                </Link>
                <Link to={`/student/courses/${courseId}/assignments`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <ClipboardList size={14} /> View Assignments
                  </Button>
                </Link>
              </>
            )}
          </div>

          {courseId && (
            <Link to={`/student/courses/${courseId}`} className="block text-center text-xs font-bold text-navy-800 hover:underline">
              Back to course overview
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}

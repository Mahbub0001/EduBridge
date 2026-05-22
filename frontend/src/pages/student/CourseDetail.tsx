/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, Users, BarChart3, Play, BookOpen, FileText, MessageSquare, GraduationCap, Megaphone } from 'lucide-react';
import { getCourse, getCourseModules, enrollCourse, getMyEnrollment } from '../../services/courseService';
import { getStudentCourseAnnouncements } from '../../services/announcementService';
import type { Course } from '../../types';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import Badge from '../../components/ui/Badge';

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        const [c, m, e, anns] = await Promise.all([
          getCourse(courseId),
          getCourseModules(courseId).catch((err) => {
            console.error('getCourseModules failed in detail:', err);
            return [];
          }),
          getMyEnrollment(courseId).catch((err) => {
            console.error('getMyEnrollment failed in detail:', err);
            return null;
          }),
          getStudentCourseAnnouncements(courseId).catch((err) => {
            console.error('getStudentCourseAnnouncements failed in detail:', err);
            return [];
          }),
        ]);
        setCourse(c);
        setModules(m);
        setEnrollment(e);
        setAnnouncements(anns);
      } catch (err) {
        console.error('Failed to load course', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);


  const handleEnroll = async () => {
    if (!courseId) return;
    setEnrolling(true);
    try {
      await enrollCourse(courseId);
      setEnrollment({ status: 'active', progress_percent: 0 });
    } catch (err) {
      console.error('Enrollment failed', err);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading course...</div>;
  if (!course) return <div className="text-slate-500">Course not found.</div>;

  const progress = enrollment?.progress_percent ?? course.progress ?? 0;
  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'completed';

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'My Courses', href: '/student/my-courses' },
          { label: course.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="none" className="overflow-hidden">
            <div className="h-56 md:h-72 relative">
              <img src={course.thumbnail_url || course.image || course.thumbnail || 'https://placehold.co/600x400/1e293b/ffffff?text=Course'} alt={course.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                {course.category && <Badge className="!bg-white/20 !text-white mb-2">{course.category}</Badge>}
                <h1 className="text-2xl md:text-3xl font-extrabold">{course.title}</h1>
                <p className="text-sm text-slate-200 mt-1">By {course.instructor_name}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-extrabold text-navy-900 dark:text-white">About this course</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{course.description || 'No description available.'}</p>
            <div className="flex flex-wrap gap-6 pt-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2"><Clock size={16} /> {course.estimated_hours || 20}+ hours</span>
              <span className="flex items-center gap-2"><BarChart3 size={16} /> {course.level || 'All levels'}</span>
              <span className="flex items-center gap-2"><Users size={16} /> {course.enrollment_count || 0} students</span>
            </div>
            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <div className="pt-2">
                <h3 className="text-sm font-extrabold text-navy-900 dark:text-white mb-2">What you'll learn</h3>
                <ul className="space-y-1.5">
                  {course.learning_outcomes.map((o, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-teal-500 mt-0.5">✓</span> {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="pt-2">
                <h3 className="text-sm font-extrabold text-navy-900 dark:text-white mb-2">Prerequisites</h3>
                <ul className="space-y-1.5">
                  {course.prerequisites.map((p, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5">▸</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-extrabold text-navy-900 dark:text-white">Course Syllabus ({modules.length} modules, {totalLessons} lessons)</h2>
            <div className="space-y-3">
              {modules.length > 0 ? modules.map((m, idx) => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-navy-900 dark:bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Module {idx + 1}</p>
                      <p className="text-sm font-bold text-navy-900 dark:text-white">{m.title}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{m.lessons?.length || 0} lessons</span>
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Syllabus not yet available.</p>
              )}
            </div>
          </Card>

          {/* Announcements Card */}
          {isEnrolled && announcements.length > 0 && (
            <Card className="space-y-4">
              <h2 className="text-lg font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
                <Megaphone className="text-slate-500 dark:text-slate-400" size={20} />
                Course Announcements
              </h2>
              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                {announcements.map((ann) => {
                  const isUrgent = ann.priority === 'urgent';
                  const isImportant = ann.priority === 'important';
                  return (
                    <div key={ann.id} className={`pt-4 first:pt-0 space-y-2 relative overflow-hidden`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={isUrgent ? 'danger' : isImportant ? 'warning' : 'default'} className="text-[8px] uppercase">
                          {ann.priority} Priority
                        </Badge>
                        <span className="text-[10px] text-slate-400 dark:text-slate-550 font-mono">
                          {new Date(ann.published_at || ann.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-navy-900 dark:text-white">{ann.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="space-y-5 sticky top-4">
            {isEnrolled && !isCompleted && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Your progress</span>
                  <span className="text-navy-900 dark:text-white">{Math.round(progress)}%</span>
                </div>
                <ProgressBar value={Math.round(progress)} />
              </div>
            )}

            {isEnrolled ? (
              <Link to={`/student/courses/${course.id}/learn`}>
                <Button variant="primary" size="lg" className="w-full !bg-navy-900 dark:!bg-teal-600 dark:hover:!bg-teal-500">
                  <Play size={18} className="fill-white" />
                  {isCompleted ? 'Review Course' : 'Continue Learning'}
                </Button>
              </Link>
            ) : (
              <Button variant="primary" size="lg" className="w-full !bg-navy-900 dark:!bg-teal-600 dark:hover:!bg-teal-500" onClick={handleEnroll} disabled={enrolling}>
                <GraduationCap size={18} />
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </Button>
            )}

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {[
                { icon: BookOpen, label: `${modules.length} Modules` },
                { icon: FileText, label: `${totalLessons} Lessons` },
                { icon: MessageSquare, label: 'Forum' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <Icon size={18} className="mx-auto text-navy-800 dark:text-teal-400 mb-1" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{label}</span>
                </div>
              ))}
            </div>

            {isCompleted && enrollment?.final_grade && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl text-center">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Final Grade</p>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{enrollment.final_grade}%</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

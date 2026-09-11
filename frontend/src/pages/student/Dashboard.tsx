import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, CheckCircle, Clipboard, Award, Clock, ArrowRight, Play,
  ChevronLeft, ChevronRight, Calendar, Bell,
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { getMyCourses, getCourses } from '../../services/courseService';
import { getNotifications } from '../../services/notificationService';
import { getAllAssignments } from '../../services/assignmentService';
import { getMyCertificates } from '../../services/certificateService';
import type { Course, Notification, Assignment } from '../../types';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import Button from '../../components/ui/Button';
import CourseThumbnail from '../../components/ui/CourseThumbnail';
import PageHeader from '../../components/layout/PageHeader';
import { useTranslation } from '../../utils/translations';

const CATEGORY_COLORS = [
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-450',
  'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400'
];

function CircularProgress({ value }: { value: number }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const { t } = useTranslation();
  return (
    <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 176 176">
        <circle cx="88" cy="88" r={r} strokeWidth="14" fill="transparent" className="stroke-slate-200 dark:stroke-slate-800" />
        <circle
          cx="88" cy="88" r={r} strokeWidth="14" fill="transparent"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)}
          strokeLinecap="round" className="stroke-teal-600 dark:stroke-teal-500 transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center text-center">
        <span className="text-3xl font-extrabold text-navy-900 dark:text-white">{value}%</span>
        <span className="text-[9px] tracking-widest text-slate-500 dark:text-slate-400 font-extrabold uppercase">{t('progress')}</span>
      </div>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h || 1} hours ago`;
  return `${Math.floor(h / 24)} days ago`;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [certCount, setCertCount] = useState(0);
  const [recommended, setRecommended] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, n, a, certs, allPublished] = await Promise.all([
          getMyCourses(),
          getNotifications().catch(() => []),
          getAllAssignments().catch(() => []),
          getMyCertificates().catch(() => []),
          getCourses('published').catch(() => []),
        ]);
        setCourses(c);
        setNotifications(n);
        setAssignments(a);
        setCertCount(certs.length);

        // Filter out courses that the student is already enrolled in
        const enrolledIds = new Set(
          c.filter((course) => course.status === 'in-progress' || course.status === 'completed').map((course) => course.id)
        );
        const filteredRecommended = allPublished.filter((course) => !enrolledIds.has(course.id)).slice(0, 4);
        setRecommended(filteredRecommended);
      } catch (e) {
        console.error('Dashboard load failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { t } = useTranslation();
  const userName = user?.name?.split(' ')[0] || 'Student';
  const enrolledCourses = courses
    .filter((c) => c.status !== 'wishlist')
    .sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
  const activeCourses = courses
    .filter((c) => c.status === 'in-progress' || c.status === 'active' || c.status === 'enrolled')
    .sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
  const completedCount = courses.filter((c) => c.status === 'completed').length;
  const featured = activeCourses[0] || enrolledCourses[0];
  const heroProgress = featured?.progress ?? 0;

  const stats = [
    { label: t('enrolledCourses'), value: String(enrolledCourses.length).padStart(2, '0'), icon: BookOpen, iconBg: 'bg-blue-50 text-blue-600', iconColor: 'text-blue-600', trend: `${enrolledCourses.length} Total`, link: '/student/my-courses/all' },
    { label: t('completedCourses'), value: String(completedCount).padStart(2, '0'), icon: CheckCircle, iconBg: 'bg-emerald-50 text-emerald-600', iconColor: 'text-emerald-600', trend: `${completedCount} Done`, link: '/student/my-courses/completed' },
    { label: t('pendingAssignments'), value: String(assignments.filter((a) => a.status === 'pending').length).padStart(2, '0'), icon: Clipboard, iconBg: 'bg-rose-50 text-rose-600', iconColor: 'text-rose-600', trend: 'Action Needed', link: '/student/assignments' },
    { label: t('certificates'), value: String(certCount).padStart(2, '0'), icon: Award, iconBg: 'bg-purple-50 text-purple-600', iconColor: 'text-purple-600', trend: 'Earned', link: '/student/certificates' },
  ];

  const pendingTasks = assignments.filter((a) => a.status === 'pending').slice(0, 2);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={t('dashboard')} description="Overview of your learning progress, upcoming tasks, and recommendations." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card padding="lg" className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/40 border-slate-200/80 dark:from-slate-900 dark:via-slate-900/90 dark:to-teal-950/20 dark:border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
          <div className="space-y-4 max-w-md z-10">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-teal-100/80 text-teal-800 text-xs font-bold rounded-full dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/50 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
              {t('welcomeBack')}, {userName}!
            </span>
            <h1 className="text-3xl font-extrabold text-navy-900 dark:text-white leading-tight tracking-tight">
              {t('journeyContinues')}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {featured
                ? t('completedProgress').replace('{progress}', String(heroProgress)).replace('{title}', featured.title)
                : t('exploreCoursesDesc')}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              {featured && (
                <Link to={`/student/courses/${featured.id}/learn`}>
                  <Button variant="primary" className="!bg-navy-900 hover:!bg-navy-800 dark:!bg-teal-600 dark:hover:!bg-teal-500 !rounded-2xl gap-3 shadow-md hover:shadow-lg transition-all">
                    <span className="flex flex-col items-start leading-none text-left">
                      <span className="text-[10px] tracking-wider uppercase text-slate-300 font-medium">Resume</span>
                      <span className="text-sm font-bold">Learning</span>
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                      <Play size={14} className="fill-white text-white ml-0.5" />
                    </span>
                  </Button>
                </Link>
              )}
              <Link to="/student/calendar">
                <Button variant="outline" className="!rounded-2xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span className="flex flex-col items-start leading-none text-left">
                    <span className="text-[10px] tracking-wider uppercase text-slate-500 dark:text-slate-400 font-medium">View</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Plan</span>
                  </span>
                </Button>
              </Link>
            </div>
          </div>
          <CircularProgress value={heroProgress} />
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <Link key={s.label} to={s.link} className="block group">
              <StatCard
                label={s.label}
                value={s.value}
                icon={s.icon}
                iconBg={s.iconBg}
                iconColor={s.iconColor}
                trend={s.trend}
                className="cursor-pointer"
              />
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-navy-900 dark:text-white">{t('activeCourses')}</h2>
          <Link to="/student/my-courses" className="text-sm font-bold text-navy-800 hover:text-navy-900 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1.5 font-bold">
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCourses.length > 0 ? (
            activeCourses.slice(0, 3).map((course, idx) => (
              <Link key={course.id} to={`/student/courses/${course.id}/learn`}>
                <Card padding="none" className="overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors group cursor-pointer h-full flex flex-col">
                  <div className="h-44 overflow-hidden">
                    <CourseThumbnail
                      title={course.title}
                      category={course.category}
                      image={course.thumbnail_url || course.image || course.thumbnail}
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className={`px-2.5 py-1 rounded-full ${CATEGORY_COLORS[idx % 3]}`}>{course.category}</span>
                        {course.time_spent && (
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock size={14} />{course.time_spent}</span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-navy-900 line-clamp-1 group-hover:text-navy-800 dark:text-white dark:group-hover:text-teal-400">{course.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">By {course.instructor_name}</p>
                    </div>
                    <ProgressBar value={course.progress ?? 0} showLabel />
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="text-center py-12 flex flex-col items-center justify-center border-dashed border-2 border-slate-300 dark:border-slate-800">
                <BookOpen className="text-slate-400 dark:text-slate-500 mb-3" size={40} />
                <h3 className="text-base font-extrabold text-navy-900 dark:text-white">{t('noActiveCourses')}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {t('noActiveCoursesDesc')}
                </p>
                <Link to="/student/my-courses/explore" className="mt-4">
                  <Button variant="primary" className="!bg-teal-600 hover:!bg-teal-700 !rounded-xl text-xs font-bold py-2 px-4">
                    {t('exploreCoursesBtn')}
                  </Button>
                </Link>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="space-y-4">
            <h3 className="font-extrabold text-sm text-navy-900 uppercase tracking-wider flex items-center gap-2 dark:text-white">
              <Calendar size={16} className="text-slate-500 dark:text-slate-400" /> {t('upcomingTasks')}
            </h3>
            <div className="space-y-3">
              {pendingTasks.length ? pendingTasks.map((task) => {
                const d = new Date(task.due_date);
                return (
                  <div key={task.id} className="p-4 bg-slate-50 dark:bg-slate-900/40 border-l-4 border-l-rose-500 rounded-2xl flex items-center gap-4">
                    <div className="bg-white dark:bg-slate-950 rounded-xl py-1.5 px-3 border border-slate-200 dark:border-slate-800 text-center flex-shrink-0">
                      <div className="text-[9px] font-black text-rose-600 dark:text-rose-450 uppercase">{d.toLocaleString('en', { month: 'short' })}</div>
                      <div className="text-lg font-black text-navy-900 dark:text-white">{d.getDate()}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-navy-900 dark:text-white line-clamp-1">{task.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{task.course_name}</p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('noPendingTasks')}</p>
              )}
            </div>
          </Card>

          <Card className="space-y-4 relative overflow-hidden">
            <h3 className="font-extrabold text-sm text-navy-900 uppercase tracking-wider flex items-center gap-2 dark:text-white">
              <Bell size={16} className="text-slate-500 dark:text-slate-400" /> {t('noticeBoard')}
            </h3>
            <div className="space-y-4">
              {notifications.slice(0, 3).map((n, i) => (
                <div key={n.id} className="flex gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-navy-900 dark:bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{n.title}: {n.message}</p>
                    <span className="text-[10px] text-slate-400 font-bold dark:text-slate-500">{timeAgo(n.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-navy-900 dark:text-white">{t('recommendedForYou')}</h2>
            <div className="flex gap-2">
              <button type="button" className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                <ChevronLeft size={16} className="text-slate-500 dark:text-slate-400" />
              </button>
              <button type="button" className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                <ChevronRight size={16} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>
          {recommended.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommended.map((rec) => (
                <Link to={`/student/courses/${rec.id}`} key={rec.id} className="block">
                  <Card className="flex gap-4 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer group h-full">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                      <CourseThumbnail
                        title={rec.title}
                        category={rec.category}
                        image={rec.thumbnail_url || rec.image || rec.thumbnail}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <h3 className="text-xs font-extrabold text-navy-900 line-clamp-2 group-hover:text-navy-800 dark:text-white dark:group-hover:text-teal-400">{rec.title}</h3>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        <span>{rec.estimated_hours ? `${rec.estimated_hours}h` : '20h'} • {rec.level || 'All levels'}</span>
                        <span className="text-teal-600 dark:text-teal-400 font-extrabold">★ {rec.rating_avg ?? rec.rating ?? '5.0'}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-450 font-medium">No new recommendations at the moment. Keep exploring!</p>
          )}
        </div>
      </div>
    </div>
  );
}

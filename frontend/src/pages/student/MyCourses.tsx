import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Clock, Award, Star, BookOpen, Trash2, ArrowRight, TrendingUp } from 'lucide-react';
import { getMyCourses, enrollCourse, removeFromWishlist, getCourses, getMyWishlist, addToWishlist } from '../../services/courseService';
import type { Course } from '../../types';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const TABS = [
  { key: 'all', label: 'All', path: '/student/my-courses/all' },
  { key: 'in-progress', label: 'In Progress', path: '/student/my-courses/in-progress' },
  { key: 'completed', label: 'Completed', path: '/student/my-courses/completed' },
  { key: 'wishlist', label: 'Wishlist', path: '/student/my-courses/wishlist' },
  { key: 'explore', label: 'Explore', path: '/student/my-courses/explore' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const CATEGORY_COLORS = ['bg-emerald-50 text-emerald-700', 'bg-blue-50 text-blue-700', 'bg-purple-50 text-purple-700', 'bg-rose-50 text-rose-700'];

function tabFromPath(pathname: string): TabKey {
  if (pathname.includes('/explore')) return 'explore';
  if (pathname.includes('/wishlist')) return 'wishlist';
  if (pathname.includes('/completed')) return 'completed';
  if (pathname.includes('/in-progress')) return 'in-progress';
  return 'all';
}

export default function MyCourses() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = tabFromPath(location.pathname);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allPublishedCourses, setAllPublishedCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      const [enrolled, wishlist, allPublished] = await Promise.all([
        getMyCourses(),
        getMyWishlist().catch(() => []),
        getCourses('published').catch(() => []),
      ]);
      const wishlistWithStatus = wishlist.map((c: any) => ({ ...c, status: 'wishlist' as const }));
      setCourses([...enrolled, ...wishlistWithStatus]);
      setAllPublishedCourses(allPublished);
    } catch (err) {
      console.error('Failed to load courses data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (location.pathname === '/student/my-courses' || location.pathname === '/student/my-courses/') {
      navigate('/student/my-courses/all', { replace: true });
    }
  }, [location.pathname, navigate]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (activeTab === 'explore') {
      const enrolledIds = new Set(
        courses.filter((c) => c.status === 'in-progress' || c.status === 'completed').map((c) => c.id)
      );
      return allPublishedCourses.filter((c) => {
        if (enrolledIds.has(c.id)) return false;
        return (
          c.title.toLowerCase().includes(q) ||
          (c.instructor_name?.toLowerCase().includes(q) ?? false)
        );
      });
    }

    return courses.filter((c) => {
      const match =
        c.title.toLowerCase().includes(q) ||
        (c.instructor_name?.toLowerCase().includes(q) ?? false);
      if (!match) return false;
      if (activeTab === 'all') return c.status !== 'wishlist';
      if (activeTab === 'in-progress') return c.status === 'in-progress';
      if (activeTab === 'completed') return c.status === 'completed';
      return c.status === 'wishlist';
    });
  }, [courses, allPublishedCourses, searchQuery, activeTab]);

  const inProgressCount = courses.filter((c) => c.status === 'in-progress').length;
  const avgProgress = Math.round(
    courses.filter((c) => c.status === 'in-progress').reduce((s, c) => s + (c.progress ?? 0), 0) /
      Math.max(inProgressCount, 1)
  );

  const handleEnroll = async (id: string) => {
    try {
      await enrollCourse(id);
      await fetchAllData();
    } catch {
      // fallback optimistic update
      setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'in-progress' as const, progress: 0 } : c)));
    }
  };

  const handleAddToWishlist = async (id: string) => {
    try {
      await addToWishlist(id);
      await fetchAllData();
    } catch (err) {
      console.error('Failed to add to wishlist', err);
    }
  };

  const handleRemoveFromWishlist = async (id: string) => {
    try {
      await removeFromWishlist(id);
      await fetchAllData();
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading courses...</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Courses"
        description="Track your progress and continue learning your enrolled programs."
        action={
          <div className="flex items-center bg-slate-100 rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-slate-300 focus-within:bg-white w-full sm:w-72">
            <Search size={16} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search my courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full ml-2 text-xs"
            />
          </div>
        }
      />

      {activeTab === 'in-progress' && inProgressCount > 0 && (
        <Card className="bg-gradient-to-r from-navy-900 to-navy-800 text-white border-0 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Weekly Learning Insight</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                You're averaging {avgProgress}% across {inProgressCount} active course{inProgressCount > 1 ? 's' : ''}. Keep it up!
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black">{avgProgress}%</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Avg Progress</div>
          </div>
        </Card>
      )}

      <div className="border-b border-slate-200 flex gap-6 overflow-x-auto">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            to={tab.path}
            className={`pb-4 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === tab.key ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-navy-900'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, idx) => (
            <Card key={course.id} padding="none" className="overflow-hidden hover:border-slate-300 group">
              <Link to={`/student/courses/${course.id}`} className="block">
                <div className="h-44 overflow-hidden relative">
                  <img src={course.thumbnail_url || course.image || course.thumbnail || 'https://placehold.co/600x400/1e293b/ffffff?text=Course'} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {courses.some((c) => c.id === course.id && c.status === 'wishlist') && (
                    <span className="absolute top-4 right-4 p-2 bg-white/90 rounded-full text-rose-500 shadow-sm">
                      <Star size={16} className="fill-rose-500" />
                    </span>
                  )}
                  {course.status === 'completed' && (
                    <span className="absolute top-4 left-4">
                      <Badge variant="success">Completed</Badge>
                    </span>
                  )}
                </div>
              </Link>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className={`px-2.5 py-1 rounded-full ${CATEGORY_COLORS[idx % 4]}`}>{course.category}</span>
                    {course.status === 'in-progress' && course.time_spent && (
                      <span className="text-slate-500 flex items-center gap-1"><Clock size={14} />{course.time_spent}</span>
                    )}
                    {course.status === 'completed' && course.final_grade && (
                      <span className="text-emerald-600 flex items-center gap-1 font-bold"><Award size={14} />{course.final_grade}%</span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-navy-900 line-clamp-1">{course.title}</h3>
                  <p className="text-xs text-slate-500">By {course.instructor_name}</p>
                  {course.status === 'completed' && course.completed_on && (
                    <p className="text-[10px] text-slate-400">Completed {course.completed_on}</p>
                  )}
                  {course.status !== 'in-progress' && course.status !== 'completed' && (course.rating_avg ?? course.rating) && (
                    <p className="text-xs text-teal-600 font-bold">★ {course.rating_avg ?? course.rating} {course.price && `• $${course.price}`}</p>
                  )}
                </div>

                {course.status === 'in-progress' && (
                  <>
                    {course.next_lesson && (
                      <p className="text-[10px] text-slate-500">Next: <span className="font-bold text-navy-900">{course.next_lesson}</span></p>
                    )}
                    <ProgressBar value={course.progress ?? 0} showLabel />
                    <Link to={`/student/courses/${course.id}/learn`}>
                      <Button variant="primary" size="sm" className="w-full !bg-navy-900">Continue Learning</Button>
                    </Link>
                  </>
                )}

                {course.status === 'completed' && (
                  <div className="flex gap-2">
                    <Link to={`/student/courses/${course.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">View Certificate</Button>
                    </Link>
                    <Link to={`/student/courses/${course.id}/learn`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">Review</Button>
                    </Link>
                  </div>
                )}

                {course.status === 'wishlist' && (
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      className="text-xs font-bold text-rose-600 flex items-center gap-1"
                      onClick={() => handleRemoveFromWishlist(course.id)}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                    <Button variant="primary" size="sm" className="!bg-navy-900" onClick={() => handleEnroll(course.id)}>
                      Enroll <ArrowRight size={12} />
                    </Button>
                  </div>
                )}

                {course.status !== 'in-progress' && course.status !== 'completed' && course.status !== 'wishlist' && (
                  <div className="flex justify-between items-center gap-2">
                    {courses.some((c) => c.id === course.id && c.status === 'wishlist') ? (
                      <button
                        type="button"
                        className="text-xs font-bold text-rose-600 flex items-center gap-1 hover:text-rose-700 transition-colors"
                        onClick={() => handleRemoveFromWishlist(course.id)}
                      >
                        <Trash2 size={14} /> Remove Wishlist
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-navy-900 transition-colors"
                        onClick={() => handleAddToWishlist(course.id)}
                      >
                        <Star size={14} /> Wishlist
                      </button>
                    )}
                    <Button variant="primary" size="sm" className="!bg-navy-900 hover:!bg-navy-800" onClick={() => handleEnroll(course.id)}>
                      Enroll <ArrowRight size={12} />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <BookOpen className="mx-auto text-slate-300" size={48} />
          <h3 className="text-lg font-bold text-navy-900 mt-4">No courses found</h3>
          <p className="text-sm text-slate-500 mt-2">No courses match your filters.</p>
        </Card>
      )}
    </div>
  );
}

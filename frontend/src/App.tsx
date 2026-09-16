import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useAuthStore } from './store';
import { establishSession } from './services/authService';
import ThemeProvider from './components/ThemeProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';

import PublicLayout from './layouts/PublicLayout';
import StudentLayout from './layouts/StudentLayout';
import InstructorLayout from './layouts/InstructorLayout';
import AdminLayout from './layouts/AdminLayout';

// Critical direct public routes
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/student/Dashboard';
import MyCourses from './pages/student/MyCourses';
import CourseDetail from './pages/student/CourseDetail';

// Code-split student routes
const CourseLearning = lazy(() => import('./pages/student/CourseLearning'));
const Calendar = lazy(() => import('./pages/student/Calendar'));
const Assignments = lazy(() => import('./pages/student/Assignments'));
const Settings = lazy(() => import('./pages/student/Settings'));
const Discussions = lazy(() => import('./pages/student/Discussions'));
const Certificates = lazy(() => import('./pages/student/Certificates'));
const StudentAnnouncements = lazy(() => import('./pages/student/Announcements'));
const CommunityZone = lazy(() => import('./pages/CommunityZone'));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate'));

// Code-split instructor routes
const InstructorDashboard = lazy(() => import('./pages/instructor/Dashboard'));
const InstructorCourses = lazy(() => import('./pages/instructor/Courses'));
const CourseBuilder = lazy(() => import('./pages/instructor/CourseBuilder'));
const InstructorQuizzes = lazy(() => import('./pages/instructor/Quizzes'));
const InstructorAssignments = lazy(() => import('./pages/instructor/Assignments'));
const InstructorSubmissions = lazy(() => import('./pages/instructor/Submissions'));
const InstructorAnalytics = lazy(() => import('./pages/instructor/Analytics'));
const InstructorAnnouncements = lazy(() => import('./pages/instructor/Announcements'));
const InstructorDiscussions = lazy(() => import('./pages/instructor/Discussions'));
const InstructorSettings = lazy(() => import('./pages/instructor/Settings'));
const InstructorHelpCenter = lazy(() => import('./pages/instructor/HelpCenter'));
const CreateCourse = lazy(() => import('./pages/instructor/CreateCourse'));

// Code-split admin routes
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminCourses = lazy(() => import('./pages/admin/Courses'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminEnrollments = lazy(() => import('./pages/admin/Enrollments'));
const AdminCertificates = lazy(() => import('./pages/admin/Certificates'));

const PageFallback = () => (
  <div className="flex min-h-[400px] w-full items-center justify-center">
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800 dark:border-slate-700 dark:border-t-teal-400" />
      <span>Loading...</span>
    </div>
  </div>
);

function App() {
  const { setUser, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Use cached token instead of force-refreshing
          await firebaseUser.getIdToken();
          const sessionUser = await establishSession();
          setUser({
            uid: sessionUser.uid || sessionUser.id || firebaseUser.uid,
            email: sessionUser.email,
            name: sessionUser.name,
            role: sessionUser.role,
          });
        } catch (error: any) {
          console.error('Login session sync failed', error);
          // Only clear user state if it's a clear authentication failure (401/403) or if there is no user in the store
          const isAuthError = error?.response?.status === 401 || error?.response?.status === 403;
          if (isAuthError || !useAuthStore.getState().user) {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC] text-slate-500 dark:bg-slate-950">
        Loading EduBridge...
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Suspense fallback={<PageFallback />}>
          <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-certificate/:certificateId" element={<VerifyCertificate />} />
          <Route
            path="/learning/:courseId"
            element={
              <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
                <CourseLearning />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="my-courses" element={<MyCourses />} />
            <Route path="my-courses/all" element={<MyCourses />} />
            <Route path="my-courses/in-progress" element={<MyCourses />} />
            <Route path="my-courses/completed" element={<MyCourses />} />
            <Route path="my-courses/wishlist" element={<MyCourses />} />
            <Route path="my-courses/explore" element={<MyCourses />} />
            <Route path="courses/:courseId" element={<CourseDetail />} />
            <Route path="courses/:courseId/learn" element={<CourseLearning />} />
            <Route path="learning/:courseId" element={<CourseLearning />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="announcements" element={<StudentAnnouncements />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="community" element={<CommunityZone />} />
            <Route path="discussions" element={<Discussions />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="settings" element={<Settings />} />
            <Route path="settings/profile" element={<Settings />} />
            <Route path="settings/account" element={<Settings />} />
            <Route path="settings/notifications" element={<Settings />} />
            <Route path="settings/appearance" element={<Settings />} />
            <Route path="courses" element={<Navigate to="/student/my-courses/all" replace />} />
          </Route>

          <Route
            path="/instructor"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<InstructorDashboard />} />
            <Route path="courses" element={<InstructorCourses />} />
            <Route path="community" element={<CommunityZone />} />
            <Route path="create-course" element={<CreateCourse />} />

            <Route path="course-builder" element={<CourseBuilder />} />
            <Route path="quizzes" element={<InstructorQuizzes />} />
            <Route path="assignments" element={<InstructorAssignments />} />
            <Route path="submissions" element={<InstructorSubmissions />} />
            <Route path="analytics" element={<InstructorAnalytics />} />
            <Route path="announcements" element={<InstructorAnnouncements />} />
            <Route path="discussions" element={<InstructorDiscussions />} />
            <Route path="students" element={<Navigate to="/instructor/analytics?tab=students" replace />} />
            <Route path="settings" element={<InstructorSettings />} />
            <Route path="help" element={<InstructorHelpCenter />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="enrollments" element={<AdminEnrollments />} />
            <Route path="certificates" element={<AdminCertificates />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="community" element={<CommunityZone />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  </ThemeProvider>
  );
}

export default App;

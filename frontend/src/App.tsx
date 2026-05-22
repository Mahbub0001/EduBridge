import { useEffect } from 'react';
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

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/student/Dashboard';
import MyCourses from './pages/student/MyCourses';
import CourseDetail from './pages/student/CourseDetail';
import CourseLearning from './pages/student/CourseLearning';
import Calendar from './pages/student/Calendar';
import Resources from './pages/student/Resources';
import Assignments from './pages/student/Assignments';
import Settings from './pages/student/Settings';
import Discussions from './pages/student/Discussions';
import Certificates from './pages/student/Certificates';

import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorCourses from './pages/instructor/Courses';
import CourseBuilder from './pages/instructor/CourseBuilder';
import InstructorQuizzes from './pages/instructor/Quizzes';
import InstructorAssignments from './pages/instructor/Assignments';
import InstructorSubmissions from './pages/instructor/Submissions';
import InstructorAnalytics from './pages/instructor/Analytics';
import InstructorAnnouncements from './pages/instructor/Announcements';
import InstructorDiscussions from './pages/instructor/Discussions';
import InstructorStudents from './pages/instructor/Students';
import InstructorSettings from './pages/instructor/Settings';
import InstructorHelpCenter from './pages/instructor/HelpCenter';
import CreateCourse from './pages/instructor/CreateCourse';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCourses from './pages/admin/Courses';
import AdminCategories from './pages/admin/Categories';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/Settings';
import VerifyCertificate from './pages/VerifyCertificate';

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
            <Route path="resources" element={<Resources />} />
            <Route path="assignments" element={<Assignments />} />
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
            <Route path="create-course" element={<CreateCourse />} />
            <Route path="course-builder" element={<CourseBuilder />} />
            <Route path="quizzes" element={<InstructorQuizzes />} />
            <Route path="assignments" element={<InstructorAssignments />} />
            <Route path="submissions" element={<InstructorSubmissions />} />
            <Route path="analytics" element={<InstructorAnalytics />} />
            <Route path="announcements" element={<InstructorAnnouncements />} />
            <Route path="discussions" element={<InstructorDiscussions />} />
            <Route path="students" element={<InstructorStudents />} />
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
            <Route path="categories" element={<AdminCategories />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

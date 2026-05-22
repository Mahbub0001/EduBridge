/* eslint-disable @typescript-eslint/no-explicit-any */
import api, { unwrap } from './api';

export interface InstructorDashboardSummary {
  total_courses: number;
  published_courses: number;
  draft_courses: number;
  total_enrollments: number;
  pending_submissions: number;
  average_completion_rate: number;
  total_quizzes: number;
  total_assignments: number;
  courses: InstructorCourse[];
  recent_activity: RecentActivity[];
  pending_submissions_list: PendingSubmission[];
  course_performance: CoursePerformance[];
  at_risk_students: AtRiskStudent[];
}

export interface InstructorCourse {
  id: string;
  title: string;
  status: string;
  enrollment_count: number;
  module_count: number;
  quiz_count: number;
  assignment_count: number;
  completion_rate: number;
  updated_at: string;
}

export interface RecentActivity {
  student_name: string;
  course_title: string;
  activity: string;
  time: string;
}

export interface PendingSubmission {
  id: string;
  student_name: string;
  course_title: string;
  assignment_title: string;
  submitted_at: string;
  status: string;
  user_id: string;
  assignment_id: string;
}

export interface CoursePerformance {
  course_id: string;
  course_title: string;
  enrollments: number;
  completed: number;
  completion_rate: number;
}

export interface AtRiskStudent {
  student_name: string;
  course_title: string;
  progress: number;
  enrolled_at: string;
}

export async function getInstructorDashboardSummary(): Promise<InstructorDashboardSummary> {
  const res = await api.get('/analytics/instructor/dashboard-summary');
  return unwrap<InstructorDashboardSummary>(res);
}

export async function getInstructorComprehensiveAnalytics(courseId?: string, dateRange?: string): Promise<any> {
  const params: Record<string, string> = {};
  if (courseId) params.course_id = courseId;
  if (dateRange) params.date_range = dateRange;
  const res = await api.get('/instructor/analytics', { params });
  return unwrap<any>(res);
}

export async function getInstructorStudentsList(): Promise<any[]> {
  const res = await api.get('/instructor/students');
  return unwrap<any[]>(res);
}

export async function getInstructorStudentProgress(studentId: string, courseId: string): Promise<any> {
  const res = await api.get(`/instructor/students/${studentId}/progress`, { params: { course_id: courseId } });
  return unwrap<any>(res);
}

export async function sendStudentReminder(studentId: string, courseId: string, message?: string): Promise<void> {
  await api.post(`/instructor/students/${studentId}/reminder`, { course_id: courseId, message });
}

export async function saveStudentPrivateNotes(studentId: string, courseId: string, notes: string): Promise<void> {
  await api.post(`/instructor/students/${studentId}/notes`, { course_id: courseId, notes });
}




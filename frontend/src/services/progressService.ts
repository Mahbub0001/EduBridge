import api, { unwrap } from './api';

export interface CourseProgress {
  course_id: string;
  progress_percent: number;
  completed_lessons: string[];
  last_lesson_id: string | null;
  total_lessons: number;
}

export interface MarkLessonCompleteResponse {
  completed: boolean;
  progress_percent: number;
  is_course_completed?: boolean;
  certificate_id?: string;
}

export async function getCourseProgress(courseId: string): Promise<CourseProgress> {
  const res = await api.get(`/progress/courses/${courseId}/progress`);
  return unwrap<CourseProgress>(res);
}

export async function markLessonComplete(lessonId: string, courseId: string): Promise<MarkLessonCompleteResponse> {
  const res = await api.post('/progress/lesson-complete', { lesson_id: lessonId, course_id: courseId });
  return unwrap<MarkLessonCompleteResponse>(res);
}

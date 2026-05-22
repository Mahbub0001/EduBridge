/* eslint-disable @typescript-eslint/no-explicit-any */
import api, { unwrap } from './api';
import type { Course } from '../types';

export async function getCourses(status?: string): Promise<Course[]> {
  const url = status ? `/courses/?status=${status}` : '/courses/';
  const res = await api.get(url);
  return unwrap<Course[]>(res);
}

export async function getMyCourses(): Promise<Course[]> {
  const res = await api.get('/me/courses');
  return unwrap<Course[]>(res);
}

export async function getCourse(courseId: string): Promise<Course> {
  const res = await api.get(`/courses/${courseId}`);
  return unwrap<Course>(res);
}

export async function getCourseModules(courseId: string): Promise<any[]> {
  const res = await api.get(`/courses/${courseId}/modules`);
  return unwrap<any[]>(res);
}

export async function enrollCourse(courseId: string): Promise<void> {
  await api.post(`/courses/${courseId}/enroll`);
}

export async function getMyEnrollment(courseId: string): Promise<any> {
  const res = await api.get(`/courses/${courseId}/enrollment`);
  return unwrap<any>(res);
}

export async function addToWishlist(courseId: string): Promise<void> {
  await api.post(`/courses/${courseId}/wishlist`);
}

export async function removeFromWishlist(courseId: string): Promise<void> {
  await api.delete(`/courses/${courseId}/wishlist`);
}

export async function getMyWishlist(): Promise<Course[]> {
  const res = await api.get('/me/wishlist');
  return unwrap<Course[]>(res);
}

export async function getCalendar(): Promise<any[]> {
  const res = await api.get('/me/calendar');
  return unwrap<any[]>(res);
}

export async function getMyInstructorCourses(): Promise<Course[]> {
  const res = await api.get('/courses/me');
  return unwrap<Course[]>(res);
}

export async function createCourse(data: Record<string, unknown>): Promise<Course> {
  const res = await api.post('/courses/', data);
  return unwrap<Course>(res);
}

export async function updateCourse(courseId: string, data: Record<string, unknown>): Promise<Course> {
  const res = await api.patch(`/courses/${courseId}`, data);
  return unwrap<Course>(res);
}

export async function publishCourse(courseId: string): Promise<void> {
  await api.post(`/courses/${courseId}/publish`);
}

export async function archiveCourse(courseId: string): Promise<void> {
  await api.post(`/courses/${courseId}/archive`);
}

export async function createModule(courseId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.post(`/courses/${courseId}/modules`, data);
  return unwrap<any>(res);
}

export async function updateModule(moduleId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.put(`/courses/modules/${moduleId}`, data);
  return unwrap<any>(res);
}

export async function deleteModule(moduleId: string): Promise<void> {
  await api.delete(`/courses/modules/${moduleId}`);
}

export async function createLesson(moduleId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.post(`/courses/modules/${moduleId}/lessons`, data);
  return unwrap<any>(res);
}

export async function updateLesson(lessonId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.put(`/courses/lessons/${lessonId}`, data);
  return unwrap<any>(res);
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await api.delete(`/courses/lessons/${lessonId}`);
}

export async function adminUpdateCourseStatus(courseId: string, status: string): Promise<void> {
  await api.patch(`/courses/${courseId}/status`, { status });
}

/* ── Instructor Curriculum Builder APIs ── */
export async function getCourseBuilderData(courseId: string): Promise<any> {
  const res = await api.get(`/instructor/courses/${courseId}/builder`);
  return unwrap<any>(res);
}

export async function createInstructorModule(courseId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.post(`/instructor/courses/${courseId}/modules`, data);
  return unwrap<any>(res);
}

export async function updateInstructorModule(moduleId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.patch(`/instructor/modules/${moduleId}`, data);
  return unwrap<any>(res);
}

export async function deleteInstructorModule(moduleId: string): Promise<void> {
  await api.delete(`/instructor/modules/${moduleId}`);
}

export async function createInstructorLesson(moduleId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.post(`/instructor/modules/${moduleId}/lessons`, data);
  return unwrap<any>(res);
}

export async function updateInstructorLesson(lessonId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.patch(`/instructor/lessons/${lessonId}`, data);
  return unwrap<any>(res);
}

export async function deleteInstructorLesson(lessonId: string): Promise<void> {
  await api.delete(`/instructor/lessons/${lessonId}`);
}

export async function createInstructorResource(moduleId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.post(`/instructor/modules/${moduleId}/resources`, data);
  return unwrap<any>(res);
}

export async function updateInstructorResource(resourceId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.patch(`/instructor/resources/${resourceId}`, data);
  return unwrap<any>(res);
}

export async function deleteInstructorResource(resourceId: string): Promise<void> {
  await api.delete(`/instructor/resources/${resourceId}`);
}

export async function checkCoursePublish(courseId: string): Promise<any> {
  const res = await api.post(`/instructor/courses/${courseId}/publish-check`);
  return unwrap<any>(res);
}

export async function publishInstructorCourse(courseId: string): Promise<void> {
  await api.patch(`/instructor/courses/${courseId}/publish`);
}

export async function uploadInstructorFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/instructor/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return unwrap<{ url: string }>(res).url;
}

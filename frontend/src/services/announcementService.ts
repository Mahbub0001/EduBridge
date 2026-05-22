/* eslint-disable @typescript-eslint/no-explicit-any */
import api, { unwrap } from './api';

export async function getInstructorAnnouncements(): Promise<any[]> {
  const res = await api.get('/instructor/announcements');
  return unwrap<any[]>(res);
}

export async function createInstructorAnnouncement(data: Record<string, unknown>): Promise<any> {
  const res = await api.post('/instructor/announcements', data);
  return unwrap<any>(res);
}

export async function updateInstructorAnnouncement(announcementId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.patch(`/instructor/announcements/${announcementId}`, data);
  return unwrap<any>(res);
}

export async function deleteInstructorAnnouncement(announcementId: string): Promise<void> {
  await api.delete(`/instructor/announcements/${announcementId}`);
}

export async function publishInstructorAnnouncement(announcementId: string, status: string): Promise<void> {
  await api.patch(`/instructor/announcements/${announcementId}/publish`, { status });
}

export async function getStudentCourseAnnouncements(courseId: string): Promise<any[]> {
  const res = await api.get(`/announcements/course/${courseId}`);
  return unwrap<any[]>(res);
}


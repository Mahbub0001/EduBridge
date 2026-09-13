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

export interface StudentAnnouncementsPayload {
  announcements: any[];
  unread_count: number;
  enrolled_courses: Array<{ id: string; title: string }>;
}

export async function getStudentAnnouncements(params?: {
  courseId?: string;
  moduleId?: string;
  unreadOnly?: boolean;
}): Promise<StudentAnnouncementsPayload> {
  const res = await api.get('/announcements/student', {
    params: {
      course_id: params?.courseId || undefined,
      module_id: params?.moduleId || undefined,
      unread_only: params?.unreadOnly ? true : undefined,
    },
  });
  return unwrap<StudentAnnouncementsPayload>(res);
}

export async function getStudentUnreadAnnouncementCount(): Promise<number> {
  const res = await api.get('/announcements/student/unread-count');
  const data = unwrap<{ unread_count: number }>(res);
  return data?.unread_count ?? 0;
}

export async function markAnnouncementAsRead(announcementId: string): Promise<void> {
  await api.post(`/announcements/${announcementId}/read`);
}

export async function markAllAnnouncementsAsRead(): Promise<void> {
  await api.post('/announcements/student/read-all');
}



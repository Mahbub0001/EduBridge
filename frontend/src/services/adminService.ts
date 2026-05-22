/* eslint-disable @typescript-eslint/no-explicit-any */
import api, { unwrap } from './api';
import type { User } from '../types';

export async function getAllUsers(params?: {
  skip?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<User[]> {
  const res = await api.get('/users/', { params });
  return unwrap<User[]>(res);
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  await api.patch(`/users/${userId}/role`, { role });
}

export async function updateUserStatus(userId: string, status: string): Promise<void> {
  await api.patch(`/users/${userId}/status`, { status });
}

export async function getInstructorAnalytics(): Promise<any> {
  const res = await api.get('/analytics/instructor');
  return unwrap<any>(res);
}

export async function getAdminAnalytics(): Promise<any> {
  const res = await api.get('/analytics/admin');
  return unwrap<any>(res);
}

export async function getCourseAnalytics(courseId: string): Promise<any> {
  const res = await api.get(`/analytics/courses/${courseId}`);
  return unwrap<any>(res);
}

export async function getCourseDiscussions(courseId: string): Promise<any[]> {
  const res = await api.get(`/discussions/courses/${courseId}`);
  return unwrap<any[]>(res);
}

export async function createDiscussion(courseId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.post(`/discussions/courses/${courseId}`, data);
  return unwrap<any>(res);
}

export async function createReply(threadId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.post(`/discussions/${threadId}/replies`, data);
  return unwrap<any>(res);
}

export async function togglePinThread(threadId: string): Promise<void> {
  await api.patch(`/discussions/${threadId}/pin`);
}

export async function deleteDiscussion(threadId: string): Promise<void> {
  await api.delete(`/discussions/${threadId}`);
}

export async function getAnnouncements(): Promise<any[]> {
  const res = await api.get('/announcements/');
  return unwrap<any[]>(res);
}

export async function createAnnouncement(data: Record<string, unknown>): Promise<any> {
  const res = await api.post('/announcements/', data);
  return unwrap<any>(res);
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  await api.delete(`/announcements/${announcementId}`);
}

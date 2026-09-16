/* eslint-disable @typescript-eslint/no-explicit-any */
import api, { unwrap } from './api';
import type { User } from '../types';

// -------------------------------------------------------------
// User Management
// -------------------------------------------------------------
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

export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
  title?: string;
  phone_number?: string;
}): Promise<any> {
  const res = await api.post('/admin/users', data);
  return unwrap<any>(res);
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  await api.patch(`/users/${userId}/role`, { role });
}

export async function updateUserStatus(userId: string, status: string): Promise<void> {
  await api.patch(`/users/${userId}/status`, { status });
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  await api.post(`/admin/users/${userId}/reset-password`, { new_password: newPassword });
}

export async function getUserDetails(userId: string): Promise<any> {
  const res = await api.get(`/admin/users/${userId}/details`);
  return unwrap<any>(res);
}

// -------------------------------------------------------------
// Executive Analytics & Reports
// -------------------------------------------------------------
export async function getAdminDashboardStats(): Promise<any> {
  const res = await api.get('/admin/dashboard-stats');
  return unwrap<any>(res);
}

export async function getAdminDetailedAnalytics(): Promise<any> {
  const res = await api.get('/admin/analytics-detailed');
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

// -------------------------------------------------------------
// Enrollment Management
// -------------------------------------------------------------
export async function getAdminEnrollments(params?: {
  search?: string;
  course_id?: string;
  status?: string;
}): Promise<any[]> {
  const res = await api.get('/admin/enrollments', { params });
  return unwrap<any[]>(res);
}

export async function createAdminEnrollment(data: { user_id: string; course_id: string }): Promise<any> {
  const res = await api.post('/admin/enrollments', data);
  return unwrap<any>(res);
}

export async function updateAdminEnrollment(
  enrollmentId: string,
  data: { status?: string; progress_percent?: number }
): Promise<void> {
  await api.patch(`/admin/enrollments/${enrollmentId}`, data);
}

export async function deleteAdminEnrollment(enrollmentId: string): Promise<void> {
  await api.delete(`/admin/enrollments/${enrollmentId}`);
}

// -------------------------------------------------------------
// Certificate Management
// -------------------------------------------------------------
export async function getAdminCertificates(params?: { search?: string }): Promise<any[]> {
  const res = await api.get('/admin/certificates', { params });
  return unwrap<any[]>(res);
}

export async function revokeAdminCertificate(certificateId: string): Promise<void> {
  await api.delete(`/admin/certificates/${certificateId}`);
}

// -------------------------------------------------------------
// Course Management (Admin Actions)
// -------------------------------------------------------------
export async function deleteAdminCourse(courseId: string): Promise<void> {
  await api.delete(`/admin/courses/${courseId}`);
}

// -------------------------------------------------------------
// Platform Settings
// -------------------------------------------------------------
export async function getPlatformSettings(): Promise<any> {
  const res = await api.get('/admin/settings');
  return unwrap<any>(res);
}

export async function updatePlatformSettings(data: Record<string, any>): Promise<any> {
  const res = await api.put('/admin/settings', data);
  return unwrap<any>(res);
}

// -------------------------------------------------------------
// Announcements & Discussions
// -------------------------------------------------------------
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

export async function getCourseDiscussions(courseId: string): Promise<any[]> {
  const res = await api.get(`/discussions/courses/${courseId}`);
  return unwrap<any[]>(res);
}

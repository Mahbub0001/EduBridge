/* eslint-disable @typescript-eslint/no-explicit-any */
import api, { unwrap } from './api';
import type { Assignment } from '../types';

/* ── STUDENT facing APIs ── */
export async function getAssignment(assignmentId: string): Promise<Assignment> {
  const res = await api.get(`/assignments/${assignmentId}`);
  return unwrap<Assignment>(res);
}

export async function getMySubmission(assignmentId: string): Promise<any> {
  const res = await api.get(`/assignments/${assignmentId}/submission`);
  return unwrap<any>(res);
}

export async function getAllAssignments(): Promise<Assignment[]> {
  const { getMyCourses } = await import('./courseService');
  const courses = await getMyCourses();
  const all: Assignment[] = [];
  for (const c of courses) {
    const res = await api.get(`/courses/${c.id}/assignments`);
    const items = unwrap<Assignment[]>(res);
    for (const a of items) {
      const sub = await getMySubmission(a.id).catch(() => null);
      if (sub) {
        a.status = sub.status === 'graded' ? 'graded' : 'submitted';
        a.grade = sub.grade ? `${sub.score || sub.grade}` : undefined;
      }
      a.course_name = c.title;
      all.push(a);
    }
  }
  return all;
}

export async function submitAssignment(assignmentId: string, payload: FormData | Record<string, unknown>): Promise<void> {
  await api.post(`/assignments/${assignmentId}/submit`, payload);
}


/* ── PREMIUM INSTRUCTOR ASSIGNMENT APIs ── */
export async function getCourseAssignments(courseId: string): Promise<any[]> {
  const res = await api.get(`/instructor/courses/${courseId}/assignments`);
  return unwrap<any[]>(res);
}

export async function createAssignment(courseId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.post(`/instructor/courses/${courseId}/assignments`, data);
  return unwrap<any>(res);
}

export async function updateAssignment(assignmentId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.patch(`/instructor/assignments/${assignmentId}`, data);
  return unwrap<any>(res);
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  await api.delete(`/instructor/assignments/${assignmentId}`);
}

export async function getAssignmentSubmissions(assignmentId: string): Promise<any[]> {
  const res = await api.get(`/instructor/assignments/${assignmentId}/submissions`);
  return unwrap<any[]>(res);
}

export async function gradeSubmission(submissionId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.patch(`/instructor/submissions/${submissionId}/grade`, data);
  return unwrap<any>(res);
}

export async function publishAssignment(assignmentId: string, status: string): Promise<void> {
  await api.patch(`/instructor/assignments/${assignmentId}/publish`, { status });
}

export async function getInstructorAllSubmissions(): Promise<any[]> {
  const res = await api.get('/instructor/submissions');
  return unwrap<any[]>(res);
}

export async function getInstructorSingleSubmission(submissionId: string): Promise<any> {
  const res = await api.get(`/instructor/submissions/${submissionId}`);
  return unwrap<any>(res);
}

export async function returnSubmission(submissionId: string, feedback: string): Promise<any> {
  const res = await api.patch(`/instructor/submissions/${submissionId}/return`, { feedback });
  return unwrap<any>(res);
}


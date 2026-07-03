/* eslint-disable @typescript-eslint/no-explicit-any */
import api, { unwrap } from './api';

export async function getInstructorDiscussions(): Promise<any[]> {
  const res = await api.get('/instructor/discussions');
  return unwrap<any[]>(res);
}

export async function getInstructorDiscussionDetail(discussionId: string): Promise<any> {
  const res = await api.get(`/instructor/discussions/${discussionId}`);
  return unwrap<any>(res);
}

export async function replyToDiscussionAsInstructor(discussionId: string, content: string): Promise<any> {
  const res = await api.post(`/instructor/discussions/${discussionId}/reply`, { content });
  return unwrap<any>(res);
}

export async function pinDiscussionThread(discussionId: string): Promise<void> {
  await api.patch(`/instructor/discussions/${discussionId}/pin`);
}

export async function hideDiscussionThread(discussionId: string): Promise<void> {
  await api.patch(`/instructor/discussions/${discussionId}/hide`);
}

export async function deleteDiscussionThread(discussionId: string): Promise<void> {
  await api.delete(`/instructor/discussions/${discussionId}`);
}

export async function toggleDiscussionAnswered(discussionId: string): Promise<void> {
  await api.patch(`/instructor/discussions/${discussionId}/answered`);
}

export async function getModuleDiscussion(moduleId: string): Promise<any> {
  const res = await api.get(`/discussions/modules/${moduleId}`);
  return unwrap<any>(res);
}

export async function postModuleComment(moduleId: string, content: string): Promise<any> {
  const res = await api.post(`/discussions/modules/${moduleId}/comments`, { content });
  return unwrap<any>(res);
}

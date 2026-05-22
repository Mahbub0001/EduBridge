import api, { unwrap } from './api';
import type { Resource } from '../types';

export async function getResources(): Promise<Resource[]> {
  const res = await api.get('/resources');
  return unwrap<Resource[]>(res);
}

export async function getCourseResources(courseId: string): Promise<Resource[]> {
  const res = await api.get(`/courses/${courseId}/resources`);
  return unwrap<Resource[]>(res);
}

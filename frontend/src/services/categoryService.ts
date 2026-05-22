import api, { unwrap } from './api';

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export async function getCategories(): Promise<Category[]> {
  const res = await api.get('/categories/');
  return unwrap<Category[]>(res);
}

export async function createCategory(data: Record<string, unknown>): Promise<Category> {
  const res = await api.post('/categories/', data);
  return unwrap<Category>(res);
}

export async function updateCategory(categoryId: string, data: Record<string, unknown>): Promise<Category> {
  const res = await api.put(`/categories/${categoryId}`, data);
  return unwrap<Category>(res);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await api.delete(`/categories/${categoryId}`);
}

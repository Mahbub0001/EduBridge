import api, { unwrap } from './api';
import type { Notification } from '../types';

export async function getNotifications(): Promise<Notification[]> {
  const res = await api.get('/notifications/');
  return unwrap<Notification[]>(res);
}

export async function markAsRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`);
}

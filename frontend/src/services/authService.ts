import api, { unwrap } from './api';
import type { User } from '../types';

let activeSessionPromise: Promise<User> | null = null;

export async function establishSession(): Promise<User> {
  if (activeSessionPromise) {
    return activeSessionPromise;
  }

  activeSessionPromise = (async () => {
    try {
      const res = await api.post('/auth/session');
      return unwrap<User>(res);
    } finally {
      activeSessionPromise = null;
    }
  })();

  return activeSessionPromise;
}

export async function getMe(): Promise<User> {
  const res = await api.get('/auth/me');
  return unwrap<User>(res);
}

export async function updateProfile(data: Partial<User>): Promise<User> {
  const res = await api.put('/users/me', data);
  return unwrap<User>(res);
}

export async function mockLogin(role: 'student' | 'instructor' | 'admin'): Promise<User> {
  const uid = `${role}-demo-uid`;
  localStorage.setItem('mock_bearer_token', `mock-token-${uid}`);
  try {
    const user = await establishSession();
    return user;
  } catch (err) {
    localStorage.removeItem('mock_bearer_token');
    throw err;
  }
}

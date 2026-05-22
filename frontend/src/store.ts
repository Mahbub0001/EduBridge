import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from './types';

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'es';

export type AuthUser = User & { uid: string };

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

interface PreferencesState {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'edubridge-auth' }
  )
);

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleTheme: () =>
        set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    { name: 'edubridge-preferences' }
  )
);

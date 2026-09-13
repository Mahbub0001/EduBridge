import axios, { type InternalAxiosRequestConfig, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface CacheEntry {
  data: any;
  etag?: string;
  timestamp: number;
}

const clientCache = new Map<string, CacheEntry>();
const CLIENT_CACHE_FRESH_TTL_MS = 300000; // 5 minutes fresh instant return
const CLIENT_CACHE_STALE_TTL_MS = 1800000; // 30 minutes stale-while-revalidate window

// Endpoints that use POST/PUT but do not mutate platform data or require global cache purges
const EXEMPT_MUTATION_PATTERNS = [
  '/auth/session',
  '/auth/login',
  '/auth/register',
  '/announcements/',
  '/read',
  '/read-all',
  '/publish-check',
  '/reminder',
  '/notes',
];

export function invalidateClientCache(pattern?: string) {
  if (!pattern) {
    clientCache.clear();
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('edubridge:')) {
          sessionStorage.removeItem(k);
        }
      }
    } catch {}
    return;
  }

  // Selective pattern invalidation in memory
  for (const key of clientCache.keys()) {
    if (key.includes(pattern)) {
      clientCache.delete(key);
    }
  }

  // Selective pattern invalidation in sessionStorage
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('edubridge:') && k.includes(pattern)) {
        sessionStorage.removeItem(k);
      }
    }
  } catch {}
}

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const mockToken = localStorage.getItem('mock_bearer_token');
    if (mockToken) {
      config.headers.Authorization = `Bearer ${mockToken}`;
    } else {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase() || 'get';
    const url = response.config.url || '';

    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      // Check if this is an exempt read-like or session call
      const isExempt = EXEMPT_MUTATION_PATTERNS.some((pat) => url.includes(pat));
      if (!isExempt) {
        // Selective invalidation by domain
        if (url.includes('/quizzes')) {
          invalidateClientCache('/quizzes');
          invalidateClientCache('/instructor');
          invalidateClientCache('/analytics');
        } else if (url.includes('/assignments')) {
          invalidateClientCache('/assignments');
          invalidateClientCache('/instructor');
          invalidateClientCache('/analytics');
        } else if (url.includes('/courses')) {
          invalidateClientCache('/courses');
          invalidateClientCache('/instructor');
          invalidateClientCache('/analytics');
        } else if (url.includes('/enroll')) {
          invalidateClientCache('/enroll');
          invalidateClientCache('/courses');
          invalidateClientCache('/instructor');
          invalidateClientCache('/analytics');
          invalidateClientCache('/calendar');
        } else if (url.includes('/progress')) {
          invalidateClientCache('/progress');
          invalidateClientCache('/instructor');
          invalidateClientCache('/analytics');
        } else {
          // General write mutation
          invalidateClientCache();
        }
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as any;

    const mockToken = localStorage.getItem('mock_bearer_token');
    if (mockToken && error.response?.status === 401) {
      localStorage.removeItem('mock_bearer_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && auth.currentUser) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const token = await auth.currentUser.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (retryError) {
          console.error("Token refresh retry failed:", retryError);
          await auth.signOut();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(retryError);
        }
      } else {
        console.warn("API request failed with 401 twice. Logging out.");
        await auth.signOut();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// High-speed SWR (Stale-While-Revalidate) Instant-Cache Adapter for api.get
const rawGet = api.get.bind(api);

api.get = (async <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R> => {
  const fullUrl = `${api.defaults.baseURL || ''}${url}`;
  const cacheKey = `edubridge:${fullUrl}?${JSON.stringify(config?.params || {})}`;
  const forceRefresh = config?.headers?.['x-force-refresh'] === 'true' || (config as any)?.forceRefresh === true;

  if (!forceRefresh) {
    // 1. Check in-memory cache
    let cached = clientCache.get(cacheKey);

    // 2. Check sessionStorage if memory is empty
    if (!cached) {
      try {
        const stored = sessionStorage.getItem(cacheKey);
        if (stored) {
          cached = JSON.parse(stored);
          if (cached) clientCache.set(cacheKey, cached);
        }
      } catch {}
    }

    if (cached) {
      const age = Date.now() - cached.timestamp;

      // Fresh cache hit: instant 0ms return
      if (age < CLIENT_CACHE_FRESH_TTL_MS) {
        return Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK (Instant Fresh Cache)',
          headers: { 'x-cache': 'HIT-INSTANT' },
          config: (config || {}) as any,
        } as unknown as R);
      }

      // Stale cache hit (SWR): return cached immediately to avoid spinners, revalidate silently
      if (age < CLIENT_CACHE_STALE_TTL_MS) {
        setTimeout(() => {
          rawGet(url, {
            ...config,
            headers: {
              ...(config?.headers || {}),
              'If-None-Match': cached?.etag || '',
            },
          })
            .then((freshRes: any) => {
              if (freshRes?.data) {
                const entry = {
                  data: freshRes.data,
                  etag: freshRes.headers?.etag || cached?.etag,
                  timestamp: Date.now(),
                };
                clientCache.set(cacheKey, entry);
                try {
                  sessionStorage.setItem(cacheKey, JSON.stringify(entry));
                } catch {}
              }
            })
            .catch(() => {});
        }, 0);

        return Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK (Instant Stale Cache)',
          headers: { 'x-cache': 'HIT-STALE' },
          config: (config || {}) as any,
        } as unknown as R);
      }
    }
  }

  // 3. If not cached or forced refresh, fetch over the wire and populate cache
  const response = await rawGet<T, R, D>(url, config);
  const etag = (response as any).headers?.['etag'];
  const entry: CacheEntry = {
    data: (response as any).data,
    etag,
    timestamp: Date.now(),
  };
  clientCache.set(cacheKey, entry);
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {}
  return response;
}) as any;

export function unwrap<T>(response: { data: { success?: boolean; data: T } }): T {
  return response.data.data;
}

export default api;

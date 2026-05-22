import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, AlertCircle, X } from 'lucide-react';
import { auth, googleProvider } from '../../services/firebase';
import { establishSession } from '../../services/authService';
import { useAuthStore } from '../../store';
import { navigateByRole } from '../../utils/navigateByRole';
import AuthBranding from '../../components/auth/AuthBranding';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';

type Role = 'student' | 'instructor';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const completeLogin = async () => {
    const user = await establishSession();
    setUser({
      uid: user.uid || user.id || '',
      email: user.email,
      name: user.name,
      role: user.role,
    });
    if (remember) {
      localStorage.setItem('edubridge-remember', 'true');
    }
    navigateByRole(user.role, navigate);
  };

  // Handle capturing Google redirect sign-in results on mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          await completeLogin();
        }
      } catch (err: any) {
        console.error('Redirect sign-in failed:', err);
        setError(err instanceof Error ? err.message : 'Google redirect sign-in failed');
      } finally {
        setLoading(false);
      }
    };
    handleRedirectResult();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      await completeLogin();
    } catch (err: any) {
      console.warn('Google popup blocked or failed. Falling back to redirect...', err);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr: any) {
        console.error('Google redirect fallback failed:', redirectErr);
        setError(redirectErr instanceof Error ? redirectErr.message : 'Google sign-in failed');
        setLoading(false);
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await completeLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AuthBranding />

      <div className="flex w-full flex-col justify-center bg-white px-6 py-12 dark:bg-slate-900 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-start justify-between lg:hidden">
            <div className="flex items-center gap-2 text-navy-900 dark:text-white">
              <GraduationCap size={28} />
              <span className="text-xl font-bold">EduBridge</span>
            </div>
          </div>

          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Please enter your details to access your dashboard.
              </p>
            </div>
            <p className="hidden text-sm text-slate-500 sm:block">
              New here?{' '}
              <Link to="/register" className="font-semibold text-navy-900 hover:underline dark:text-teal-400">
                Create account
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="shrink-0 text-red-400 hover:text-red-600">
                <X size={16} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt=""
                className="h-5 w-5"
              />
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="my-8 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-medium tracking-wider text-slate-400">
              OR CONTINUE WITH EMAIL
            </span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="rounded-xl bg-[#F0F4F8] p-4 dark:bg-slate-800">
              <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                I am joining as a:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-semibold transition',
                    role === 'student'
                      ? 'border-navy-900 bg-blue-50 text-navy-900 dark:bg-navy-950/50'
                      : 'border-slate-200 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900'
                  )}
                >
                  <GraduationCap size={22} />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('instructor')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-semibold transition',
                    role === 'instructor'
                      ? 'border-navy-900 bg-blue-50 text-navy-900 dark:bg-navy-950/50'
                      : 'border-slate-200 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900'
                  )}
                >
                  <User size={22} />
                  Instructor
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 dark:border-slate-600 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-navy-900 hover:underline dark:text-teal-400"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-12 text-sm outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 dark:border-slate-600 dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-500">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-300"
              />
              Remember me for 30 days
            </label>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Login to Dashboard'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 sm:hidden">
            New here?{' '}
            <Link to="/register" className="font-semibold text-navy-900 dark:text-teal-400">
              Create account
            </Link>
          </p>

          <p className="mt-8 text-center text-sm text-slate-500">
            Having trouble signing in?{' '}
            <a href="mailto:support@edubridge.edu" className="font-semibold text-teal-600">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

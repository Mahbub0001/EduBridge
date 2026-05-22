import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { GraduationCap, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { auth, googleProvider } from '../../services/firebase';
import { establishSession } from '../../services/authService';
import { useAuthStore } from '../../store';
import { navigateByRole } from '../../utils/navigateByRole';
import AuthBranding from '../../components/auth/AuthBranding';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';

type Role = 'student' | 'instructor';

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [role, setRole] = useState<Role>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const completeRegister = async () => {
    const user = await establishSession();
    setUser({
      uid: user.uid || user.id || '',
      email: user.email,
      name: user.name,
      role: user.role,
    });
    navigateByRole(user.role, navigate);
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      await completeRegister();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await completeRegister();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AuthBranding
        headline="Start your journey with EduBridge today."
        subheadline="Create your account and unlock structured learning paths, expert mentors, and certifications."
      />

      <div className="flex w-full flex-col justify-center bg-white px-6 py-12 dark:bg-slate-900 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 text-navy-900 lg:hidden dark:text-white">
            <GraduationCap size={28} />
            <span className="text-xl font-bold">EduBridge</span>
          </div>

          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Create account
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Join thousands of learners on EduBridge.
              </p>
            </div>
            <p className="hidden text-sm text-slate-500 sm:block">
              Have an account?{' '}
              <Link to="/login" className="font-semibold text-navy-900 hover:underline dark:text-teal-400">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt=""
              className="h-5 w-5"
            />
            Continue with Google
          </button>

          <div className="my-8 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-medium tracking-wider text-slate-400">
              OR REGISTER WITH EMAIL
            </span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Alex Johnson"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 dark:border-slate-600 dark:bg-slate-800"
              />
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
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
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
                  minLength={6}
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

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 sm:hidden">
            Have an account?{' '}
            <Link to="/login" className="font-semibold text-navy-900 dark:text-teal-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

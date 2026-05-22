import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { GraduationCap, Mail, ArrowLeft } from 'lucide-react';
import { auth } from '../../services/firebase';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-2 text-navy-900 dark:text-white">
          <GraduationCap size={28} />
          <span className="text-xl font-bold">EduBridge</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email and we will send you a reset link.
        </p>

        {sent ? (
          <div className="mt-6 rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-800 dark:bg-teal-950/30 dark:text-teal-300">
            Check your inbox for a password reset link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30">
                {error}
              </div>
            )}
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
                  required
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 dark:border-slate-600 dark:bg-slate-800"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-navy-900 hover:underline dark:text-teal-400"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </div>
    </div>
  );
}

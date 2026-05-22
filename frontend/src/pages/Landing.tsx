import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  ArrowRight,
  CheckCircle2,
  Play,
} from 'lucide-react';
import Button from '../components/ui/Button';

const features = [
  {
    icon: BookOpen,
    title: '450+ Expert Courses',
    description:
      'Structured learning paths across engineering, data science, design, and business.',
  },
  {
    icon: Users,
    title: 'World-Class Mentors',
    description:
      'Learn from industry professionals with real-world experience and personalized feedback.',
  },
  {
    icon: Award,
    title: 'Recognized Certificates',
    description:
      'Earn credentials that showcase your skills to employers and academic institutions.',
  },
];

const stats = [
  { value: '2M+', label: 'Active Learners' },
  { value: '450+', label: 'Courses' },
  { value: '98%', label: 'Success Rate' },
  { value: '120+', label: 'Partner Universities' },
];

export default function Landing() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 top-20 h-96 w-96 rounded-full bg-teal-500 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:py-32">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm">
              <GraduationCap size={18} />
              <span>Trusted by 2M+ learners worldwide</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Elevate your learning journey with{' '}
              <span className="text-teal-400">EduBridge</span>
            </h1>
            <p className="max-w-xl text-lg text-white/80">
              A professional MOOC platform with structured paths, live workshops, and
              industry-recognized certifications — built for students and instructors.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                  Get Started Free
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                >
                  <Play size={18} />
                  Watch Demo
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-8 pt-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-white/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-white/10 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <p className="font-semibold">Advanced Web Architecture</p>
                    <p className="text-sm text-white/60">89% complete</p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[89%] rounded-full bg-teal-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4 text-center">
                    <p className="text-2xl font-bold text-teal-400">12</p>
                    <p className="text-xs text-white/60">Enrolled</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 text-center">
                    <p className="text-2xl font-bold text-teal-400">08</p>
                    <p className="text-xs text-white/60">Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600">
              Why EduBridge
            </p>
            <h2 className="mt-3 text-3xl font-bold text-navy-900 dark:text-white sm:text-4xl">
              Everything you need to succeed
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-500">
              From enrollment to certification, EduBridge provides a complete learning
              ecosystem for modern education.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-8 transition hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-navy-900 text-white">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 dark:text-white">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-slate-500">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F0F4F8] py-24 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-navy-900 dark:text-white sm:text-4xl">
            Ready to start learning?
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Join millions of students and instructors on the platform built for academic
            excellence.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg">Create Free Account</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            {['No credit card required', 'Free student plan', 'Cancel anytime'].map(
              (item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-teal-600" />
                  {item}
                </li>
              )
            )}
          </ul>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-navy-950 py-12 text-white dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap size={24} className="text-teal-400" />
            <span className="text-lg font-bold">EduBridge</span>
          </div>
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} EduBridge. Academic excellence, delivered online.
          </p>
          <div className="flex gap-6 text-sm text-white/60">
            <Link to="/login" className="hover:text-white">
              Login
            </Link>
            <Link to="/register" className="hover:text-white">
              Register
            </Link>
            <a href="mailto:support@edubridge.edu" className="hover:text-white">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}


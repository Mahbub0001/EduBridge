/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HelpCircle, CheckCircle2, XCircle, Clock, Award,
  ChevronLeft, ChevronRight, RotateCcw, Lock,
} from 'lucide-react';
import {
  getQuizQuestions, getMyAttempts, submitQuiz, getModuleUnlockStatus, type ModuleUnlockStatus,
} from '../../services/quizService';
import { getCourseModules } from '../../services/courseService';
import api, { unwrap } from '../../services/api';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

async function getCourseQuizzesList(courseId: string): Promise<any[]> {
  const res = await api.get(`/courses/${courseId}/quizzes`);
  return unwrap<any[]>(res);
}

type View = 'list' | 'taking' | 'result';

export default function CourseQuizzes() {
  const { courseId } = useParams<{ courseId: string }>();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [moduleStatus, setModuleStatus] = useState<ModuleUnlockStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [attempts, setAttempts] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      getCourseQuizzesList(courseId),
      getCourseModules(courseId),
      getModuleUnlockStatus(courseId).catch(() => []),
    ]).then(([q, m, ms]) => {
      setQuizzes(q.filter((quiz: any) => quiz.status === 'published'));
      setModules(m);
      setModuleStatus(ms);
      q.forEach((quiz: any) => {
        if (quiz.id) {
          getMyAttempts(quiz.id)
            .then((a) => setAttempts((prev) => ({ ...prev, [quiz.id]: a })))
            .catch(() => {});
        }
      });
    }).finally(() => setLoading(false));
  }, [courseId]);

  const refreshModuleStatus = () => {
    if (courseId) {
      getModuleUnlockStatus(courseId).then(setModuleStatus).catch(() => {});
    }
  };

  const getModStatus = (moduleId: string) => moduleStatus.find((s) => s.module_id === moduleId);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    quizzes.forEach((q) => {
      const mid = q.module_id || '__general__';
      if (!map[mid]) map[mid] = [];
      map[mid].push(q);
    });
    return map;
  }, [quizzes]);

  const moduleTitle = (id: string) => {
    if (id === '__general__') return 'General / Course-wide';
    return modules.find((m) => m.id === id)?.title || id;
  };

  const startQuiz = async (quiz: any) => {
    setActiveQuiz(quiz);
    setAnswers({});
    setCurrentQ(0);
    setResult(null);
    const qs = await getQuizQuestions(quiz.id);
    setQuestions(qs);
    setView('taking');
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const res = await submitQuiz(activeQuiz.id, answers);
      setResult(res);
      setView('result');
      if (res.passed) refreshModuleStatus();
      getMyAttempts(activeQuiz.id)
        .then((a) => setAttempts((prev) => ({ ...prev, [activeQuiz.id]: a })));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading quizzes...</div>;

  if (view === 'result' && result) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Breadcrumbs items={[
          { label: 'My Courses', href: '/student/my-courses' },
          { label: 'Quizzes', href: `/student/courses/${courseId}/quizzes` },
          { label: activeQuiz?.title || 'Quiz' },
        ]} />
        <Card className="text-center space-y-4 py-8">
          {result.passed
            ? <CheckCircle2 size={52} className="mx-auto text-emerald-500" />
            : <XCircle size={52} className="mx-auto text-rose-500" />}
          <div>
            <h1 className="text-2xl font-black text-navy-900 dark:text-white">
              {result.passed ? 'You Passed!' : 'Not Passed'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{activeQuiz?.title}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div><p className="text-2xl font-black text-navy-900 dark:text-white">{result.score}%</p><p className="text-[10px] text-slate-500 uppercase font-bold">Score</p></div>
            <div><p className="text-2xl font-black text-navy-900 dark:text-white">{result.correct_count}/{result.total_questions}</p><p className="text-[10px] text-slate-500 uppercase font-bold">Correct</p></div>
            <div><p className="text-2xl font-black text-navy-900 dark:text-white">{activeQuiz?.passing_score || 60}%</p><p className="text-[10px] text-slate-500 uppercase font-bold">Pass Mark</p></div>
          </div>
          {result.passed && <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Next module has been unlocked!</p>}
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" size="sm" onClick={() => { setView('list'); setActiveQuiz(null); }}>
              <ChevronLeft size={14} /> Back to Quizzes
            </Button>
            <Link to={`/student/courses/${courseId}/learn`}>
              <Button size="sm">Continue Learning</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (view === 'taking' && activeQuiz) {
    const q = questions[currentQ];
    const total = questions.length;
    const answered = Object.keys(answers).length;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Breadcrumbs items={[
          { label: 'My Courses', href: '/student/my-courses' },
          { label: 'Quizzes', href: `/student/courses/${courseId}/quizzes` },
          { label: activeQuiz.title },
        ]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-navy-900 dark:text-white">{activeQuiz.title}</h1>
            <p className="text-xs text-slate-500">Question {currentQ + 1} of {total}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500">{answered}/{total} answered</p>
            <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
              <div className="h-1.5 bg-teal-500 rounded-full transition-all" style={{ width: `${(answered / Math.max(total, 1)) * 100}%` }} />
            </div>
          </div>
        </div>
        {q && (
          <Card className="space-y-6">
            <p className="text-base font-bold text-navy-900 dark:text-white leading-relaxed">{q.question_text}</p>
            <div className="space-y-3">
              {(q.options || []).map((opt: string, i: number) => (
                <button key={i} type="button" onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    answers[q.id] === opt
                      ? 'border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-900/30 dark:text-teal-300'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" disabled={currentQ === 0} onClick={() => setCurrentQ(i => i - 1)}>
                <ChevronLeft size={14} /> Prev
              </Button>
              {currentQ < total - 1
                ? <Button size="sm" onClick={() => setCurrentQ(i => i + 1)}>Next <ChevronRight size={14} /></Button>
                : <Button size="sm" disabled={submitting || answered < total} onClick={handleSubmit}>
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                  </Button>
              }
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'My Courses', href: '/student/my-courses' }, { label: 'Quizzes' }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy-900 dark:text-white">Course Quizzes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pass each module quiz to unlock the next module.</p>
        </div>
        <Link to={`/student/courses/${courseId}/learn`}>
          <Button variant="outline" size="sm"><ChevronLeft size={14} /> Back to Learning</Button>
        </Link>
      </div>
      {quizzes.length === 0 ? (
        <Card className="text-center py-16">
          <HelpCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 font-bold mt-4">No quizzes have been published yet.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([moduleId, moduleQuizzes]) => {
            const modStat = getModStatus(moduleId);
            const isLocked = modStat?.locked ?? false;
            return (
              <div key={moduleId} className="space-y-3">
                <div className="flex items-center gap-2">
                  {isLocked && <Lock size={14} className="text-amber-500" />}
                  <h2 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{moduleTitle(moduleId)}</h2>
                  {modStat?.passed && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={12} /> Passed</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {moduleQuizzes.map((quiz) => {
                    const quizAttempts = attempts[quiz.id] || [];
                    const bestAttempt = quizAttempts.reduce((best: any, a: any) => !best || a.score > best.score ? a : best, null);
                    const hasPassed = quizAttempts.some((a: any) => a.passed);
                    const attemptsLeft = (quiz.max_attempts || 3) - quizAttempts.length;
                    return (
                      <Card key={quiz.id} className={`space-y-4 ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="text-sm font-black text-navy-900 dark:text-white">{quiz.title}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2">{quiz.instructions || 'No instructions.'}</p>
                          </div>
                          <Badge variant={hasPassed ? 'success' : 'default'}>{hasPassed ? 'Passed' : bestAttempt ? 'Attempted' : 'Not started'}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-extrabold text-slate-500 uppercase">
                          <div className="flex items-center gap-1"><Award size={10} /> {quiz.passing_score || 60}% to pass</div>
                          <div className="flex items-center gap-1"><Clock size={10} /> {quiz.time_limit || 30} min</div>
                          <div className="flex items-center gap-1"><RotateCcw size={10} /> {attemptsLeft > 0 ? `${attemptsLeft} left` : 'No attempts left'}</div>
                        </div>
                        {bestAttempt && (
                          <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl ${bestAttempt.passed ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'}`}>
                            {bestAttempt.passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                            Best: {bestAttempt.score}% — {bestAttempt.correct_count}/{bestAttempt.total_questions} correct
                          </div>
                        )}
                        {!isLocked && <Button size="sm" className="w-full" disabled={attemptsLeft <= 0} onClick={() => startQuiz(quiz)}>{hasPassed ? 'Retake' : quizAttempts.length > 0 ? 'Try Again' : 'Start Quiz'}</Button>}
                        {isLocked && <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400 font-bold"><Lock size={12} /> Complete the previous module quiz to unlock</div>}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Plus, Edit2, Trash2, Search, Settings, HelpCircle, Eye,
  Award, CheckCircle2, Clock, ShieldAlert,
  ArrowLeft, Check, MessageSquare
} from 'lucide-react';
import { getMyInstructorCourses, getCourseModules } from '../../services/courseService';
import {
  getCourseQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  publishQuiz,
  previewQuiz
} from '../../services/quizService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface Tab {
  id: 'settings' | 'questions' | 'preview';
  label: string;
  icon: any;
}

const TABS: Tab[] = [
  { id: 'settings', label: 'Quiz Settings', icon: Settings },
  { id: 'questions', label: 'Question Builder', icon: HelpCircle },
  { id: 'preview', label: 'Live Preview', icon: Eye }
];

export default function InstructorQuizzes() {
  const [courses, setCourses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Selected course details
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Active quiz being edited (if null, list view is shown)
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'questions' | 'preview'>('settings');

  // Quiz Form fields
  const [quizForm, setQuizForm] = useState({
    title: '', instructions: '', module_id: '', passing_score: 60,
    total_marks: 100, time_limit: 30, max_attempts: 3,
    shuffle_questions: false, shuffle_options: false, show_correct_answers: true,
    available_from: '', available_until: '', status: 'draft'
  });

  // Question Form fields
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [questionForm, setQuestionForm] = useState({
    type: 'mcq', question_text: '',
    options: ['', '', '', ''], correct_answer: '',
    marks: 1, explanation: ''
  });

  // Preview state
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({});
  const [previewChecked, setPreviewChecked] = useState(false);

  // General controls
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'quiz' | 'question'; id: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Load instructor courses
  const loadCourses = async (selectFirst = true) => {
    setLoadingCourses(true);
    try {
      const data = await getMyInstructorCourses();
      setCourses(data);
      if (selectFirst && data.length > 0) {
        setSelectedCourseId(data[0].id);
      }
    } catch {
      showToast('Failed to load courses', 'error');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Load quizzes and modules of selected course
  const loadCourseData = async (courseId: string) => {
    setLoadingQuizzes(true);
    try {
      const qData = await getCourseQuizzes(courseId);
      setQuizzes(qData);
      
      const mData = await getCourseModules(courseId);
      setModules(mData);
    } catch {
      showToast('Failed to load course assessments', 'error');
    } finally {
      setLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseData(selectedCourseId);
      setActiveQuiz(null); // Return to list view
    }
  }, [selectedCourseId]);

  const selectCourse = (id: string) => {
    setSelectedCourseId(id);
  };

  // Quiz Editor launcher
  const openQuizEditor = (quiz: any = null) => {
    if (quiz) {
      setActiveQuiz(quiz);
      setQuizForm({
        title: quiz.title || '',
        instructions: quiz.instructions || '',
        module_id: quiz.module_id || '',
        passing_score: quiz.passing_score || 60,
        total_marks: quiz.total_marks || 100,
        time_limit: quiz.time_limit || 30,
        max_attempts: quiz.max_attempts || 3,
        shuffle_questions: quiz.shuffle_questions || false,
        shuffle_options: quiz.shuffle_options || false,
        show_correct_answers: quiz.show_correct_answers !== undefined ? quiz.show_correct_answers : true,
        available_from: quiz.available_from || '',
        available_until: quiz.available_until || '',
        status: quiz.status || 'draft'
      });
      setActiveTab('settings');
      loadPreview(quiz.id);
    } else {
      setActiveQuiz({ id: 'new' });
      setQuizForm({
        title: '', instructions: '', module_id: '', passing_score: 60,
        total_marks: 100, time_limit: 30, max_attempts: 3,
        shuffle_questions: false, shuffle_options: false, show_correct_answers: true,
        available_from: '', available_until: '', status: 'draft'
      });
      setActiveTab('settings');
      setPreviewData(null);
    }
  };

  // Save Quiz settings
  const handleSaveQuiz = async () => {
    if (!quizForm.title.trim() || !selectedCourseId) return;
    try {
      if (activeQuiz && activeQuiz.id !== 'new') {
        const res = await updateQuiz(activeQuiz.id, quizForm);
        showToast('Quiz settings saved successfully!');
        setActiveQuiz(res.data || { ...quizForm, id: activeQuiz.id });
      } else {
        const res = await createQuiz(selectedCourseId, quizForm);
        showToast('Quiz created! Now you can add questions.');
        setActiveQuiz(res.data);
      }
      loadCourseData(selectedCourseId);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to save quiz.', 'error');
    }
  };

  // Load Preview
  const loadPreview = async (quizId: string) => {
    try {
      const data = await previewQuiz(quizId);
      setPreviewData(data);
      setPreviewAnswers({});
      setPreviewChecked(false);
    } catch {
      setPreviewData(null);
    }
  };

  // Question CRUD
  const openQuestionModal = (ques: any = null) => {
    if (ques) {
      setEditingQuestion(ques);
      setQuestionForm({
        type: ques.type || 'mcq',
        question_text: ques.question_text || '',
        options: ques.options || ['', '', '', ''],
        correct_answer: ques.correct_answer || '',
        marks: ques.marks || 1,
        explanation: ques.explanation || ''
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        type: 'mcq', question_text: '',
        options: ['', '', '', ''], correct_answer: '',
        marks: 1, explanation: ''
      });
    }
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question_text.trim() || !activeQuiz) return;
    
    // Validations
    if (questionForm.type === 'mcq') {
      const validOpts = questionForm.options.filter(o => o.trim());
      if (validOpts.length < 2) {
        showToast('MCQ must have at least 2 options filled.', 'error');
        return;
      }
      if (!questionForm.correct_answer) {
        showToast('Please select the correct option.', 'error');
        return;
      }
    } else if (questionForm.type === 'true_false') {
      if (!questionForm.correct_answer) {
        showToast('Please select true or false.', 'error');
        return;
      }
    } else {
      if (!questionForm.correct_answer.trim()) {
        showToast('Please enter the expected answer.', 'error');
        return;
      }
    }

    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, questionForm);
        showToast('Question updated successfully!');
      } else {
        await createQuestion(activeQuiz.id, questionForm);
        showToast('Question added successfully!');
      }
      setShowQuestionModal(false);
      loadPreview(activeQuiz.id);
    } catch {
      showToast('Failed to save question.', 'error');
    }
  };

  // Publish / Unpublish quiz
  const handlePublishQuiz = async (quiz: any) => {
    const nextStatus = quiz.status === 'published' ? 'draft' : 'published';
    try {
      await publishQuiz(quiz.id, nextStatus);
      showToast(`Quiz successfully ${nextStatus === 'published' ? 'published' : 'unpublished'}!`);
      loadCourseData(selectedCourseId!);
      if (activeQuiz && activeQuiz.id === quiz.id) {
        setActiveQuiz({ ...activeQuiz, status: nextStatus });
        setQuizForm({ ...quizForm, status: nextStatus });
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update quiz status.', 'error');
    }
  };

  // Delete confirmations
  const triggerDelete = (type: 'quiz' | 'question', id: string) => {
    setDeleteConfirm({ type, id });
  };

  const handleDelete = async () => {
    if (!deleteConfirm || !selectedCourseId) return;
    try {
      if (deleteConfirm.type === 'quiz') {
        await deleteQuiz(deleteConfirm.id);
        showToast('Quiz deleted successfully');
        setActiveQuiz(null);
        loadCourseData(selectedCourseId);
      } else {
        await deleteQuestion(deleteConfirm.id);
        showToast('Question deleted successfully');
        loadPreview(activeQuiz.id);
      }
      setDeleteConfirm(null);
    } catch {
      showToast('Failed to delete item.', 'error');
    }
  };

  // MCQ option helper
  const handleOptionChange = (idx: number, val: string) => {
    const opts = [...questionForm.options];
    opts[idx] = val;
    setQuestionForm({ ...questionForm, options: opts });
  };

  // Filter courses
  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-2 flex items-center gap-2 ${
          toastType === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
        }`}>
          {toastType === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Editor Banner or Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4">
        {activeQuiz ? (
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveQuiz(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{activeQuiz.id === 'new' ? 'Create New Quiz' : `Edit: ${quizForm.title}`}</span>
                <Badge variant={quizForm.status === 'published' ? 'success' : 'default'} className="uppercase text-[9px] px-2 py-0.5">
                  {quizForm.status}
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Manage quiz settings, add questions, and preview visually.</p>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-black text-slate-900">Quiz Management</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Build challenging assessments to check student progress.</p>
          </div>
        )}

        {activeQuiz && activeQuiz.id !== 'new' && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePublishQuiz(activeQuiz)}
            >
              {quizForm.status === 'published' ? 'Unpublish Quiz' : 'Publish Quiz'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="!bg-slate-900"
              onClick={handleSaveQuiz}
            >
              <Check size={14} /> Save Quiz
            </Button>
          </div>
        )}
      </div>

      {!activeQuiz ? (
        /* ───────────────── LIST VIEW ───────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Courses Sidebar */}
          <Card className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto border border-slate-200">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">My Courses</h3>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-900 focus:bg-white transition-all font-semibold"
              />
            </div>

            {loadingCourses ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredCourses.map((c) => {
                  const active = c.id === selectedCourseId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectCourse(c.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 ${
                        active ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-black line-clamp-1">{c.title}</span>
                      <span className={`text-[9px] uppercase font-extrabold tracking-wider ${active ? 'text-slate-400' : 'text-slate-500'}`}>
                        {c.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Main Quiz list */}
          <div className="lg:col-span-3 space-y-4">
            {selectedCourseId ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    {courses.find(c => c.id === selectedCourseId)?.title} Quizzes
                  </h3>
                  <Button variant="primary" size="sm" className="!bg-slate-900" onClick={() => openQuizEditor()}>
                    <Plus size={16} /> Add Quiz
                  </Button>
                </div>

                {loadingQuizzes ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : quizzes.length === 0 ? (
                  <Card className="text-center py-16 border-dashed border-2 border-slate-200">
                    <HelpCircle className="mx-auto text-slate-350" size={40} />
                    <p className="text-slate-500 font-bold mt-4">No quizzes yet. Add your first quiz to start testing student outcomes.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quizzes.map((q) => (
                      <Card key={q.id} className="border border-slate-200 hover:border-slate-350 transition-all flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                              {modules.find(m => m.id === q.module_id)?.title || 'General Assessment'}
                            </span>
                            <Badge variant={q.status === 'published' ? 'success' : 'default'} className="uppercase text-[8px] font-extrabold">
                              {q.status}
                            </Badge>
                          </div>
                          
                          <h4 className="text-sm font-black text-slate-900 line-clamp-1">{q.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2">{q.instructions || 'No instructions provided.'}</p>
                          
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                            <div className="flex flex-col">
                              <span className="text-slate-400">Questions</span>
                              <span className="text-slate-800 text-xs font-black">{q.question_count || 0}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-slate-400">Time Limit</span>
                              <span className="text-slate-800 text-xs font-black">{q.time_limit || 0} min</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-slate-400">Passing Score</span>
                              <span className="text-slate-800 text-xs font-black">{q.passing_score || 60}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 justify-end">
                          <Button variant="ghost" size="sm" className="!p-2 text-slate-600" onClick={() => openQuizEditor(q)}>
                            <Edit2 size={13} /> <span className="text-[10px] font-extrabold ml-1">Edit / Build</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="!p-2 text-slate-600" onClick={() => handlePublishQuiz(q)}>
                            <Eye size={13} /> <span className="text-[10px] font-extrabold ml-1">{q.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="!p-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => triggerDelete('quiz', q.id)}>
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Card className="text-center py-16">
                <HelpCircle className="mx-auto text-slate-350" size={48} />
                <p className="text-slate-500 font-extrabold mt-4">Select a course to view and build assessments.</p>
              </Card>
            )}
          </div>

        </div>
      ) : (
        /* ───────────────── QUIZ BUILDER PANEL ───────────────── */
        <div className="space-y-6">
          {/* Stepper Tabs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 flex items-center gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              const disabled = activeQuiz.id === 'new' && tab.id !== 'settings';
              return (
                <button
                  key={tab.id}
                  disabled={disabled}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Quiz Settings */}
          {activeTab === 'settings' && (
            <Card className="space-y-6 border border-slate-200">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">Assessment Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Quiz Title *</label>
                    <input
                      type="text"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                      placeholder="e.g. Midterm Evaluation: Chapter 1-3"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Select Curriculum Module Association</label>
                    <select
                      value={quizForm.module_id}
                      onChange={(e) => setQuizForm({ ...quizForm, module_id: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                    >
                      <option value="">General assessment (Not associated with a module)</option>
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Student Instructions / Rules</label>
                    <textarea
                      value={quizForm.instructions}
                      onChange={(e) => setQuizForm({ ...quizForm, instructions: e.target.value })}
                      rows={5}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 resize-none"
                      placeholder="e.g. Read each question carefully. You have 30 minutes to finish the exam. Correct answers will be revealed after grading."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Passing Score (%)</label>
                      <input
                        type="number"
                        value={quizForm.passing_score || ''}
                        onChange={(e) => setQuizForm({ ...quizForm, passing_score: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Total Marks</label>
                      <input
                        type="number"
                        value={quizForm.total_marks || ''}
                        onChange={(e) => setQuizForm({ ...quizForm, total_marks: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Time Limit (minutes)</label>
                      <input
                        type="number"
                        value={quizForm.time_limit || ''}
                        onChange={(e) => setQuizForm({ ...quizForm, time_limit: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Max Attempts Allowed</label>
                      <input
                        type="number"
                        value={quizForm.max_attempts || ''}
                        onChange={(e) => setQuizForm({ ...quizForm, max_attempts: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Available From</label>
                      <input
                        type="datetime-local"
                        value={quizForm.available_from}
                        onChange={(e) => setQuizForm({ ...quizForm, available_from: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 text-slate-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Available Until (Deadline)</label>
                      <input
                        type="datetime-local"
                        value={quizForm.available_until}
                        onChange={(e) => setQuizForm({ ...quizForm, available_until: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Shuffle checkboxes */}
                  <div className="space-y-2 pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="flex items-center gap-3 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={quizForm.shuffle_questions}
                        onChange={(e) => setQuizForm({ ...quizForm, shuffle_questions: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                      />
                      <span className="text-xs font-bold text-slate-700">Shuffle questions for each student</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={quizForm.shuffle_options}
                        onChange={(e) => setQuizForm({ ...quizForm, shuffle_options: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                      />
                      <span className="text-xs font-bold text-slate-700">Shuffle options (answers) inside MCQs</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={quizForm.show_correct_answers}
                        onChange={(e) => setQuizForm({ ...quizForm, show_correct_answers: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                      />
                      <span className="text-xs font-bold text-slate-700">Show correct options after submission</span>
                    </label>
                  </div>

                </div>

              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setActiveQuiz(null)}>Cancel</Button>
                <Button variant="primary" className="!bg-slate-900" onClick={handleSaveQuiz} disabled={!quizForm.title.trim()}>
                  {activeQuiz.id === 'new' ? 'Create Assessment' : 'Save Settings'}
                </Button>
              </div>
            </Card>
          )}

          {/* TAB 2: Question Builder */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Question Bank</h3>
                  <p className="text-xs text-slate-500 font-medium">Add, reorder, and configure questions for this assessment.</p>
                </div>
                <Button variant="primary" size="sm" className="!bg-slate-900" onClick={() => openQuestionModal()}>
                  <Plus size={16} /> Add Question
                </Button>
              </div>

              {!previewData?.questions || previewData.questions.length === 0 ? (
                <Card className="text-center py-16 border-dashed border-2 border-slate-200">
                  <HelpCircle className="mx-auto text-slate-350 animate-bounce" size={40} />
                  <p className="text-slate-500 font-bold mt-4">No questions created yet.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => openQuestionModal()}>
                    <Plus size={14} /> Add First Question
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {previewData.questions.map((q: any, idx: number) => (
                    <Card key={q.id} className="border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                              Question {idx + 1}
                            </span>
                            <Badge variant="info" className="text-[8px] px-1.5 py-0 uppercase border-none font-bold">
                              {q.type === 'mcq' ? 'MCQ Single Answer' : q.type === 'true_false' ? 'True / False' : 'Short Answer'}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-500">• Marks: {q.marks || 1}</span>
                          </div>

                          <h4 className="text-sm font-black text-slate-900 leading-relaxed">{q.question_text}</h4>
                          
                          {/* MCQ Render Options */}
                          {q.type === 'mcq' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                              {q.options?.map((opt: string, oIdx: number) => {
                                const isCorrect = opt === q.correct_answer;
                                return (
                                  <div
                                    key={oIdx}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                                      isCorrect
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : 'bg-slate-50 border-slate-100 text-slate-600'
                                    }`}
                                  >
                                    <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <span>{opt}</span>
                                    {isCorrect && <Check size={14} className="ml-auto text-emerald-600" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* True / False Render */}
                          {q.type === 'true_false' && (
                            <div className="flex gap-3 pt-2">
                              <span className={`px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-wider ${
                                q.correct_answer === 'true' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-400'
                              }`}>
                                True
                              </span>
                              <span className={`px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-wider ${
                                q.correct_answer === 'false' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-400'
                              }`}>
                                False
                              </span>
                            </div>
                          )}

                          {/* Short Answer Render */}
                          {q.type === 'short_answer' && (
                            <div className="pt-2 flex flex-col gap-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Expected Student Answer:</span>
                              <span className="text-xs font-mono font-bold text-slate-800">{q.correct_answer}</span>
                              <Badge variant="warning" className="text-[8px] uppercase font-bold border-none w-fit mt-1">Manual Grading Required</Badge>
                            </div>
                          )}

                          {q.explanation && (
                            <p className="text-xs text-slate-500 font-medium mt-3 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 flex items-start gap-2">
                              <MessageSquare size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                              <span><strong>Explanation:</strong> {q.explanation}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1.5 flex-shrink-0">
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all" onClick={() => openQuestionModal(q)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" onClick={() => triggerDelete('question', q.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Visual Student Preview */}
          {activeTab === 'preview' && (
            <Card className="space-y-6 border border-slate-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">{quizForm.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Visual representation of the quiz client facing form.</p>
                </div>
                <div className="flex gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Clock size={12} /> {quizForm.time_limit} mins</span>
                  <span className="flex items-center gap-1"><Award size={12} /> {quizForm.passing_score}% Passing</span>
                </div>
              </div>

              {quizForm.instructions && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Instructions:</h5>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">{quizForm.instructions}</p>
                </div>
              )}

              {(!previewData?.questions || previewData.questions.length === 0) ? (
                <p className="text-xs text-slate-400 font-bold text-center py-8">Please add questions in the question builder first.</p>
              ) : (
                <div className="space-y-6">
                  {previewData.questions.map((q: any, idx: number) => (
                    <div key={q.id} className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">Q{idx + 1}: {q.question_text}</span>
                        <span className="text-[10px] font-bold text-slate-400">Marks: {q.marks || 1}</span>
                      </div>

                      {/* MCQ Choices Preview */}
                      {q.type === 'mcq' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options?.map((opt: string, oIdx: number) => {
                            const isSelected = previewAnswers[q.id] === opt;
                            const isCorrect = opt === q.correct_answer;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => !previewChecked && setPreviewAnswers({ ...previewAnswers, [q.id]: opt })}
                                className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-3 ${
                                  previewChecked
                                    ? isCorrect
                                      ? 'bg-emerald-50 border-emerald-350 text-emerald-800 font-bold'
                                      : isSelected
                                        ? 'bg-red-50 border-red-300 text-red-800'
                                        : 'bg-white border-slate-100 text-slate-400'
                                    : isSelected
                                      ? 'bg-slate-900 text-white border-transparent shadow-sm'
                                      : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-700'
                                }`}
                              >
                                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* True/False Preview */}
                      {q.type === 'true_false' && (
                        <div className="flex gap-3">
                          {['true', 'false'].map((val) => {
                            const isSelected = previewAnswers[q.id] === val;
                            const isCorrect = q.correct_answer === val;
                            return (
                              <button
                                key={val}
                                onClick={() => !previewChecked && setPreviewAnswers({ ...previewAnswers, [q.id]: val })}
                                className={`px-5 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                                  previewChecked
                                    ? isCorrect
                                      ? 'bg-emerald-50 border-emerald-350 text-emerald-800'
                                      : isSelected
                                        ? 'bg-red-50 border-red-300 text-red-800'
                                        : 'bg-white border-slate-100 text-slate-400'
                                    : isSelected
                                      ? 'bg-slate-900 text-white border-transparent'
                                      : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-700'
                                }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Short Answer Preview */}
                      {q.type === 'short_answer' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            disabled={previewChecked}
                            placeholder="Type study response..."
                            value={previewAnswers[q.id] || ''}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                            className="w-full max-w-md border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-slate-900"
                          />
                          {previewChecked && (
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              Expected answer: <span className="font-mono text-emerald-600 font-black">{q.correct_answer}</span>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  ))}

                  <div className="flex gap-3 pt-4 border-t border-slate-100 items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => { setPreviewChecked(false); setPreviewAnswers({}); }}>
                      Reset Attempt
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="!bg-slate-900"
                      onClick={() => setPreviewChecked(true)}
                      disabled={previewChecked}
                    >
                      <CheckCircle2 size={14} /> Submit answers
                    </Button>
                  </div>
                </div>
              )}

            </Card>
          )}

        </div>
      )}

      {/* ── QUESTION CREATION MODAL ── */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowQuestionModal(false)} />
          <Card className="relative w-full max-w-lg space-y-4 z-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Question Type</label>
                <select
                  value={questionForm.type}
                  onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value, correct_answer: '' })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                >
                  <option value="mcq">MCQ Single Answer</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Question Score (Marks)</label>
                <input
                  type="number"
                  value={questionForm.marks || ''}
                  onChange={(e) => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Question Text *</label>
              <textarea
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 resize-none"
                placeholder="e.g. Which of the following is not a semantic HTML tags?"
              />
            </div>

            {/* MCQ Option Builders */}
            {questionForm.type === 'mcq' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500">Options (Fill choices & select correct answer)</label>
                {questionForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correct_choice"
                      checked={questionForm.correct_answer === opt && opt !== ''}
                      onChange={() => setQuestionForm({ ...questionForm, correct_answer: opt })}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold outline-none focus:border-slate-900"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* True / False Builder */}
            {questionForm.type === 'true_false' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Select Correct Answer</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700 bg-slate-50 px-4 py-2 border rounded-xl hover:bg-slate-100 transition-all">
                    <input
                      type="radio"
                      name="tf_answer"
                      value="true"
                      checked={questionForm.correct_answer === 'true'}
                      onChange={() => setQuestionForm({ ...questionForm, correct_answer: 'true' })}
                      className="w-4 h-4 text-slate-900 focus:ring-slate-900"
                    />
                    <span>True</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700 bg-slate-50 px-4 py-2 border rounded-xl hover:bg-slate-100 transition-all">
                    <input
                      type="radio"
                      name="tf_answer"
                      value="false"
                      checked={questionForm.correct_answer === 'false'}
                      onChange={() => setQuestionForm({ ...questionForm, correct_answer: 'false' })}
                      className="w-4 h-4 text-slate-900 focus:ring-slate-900"
                    />
                    <span>False</span>
                  </label>
                </div>
              </div>
            )}

            {/* Short Answer Builder */}
            {questionForm.type === 'short_answer' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Expected Student Answer (exact string) *</label>
                <input
                  type="text"
                  value={questionForm.correct_answer}
                  onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                  placeholder="e.g. <div> or css grid"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Answer Explanation (optional)</label>
              <textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 resize-none"
                placeholder="Explain why this choice is correct..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowQuestionModal(false)}>Cancel</Button>
              <Button variant="primary" className="!bg-slate-900" onClick={handleSaveQuestion} disabled={!questionForm.question_text.trim()}>
                {editingQuestion ? 'Update' : 'Add Question'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Delete Confirmation"
          message={`Are you absolutely sure you want to delete this ${deleteConfirm.type}? This action is permanent and cannot be undone.`}
        />
      )}
    </div>
  );
}

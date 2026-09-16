/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Edit3, Trash2, ChevronDown, ChevronRight, Search, Check,
  BookOpen, Layers, Award, Eye, FileText, Video, Link as LinkIcon,
  HelpCircle, Calendar, ShieldAlert, Sparkles, CheckCircle2, Clock,
  Upload, Loader2, Image, Target, Save, X
} from 'lucide-react';
import {
  getMyInstructorCourses,
  getCourseBuilderData,
  updateCourse,
  createInstructorModule,
  updateInstructorModule,
  deleteInstructorModule,
  createInstructorLesson,
  updateInstructorLesson,
  deleteInstructorLesson,
  createInstructorResource,
  updateInstructorResource,
  deleteInstructorResource,
  checkCoursePublish,
  publishInstructorCourse,
  uploadInstructorFile
} from '../../services/courseService';
import { createQuiz, updateQuiz, deleteQuiz } from '../../services/quizService';
import { createAssignment, updateAssignment, deleteAssignment } from '../../services/assignmentService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const CATEGORIES = [
  'Technology',
  'Programming',
  'Web Development',
  'Data Science',
  'Cloud Engineering',
  'Mobile Development',
  'Cybersecurity',
  'AI & Machine Learning',
  'DevOps',
  'UI/UX Design',
  'Education',
  'Business',
  'Other',
];

export const DEFAULT_COURSE_LOGOS = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580894732413-a75151b96f01?w=800&auto=format&fit=crop&q=80',
];

interface Step {
  id: number;
  label: string;
  icon: any;
}

const STEPS: Step[] = [
  { id: 0, label: 'Course Info', icon: BookOpen },
  { id: 1, label: 'Curriculum', icon: Layers },
  { id: 2, label: 'Assessments', icon: HelpCircle },
  { id: 3, label: 'Preview', icon: Eye },
  { id: 4, label: 'Publish', icon: CheckCircle2 }
];

export default function CourseBuilder() {
  const navigate = useNavigate();

  // Courses list
  const [courses, setCourses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Selected course details
  const [course, setCourse] = useState<any | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingBuilder, setLoadingBuilder] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // Default to Curriculum

  // Accordion state
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Modals state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [moduleForm, setModuleForm] = useState({
    title: '', description: '', estimated_duration: 0,
    required_for_certificate: false, unlock_rule: 'always', unlock_date: ''
  });

  const [showLessonModal, setShowLessonModal] = useState<string | null>(null); // holds module_id
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '', type: 'video', content: '', video_url: '',
    file_url: '', estimated_duration: 0, required_completion: true
  });

  const [showResourceModal, setShowResourceModal] = useState<string | null>(null); // holds module_id
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [resourceForm, setResourceForm] = useState({
    title: '', type: 'pdf', url: '', downloadable: true
  });

  const [showQuizModal, setShowQuizModal] = useState<string | null>(null); // holds module_id
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: '', instructions: '', passing_score: 60, total_marks: 100,
    time_limit: 30, max_attempts: 3, status: 'draft'
  });

  const [showAssignmentModal, setShowAssignmentModal] = useState<string | null>(null); // holds module_id
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '', instructions: '', due_date: '', total_marks: 100,
    submission_type: 'both', accepted_file_types: '', status: 'draft',
    deadline_type: 'days' as 'days' | 'date',
    due_days: 10,
    allow_late: false,
    late_penalty: 10
  });

  // Delete confirmations
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'module' | 'lesson' | 'resource' | 'quiz' | 'assignment'; id: string } | null>(null);

  // Publish check state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishChecklist, setPublishChecklist] = useState<any[]>([]);
  const [canPublish, setCanPublish] = useState(false);

  // Notifications
  const [toastMsg, setToastMsg] = useState('');
  
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Course Info & Settings Form State
  const [courseInfoForm, setCourseInfoForm] = useState({
    title: '',
    short_description: '',
    description: '',
    category: 'Technology',
    level: 'Beginner',
    language: 'English',
    estimated_hours: 0,
    thumbnail_url: '',
    preview_video_url: '',
    learning_outcomes: [''] as string[],
    prerequisites: [''] as string[],
    price_type: 'free',
    price: 0,
    certificate_available: true,
    enrollment_open: true,
    allow_discussion: true,
  });
  const [savingCourseInfo, setSavingCourseInfo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const syncCourseInfoForm = (data: any) => {
    setCourseInfoForm({
      title: data.title || '',
      short_description: data.short_description || '',
      description: data.description || '',
      category: data.category || 'Technology',
      level: data.level || 'Beginner',
      language: data.language || 'English',
      estimated_hours: data.estimated_hours || 0,
      thumbnail_url: data.thumbnail_url || '',
      preview_video_url: data.preview_video_url || '',
      learning_outcomes: Array.isArray(data.learning_outcomes) && data.learning_outcomes.length > 0 ? [...data.learning_outcomes] : [''],
      prerequisites: Array.isArray(data.prerequisites) && data.prerequisites.length > 0 ? [...data.prerequisites] : [''],
      price_type: data.price_type || 'free',
      price: data.price || 0,
      certificate_available: data.certificate_available ?? true,
      enrollment_open: data.enrollment_open ?? true,
      allow_discussion: data.allow_discussion ?? true,
    });
  };

  const addOutcome = () => {
    setCourseInfoForm((prev) => ({
      ...prev,
      learning_outcomes: [...prev.learning_outcomes, '']
    }));
  };

  const updateOutcome = (index: number, val: string) => {
    setCourseInfoForm((prev) => {
      const copy = [...prev.learning_outcomes];
      copy[index] = val;
      return { ...prev, learning_outcomes: copy };
    });
  };

  const removeOutcome = (index: number) => {
    setCourseInfoForm((prev) => {
      const copy = [...prev.learning_outcomes];
      copy.splice(index, 1);
      return { ...prev, learning_outcomes: copy.length === 0 ? [''] : copy };
    });
  };

  const addPrerequisite = () => {
    setCourseInfoForm((prev) => ({
      ...prev,
      prerequisites: [...prev.prerequisites, '']
    }));
  };

  const updatePrerequisite = (index: number, val: string) => {
    setCourseInfoForm((prev) => {
      const copy = [...prev.prerequisites];
      copy[index] = val;
      return { ...prev, prerequisites: copy };
    });
  };

  const removePrerequisite = (index: number) => {
    setCourseInfoForm((prev) => {
      const copy = [...prev.prerequisites];
      copy.splice(index, 1);
      return { ...prev, prerequisites: copy.length === 0 ? [''] : copy };
    });
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumbnail(true);
    try {
      const url = await uploadInstructorFile(file);
      setCourseInfoForm((prev) => ({ ...prev, thumbnail_url: url }));
      showToast('Course thumbnail uploaded successfully!');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSaveCourseInfo = async () => {
    if (!selectedCourseId) return;
    if (!courseInfoForm.title.trim()) {
      showToast('Course title is required.');
      return;
    }

    setSavingCourseInfo(true);
    try {
      const filteredOutcomes = courseInfoForm.learning_outcomes.map(o => o.trim()).filter(Boolean);
      const filteredPrereqs = courseInfoForm.prerequisites.map(p => p.trim()).filter(Boolean);

      const payload = {
        title: courseInfoForm.title.trim(),
        short_description: courseInfoForm.short_description.trim(),
        description: courseInfoForm.description.trim(),
        category: courseInfoForm.category,
        level: courseInfoForm.level,
        language: courseInfoForm.language,
        estimated_hours: Number(courseInfoForm.estimated_hours) || 0,
        thumbnail_url: courseInfoForm.thumbnail_url.trim() || null,
        preview_video_url: courseInfoForm.preview_video_url.trim() || null,
        learning_outcomes: filteredOutcomes,
        prerequisites: filteredPrereqs,
        price_type: courseInfoForm.price_type,
        price: Number(courseInfoForm.price) || 0,
        certificate_available: courseInfoForm.certificate_available,
        enrollment_open: courseInfoForm.enrollment_open,
        allow_discussion: courseInfoForm.allow_discussion,
      };

      await updateCourse(selectedCourseId, payload);
      setCourse((prev: any) => ({
        ...prev,
        ...payload,
      }));
      setCourses((prev) =>
        prev.map((c) => (c.id === selectedCourseId ? { ...c, ...payload } : c))
      );
      showToast('Course details & thumbnail saved successfully!');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update course information.');
    } finally {
      setSavingCourseInfo(false);
    }
  };

  // Load all instructor courses
  const loadCourses = async (selectFirst = true) => {
    setLoadingCourses(true);
    try {
      const data = await getMyInstructorCourses();
      setCourses(data);
      if (selectFirst && data.length > 0) {
        setSelectedCourseId(data[0].id);
      }
    } catch {
      showToast('Failed to load courses.');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Load builder data when selected course changes
  const loadBuilderData = async (courseId: string) => {
    setLoadingBuilder(true);
    try {
      const data = await getCourseBuilderData(courseId);
      setCourse(data);
      syncCourseInfoForm(data);
      // Auto expand first module
      if (data.modules && data.modules.length > 0) {
        setExpandedModules(new Set([data.modules[0].id]));
      }
    } catch {
      showToast('Failed to load curriculum builder.');
    } finally {
      setLoadingBuilder(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadBuilderData(selectedCourseId);
    }
  }, [selectedCourseId]);

  const selectCourse = (id: string) => {
    setSelectedCourseId(id);
    setActiveStep(1); // Reset to curriculum step
  };

  // Accordion toggles
  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Module Actions
  const openModuleModal = (mod: any = null) => {
    if (mod) {
      setEditingModule(mod);
      setModuleForm({
        title: mod.title || '',
        description: mod.description || '',
        estimated_duration: mod.estimated_duration || 0,
        required_for_certificate: mod.required_for_certificate || false,
        unlock_rule: mod.unlock_rule || 'always',
        unlock_date: mod.unlock_date || ''
      });
    } else {
      setEditingModule(null);
      setModuleForm({
        title: '', description: '', estimated_duration: 0,
        required_for_certificate: false, unlock_rule: 'always', unlock_date: ''
      });
    }
    setShowModuleModal(true);
  };

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim() || !selectedCourseId) return;
    try {
      if (editingModule) {
        await updateInstructorModule(editingModule.id, moduleForm);
        showToast('Module updated successfully');
      } else {
        await createInstructorModule(selectedCourseId, moduleForm);
        showToast('Module created successfully');
      }
      setShowModuleModal(false);
      loadBuilderData(selectedCourseId);
    } catch {
      showToast('Failed to save module');
    }
  };

  // Lesson Upload state & handler
  const [lessonUploading, setLessonUploading] = useState(false);

  const handleLessonFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'video_url' | 'file_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLessonUploading(true);
    try {
      const url = await uploadInstructorFile(file);
      setLessonForm(prev => ({ ...prev, [targetField]: url }));
      showToast('File uploaded successfully!');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to upload file');
    } finally {
      setLessonUploading(false);
    }
  };

  // Lesson Actions
  const openLessonModal = (moduleId: string, les: any = null) => {
    setShowLessonModal(moduleId);
    setLessonUploading(false);
    if (les) {
      setEditingLesson(les);
      setFormLesson(les);
    } else {
      setEditingLesson(null);
      setLessonForm({
        title: '', type: 'video', content: '', video_url: '',
        file_url: '', estimated_duration: 0, required_completion: true
      });
    }
  };

  const setFormLesson = (les: any) => {
    setLessonForm({
      title: les.title || '',
      type: les.type || 'video',
      content: les.content || '',
      video_url: les.video_url || '',
      file_url: les.file_url || '',
      estimated_duration: les.estimated_duration || 0,
      required_completion: les.required_completion !== undefined ? les.required_completion : true
    });
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim() || !showLessonModal || !selectedCourseId) return;
    try {
      if (editingLesson) {
        await updateInstructorLesson(editingLesson.id, lessonForm);
        showToast('Lesson updated');
      } else {
        await createInstructorLesson(showLessonModal, lessonForm);
        showToast('Lesson created');
      }
      setShowLessonModal(null);
      loadBuilderData(selectedCourseId);
    } catch {
      showToast('Failed to save lesson');
    }
  };

  // Resource Upload state & handler
  const [uploading, setUploading] = useState(false);

  const getFileAcceptHeader = (type: string): string => {
    switch (type) {
      case 'pdf': return '.pdf';
      case 'ppt': return '.ppt,.pptx';
      case 'document': return '.doc,.docx,.txt,.rtf,.odt';
      case 'video': return 'video/*';
      default: return '*';
    }
  };

  const handleResourceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const url = await uploadInstructorFile(file);
      setResourceForm(prev => ({ ...prev, url }));
      showToast('File uploaded successfully!');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Resource Actions
  const openResourceModal = (moduleId: string, res: any = null) => {
    setShowResourceModal(moduleId);
    setUploading(false);
    if (res) {
      setEditingResource(res);
      setResourceForm({
        title: res.title || '',
        type: res.type || 'pdf',
        url: res.url || '',
        downloadable: res.downloadable !== undefined ? res.downloadable : true
      });
    } else {
      setEditingResource(null);
      setResourceForm({
        title: '', type: 'pdf', url: '', downloadable: true
      });
    }
  };

  const handleSaveResource = async () => {
    if (!resourceForm.title.trim() || !showResourceModal || !selectedCourseId) return;
    try {
      if (editingResource) {
        await updateInstructorResource(editingResource.id, resourceForm);
        showToast('Resource updated');
      } else {
        await createInstructorResource(showResourceModal, resourceForm);
        showToast('Resource added');
      }
      setShowResourceModal(null);
      loadBuilderData(selectedCourseId);
    } catch {
      showToast('Failed to save resource');
    }
  };

  // Quiz Actions
  const openQuizModal = (moduleId: string, q: any = null) => {
    setShowQuizModal(moduleId);
    if (q) {
      setEditingQuiz(q);
      setQuizForm({
        title: q.title || '',
        instructions: q.instructions || '',
        passing_score: q.passing_score || 60,
        total_marks: q.total_marks || 100,
        time_limit: q.time_limit || 30,
        max_attempts: q.max_attempts || 3,
        status: q.status || 'draft'
      });
    } else {
      setEditingQuiz(null);
      setQuizForm({
        title: '', instructions: '', passing_score: 60, total_marks: 100,
        time_limit: 30, max_attempts: 3, status: 'draft'
      });
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title.trim() || !showQuizModal || !selectedCourseId) return;
    try {
      if (editingQuiz) {
        await updateQuiz(editingQuiz.id, { ...quizForm, module_id: showQuizModal });
        showToast('Quiz updated');
      } else {
        await createQuiz(selectedCourseId, { ...quizForm, module_id: showQuizModal });
        showToast('Quiz created in module');
      }
      setShowQuizModal(null);
      loadBuilderData(selectedCourseId);
    } catch {
      showToast('Failed to save quiz');
    }
  };

  // Assignment Actions
  const openAssignmentModal = (moduleId: string, a: any = null) => {
    setShowAssignmentModal(moduleId);
    if (a) {
      setEditingAssignment(a);
      setAssignmentForm({
        title: a.title || '',
        instructions: a.instructions || '',
        due_date: a.due_date ? a.due_date.slice(0, 10) : '',
        total_marks: a.total_marks || 100,
        submission_type: a.submission_type || 'both',
        accepted_file_types: a.accepted_file_types || '',
        status: a.status || 'draft',
        deadline_type: a.deadline_type || (a.due_days ? 'days' : (a.due_date ? 'date' : 'days')),
        due_days: a.due_days !== undefined ? a.due_days : 10,
        allow_late: a.allow_late ?? false,
        late_penalty: a.late_penalty ?? 10
      });
    } else {
      setEditingAssignment(null);
      setAssignmentForm({
        title: '', instructions: '', due_date: '', total_marks: 100,
        submission_type: 'both', accepted_file_types: '', status: 'draft',
        deadline_type: 'days',
        due_days: 10,
        allow_late: false,
        late_penalty: 10
      });
    }
  };

  const handleSaveAssignment = async () => {
    if (!assignmentForm.title.trim() || !showAssignmentModal || !selectedCourseId) return;
    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, { ...assignmentForm, module_id: showAssignmentModal });
        showToast('Assignment updated');
      } else {
        await createAssignment(selectedCourseId, { ...assignmentForm, module_id: showAssignmentModal });
        showToast('Assignment created in module');
      }
      setShowAssignmentModal(null);
      loadBuilderData(selectedCourseId);
    } catch {
      showToast('Failed to save assignment');
    }
  };

  // Deletions
  const triggerDelete = (type: 'module' | 'lesson' | 'resource' | 'quiz' | 'assignment', id: string) => {
    setDeleteConfirm({ type, id });
  };

  const handleDelete = async () => {
    if (!deleteConfirm || !selectedCourseId) return;
    try {
      if (deleteConfirm.type === 'module') {
        await deleteInstructorModule(deleteConfirm.id);
        showToast('Module deleted');
      } else if (deleteConfirm.type === 'lesson') {
        await deleteInstructorLesson(deleteConfirm.id);
        showToast('Lesson deleted');
      } else if (deleteConfirm.type === 'resource') {
        await deleteInstructorResource(deleteConfirm.id);
        showToast('Resource deleted');
      } else if (deleteConfirm.type === 'quiz') {
        await deleteQuiz(deleteConfirm.id);
        showToast('Quiz deleted');
      } else if (deleteConfirm.type === 'assignment') {
        await deleteAssignment(deleteConfirm.id);
        showToast('Assignment deleted');
      }
      setDeleteConfirm(null);
      loadBuilderData(selectedCourseId);
    } catch {
      showToast('Failed to delete item');
    }
  };

  // Publish verification
  const handlePublishCheck = async () => {
    if (!selectedCourseId) return;
    try {
      const res = await checkCoursePublish(selectedCourseId);
      setPublishChecklist(res.checklist || []);
      setCanPublish(res.is_valid || false);
      setShowPublishModal(true);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to run publication checks.');
    }
  };

  const handlePublish = async () => {
    if (!selectedCourseId) return;
    try {
      await publishInstructorCourse(selectedCourseId);
      showToast('Course published successfully!');
      setShowPublishModal(false);
      loadCourses(false);
      loadBuilderData(selectedCourseId);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to publish course.');
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={14} className="text-blue-500" />;
      case 'text': return <FileText size={14} className="text-amber-500" />;
      case 'pdf': return <FileText size={14} className="text-red-500" />;
      case 'ppt': return <Layers size={14} className="text-orange-500" />;
      default: return <LinkIcon size={14} className="text-slate-500" />;
    }
  };

  // Calculation of building progress
  const getBuildProgress = () => {
    if (!course) return 0;
    let score = 0;
    if (course.title) score += 20;
    if (course.description) score += 20;
    if (course.thumbnail_url) score += 20;
    if (course.learning_outcomes && course.learning_outcomes.length > 0) score += 20;
    if (course.modules && course.modules.length > 0) {
      const allModulesHaveContent = course.modules.every((m: any) => 
        (m.lessons?.length || 0) + (m.resources?.length || 0) + (m.quizzes?.length || 0) + (m.assignments?.length || 0) > 0
      );
      score += allModulesHaveContent ? 20 : 10;
    }
    return Math.min(score, 100);
  };

  // Filter courses
  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-2">
          {toastMsg}
        </div>
      )}

      {/* Stepper Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = activeStep === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {course && (
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={() => navigate(`/student/courses/${course.id}`)}>
              <Eye size={14} /> Preview as Student
            </Button>
            {course.status !== 'published' ? (
              <Button variant="primary" size="sm" className="!bg-slate-900" onClick={handlePublishCheck}>
                <Check size={14} /> Publish Course
              </Button>
            ) : (
              <Badge variant="success" className="px-3 py-1 text-xs">Published</Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* ── LEFT PANEL: Courses list ── */}
        <Card className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">My Courses</h3>
            <Button variant="ghost" size="sm" className="!p-1.5" onClick={() => navigate('/instructor/create-course')}>
              <Plus size={16} />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-900 focus:bg-white transition-all font-semibold"
            />
          </div>

          {loadingCourses ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto text-slate-300" size={32} />
              <p className="text-xs text-slate-500 font-bold mt-2">No courses found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCourses.map((c) => {
                const active = c.id === selectedCourseId;
                return (
                  <button
                    key={c.id}
                    onClick={() => selectCourse(c.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1.5 ${
                      active ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <span className="text-xs font-black line-clamp-1">{c.title}</span>
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[9px] uppercase font-extrabold tracking-wider ${active ? 'text-slate-400' : 'text-slate-500'}`}>
                        {c.category}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        c.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── MAIN PANEL ── */}
        <div className="lg:col-span-3 space-y-6">
          
          {loadingBuilder ? (
            <div className="space-y-4">
              <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
              <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
            </div>
          ) : !course ? (
            <Card className="text-center py-16">
              <BookOpen className="mx-auto text-slate-300" size={48} />
              <p className="text-slate-500 font-extrabold mt-4">Select or Create a course to start building curriculum.</p>
              <Button variant="primary" className="mt-4 !bg-slate-900" onClick={() => navigate('/instructor/create-course')}>
                <Plus size={16} /> Create Course
              </Button>
            </Card>
          ) : (
            <>
              {/* Course Meta Banner */}
              <div className="bg-slate-950 text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-6">
                  <Sparkles size={160} />
                </div>
                
                <div className="flex items-center gap-4 relative z-10">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-slate-700/60 shadow-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center text-slate-400 flex-shrink-0">
                      <Image size={24} className="opacity-60" />
                      <span className="text-[9px] font-bold mt-1 text-slate-500">No Image</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info" className="bg-blue-900/40 text-blue-200 border-none font-bold text-[10px] uppercase">
                        {course.category}
                      </Badge>
                      <Badge variant="default" className="bg-slate-800 text-slate-300 border-none font-bold text-[10px] uppercase">
                        {course.level}
                      </Badge>
                      {course.learning_outcomes && course.learning_outcomes.length > 0 && (
                        <Badge variant="success" className="bg-emerald-950/60 text-emerald-300 border-none font-bold text-[10px]">
                          {course.learning_outcomes.length} Objectives
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-black">{course.title}</h2>
                    <p className="text-xs text-slate-400 max-w-xl line-clamp-1">{course.short_description || course.description}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 relative z-10 w-full md:w-auto">
                  <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <span className="text-xs text-slate-400 font-bold">Building Progress</span>
                    <span className="text-xs font-black text-blue-400">{getBuildProgress()}%</span>
                  </div>
                  <div className="w-full md:w-44 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${getBuildProgress()}%` }} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveStep(0)}
                    className="mt-1 !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 text-xs flex items-center gap-1.5"
                  >
                    <Edit3 size={13} /> Edit Course Info & Thumbnail
                  </Button>
                </div>
              </div>

              {/* Step 1: Curriculum Builder */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">Curriculum Modules</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Organize your course into structured learning chapters.</p>
                    </div>
                    <Button variant="primary" size="sm" className="!bg-slate-900" onClick={() => openModuleModal()}>
                      <Plus size={16} /> Add Module
                    </Button>
                  </div>

                  {(!course.modules || course.modules.length === 0) ? (
                    <Card className="text-center py-16 border-dashed border-2 border-slate-200">
                      <Layers className="mx-auto text-slate-300" size={40} />
                      <p className="text-slate-500 font-bold mt-4">No modules yet. Add your first module to start building the course.</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => openModuleModal()}>
                        <Plus size={14} /> Add First Module
                      </Button>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {course.modules.map((m: any, mIdx: number) => {
                        const isExpanded = expandedModules.has(m.id);
                        const totalModuleItems = (m.lessons?.length || 0) + (m.resources?.length || 0) + (m.quizzes?.length || 0) + (m.assignments?.length || 0);
                        return (
                          <Card key={m.id} padding="none" className={`overflow-hidden border ${totalModuleItems === 0 ? 'border-amber-200' : 'border-slate-200'}`}>
                            
                            {/* Module Header Row */}
                            <div className={`p-4 flex items-center justify-between ${totalModuleItems === 0 ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'bg-slate-50/50 hover:bg-slate-50'} transition-colors`}>
                              <div className="flex items-center gap-3 min-w-0">
                                <button onClick={() => toggleModule(m.id)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-all">
                                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                      Module {mIdx + 1}
                                    </span>
                                    {m.required_for_certificate && (
                                      <Badge variant="info" className="text-[8px] px-1 py-0 border-none font-bold">Required</Badge>
                                    )}
                                    {totalModuleItems === 0 && (
                                      <Badge variant="warning" className="text-[9px] px-1.5 py-0.5 font-bold">
                                        Empty (Needs Content)
                                      </Badge>
                                    )}
                                  </div>
                                  <h4 className="font-extrabold text-sm text-slate-900 truncate mt-0.5">{m.title}</h4>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Button variant="ghost" size="sm" className="!p-1.5" title="Add Lesson" onClick={() => openLessonModal(m.id)}>
                                  <Plus size={14} /> <span className="hidden sm:inline ml-1 text-xs">Lesson</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="!p-1.5" title="Add Resource" onClick={() => openResourceModal(m.id)}>
                                  <Plus size={14} /> <span className="hidden sm:inline ml-1 text-xs">Resource</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="!p-1.5 text-purple-600 hover:bg-purple-50" title="Add Quiz" onClick={() => openQuizModal(m.id)}>
                                  <Plus size={14} /> <span className="hidden sm:inline ml-1 text-xs">Quiz</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="!p-1.5 text-indigo-600 hover:bg-indigo-50" title="Add Assignment" onClick={() => openAssignmentModal(m.id)}>
                                  <Plus size={14} /> <span className="hidden sm:inline ml-1 text-xs">Assignment</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="!p-1.5" onClick={() => openModuleModal(m)}>
                                  <Edit2 size={14} />
                                </Button>
                                <Button variant="ghost" size="sm" className="!p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => triggerDelete('module', m.id)}>
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>

                            {/* Module Details & Content (Expanded) */}
                            {isExpanded && (
                              <div className="border-t border-slate-100 p-4 space-y-4">
                                {m.description && (
                                  <p className="text-xs text-slate-500 font-medium italic pl-2 border-l-2 border-slate-200">
                                    {m.description}
                                  </p>
                                )}

                                {/* Lock/Unlock Info */}
                                <div className="flex flex-wrap gap-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 pl-4">
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={12} className="text-slate-400" />
                                    <span>Duration: {m.estimated_duration || 0} mins</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Calendar size={12} className="text-slate-400" />
                                    <span>Unlock rule: {m.unlock_rule === 'always' ? 'Always open' : m.unlock_rule === 'previous_completed' ? 'After prev module' : `On date (${m.unlock_date || '—'})`}</span>
                                  </div>
                                </div>

                                {/* Nested Lessons, Resources, Quizzes & Assignments */}
                                <div className="space-y-2">
                                  {/* Lessons */}
                                  {m.lessons?.map((l: any, lIdx: number) => (
                                    <div key={l.id} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl pl-4 transition-colors">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                                          {getLessonIcon(l.type)}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-black text-slate-900 truncate">{l.title}</p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] uppercase font-bold text-slate-400">Lesson {lIdx + 1}</span>
                                            <span className="text-[9px] font-bold text-slate-400">•</span>
                                            <span className="text-[9px] uppercase font-bold text-slate-400">{l.type}</span>
                                            <span className="text-[9px] font-bold text-slate-400">•</span>
                                            <span className="text-[9px] uppercase font-bold text-slate-400">{l.estimated_duration} mins</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex gap-1 flex-shrink-0">
                                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all" onClick={() => openLessonModal(m.id, l)}>
                                          <Edit2 size={13} />
                                        </button>
                                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" onClick={() => triggerDelete('lesson', l.id)}>
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Resources */}
                                  {m.resources?.map((r: any) => (
                                    <div key={r.id} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl pl-4 transition-colors">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                                          <LinkIcon size={13} className="text-slate-500" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-slate-800 truncate">{r.title}</p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] uppercase font-bold text-slate-400">{r.type}</span>
                                            {r.downloadable && (
                                              <>
                                                <span className="text-[9px] font-bold text-slate-400">•</span>
                                                <span className="text-[9px] uppercase font-bold text-emerald-600">Downloadable</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex gap-1 flex-shrink-0">
                                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-all" onClick={() => openResourceModal(m.id, r)}>
                                          <Edit2 size={12} />
                                        </button>
                                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" onClick={() => triggerDelete('resource', r.id)}>
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Quizzes */}
                                  {m.quizzes?.map((q: any) => (
                                    <div key={q.id} className="flex items-center justify-between p-3 bg-purple-50/40 hover:bg-purple-50 border border-purple-100 rounded-xl pl-4 transition-colors">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                                          <Award size={14} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-black text-slate-900 truncate">{q.title}</p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] uppercase font-bold text-purple-600">Quiz</span>
                                            <span className="text-[9px] font-bold text-slate-400">•</span>
                                            <span className="text-[9px] font-bold text-slate-500">{q.time_limit || 30} mins</span>
                                            <span className="text-[9px] font-bold text-slate-400">•</span>
                                            <span className="text-[9px] font-bold text-slate-500">Passing: {q.passing_score || 60}%</span>
                                            <span className="text-[9px] font-bold text-slate-400">•</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${q.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                                              {q.status || 'draft'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex gap-1 flex-shrink-0">
                                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white transition-all" onClick={() => openQuizModal(m.id, q)}>
                                          <Edit2 size={13} />
                                        </button>
                                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" onClick={() => triggerDelete('quiz', q.id)}>
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Assignments */}
                                  {m.assignments?.map((a: any) => (
                                    <div key={a.id} className="flex items-center justify-between p-3 bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100 rounded-xl pl-4 transition-colors">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                                          <FileText size={14} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-black text-slate-900 truncate">{a.title}</p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] uppercase font-bold text-indigo-600">Assignment</span>
                                            <span className="text-[9px] font-bold text-slate-400">•</span>
                                            <span className="text-[9px] font-bold text-slate-500">{a.total_marks || 100} Marks</span>
                                            {a.due_days ? (
                                              <>
                                                <span className="text-[9px] font-bold text-slate-400">•</span>
                                                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded">Due: {a.due_days}d from enrollment</span>
                                              </>
                                            ) : a.due_date ? (
                                              <>
                                                <span className="text-[9px] font-bold text-slate-400">•</span>
                                                <span className="text-[9px] font-bold text-slate-500">Due: {a.due_date}</span>
                                              </>
                                            ) : null}
                                            <span className="text-[9px] font-bold text-slate-400">•</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${a.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                                              {a.status || 'draft'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex gap-1 flex-shrink-0">
                                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white transition-all" onClick={() => openAssignmentModal(m.id, a)}>
                                          <Edit2 size={13} />
                                        </button>
                                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" onClick={() => triggerDelete('assignment', a.id)}>
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {(!m.lessons || m.lessons.length === 0) && (!m.resources || m.resources.length === 0) && (!m.quizzes || m.quizzes.length === 0) && (!m.assignments || m.assignments.length === 0) && (
                                    <p className="text-xs text-slate-400 font-medium italic text-center py-4">
                                      No lessons, resources, quizzes, or assignments in this module. Add one above.
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 0: Course Info, Thumbnail, Learning Outcomes & Settings Editor */}
              {activeStep === 0 && (
                <div className="space-y-6">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                        <BookOpen className="text-blue-600" size={20} /> Course Information & Media Settings
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Customize your course branding, thumbnail poster, learning objectives, category, and prerequisites.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveStep(1)}
                      >
                        Curriculum <ChevronRight size={14} className="ml-1" />
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="!bg-slate-900"
                        onClick={handleSaveCourseInfo}
                        disabled={savingCourseInfo}
                      >
                        {savingCourseInfo ? (
                          <>
                            <Loader2 size={14} className="animate-spin mr-1.5" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save size={14} className="mr-1.5" /> Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Section 1: Thumbnail & Media */}
                  <Card className="p-6 space-y-5 border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Image className="text-blue-500" size={18} />
                        <h4 className="font-extrabold text-sm text-slate-900">Course Thumbnail & Cover Image</h4>
                      </div>
                      {courseInfoForm.thumbnail_url ? (
                        <Badge variant="success" className="text-[10px] px-2 py-0.5 font-bold">Thumbnail Set</Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px] px-2 py-0.5 font-bold">Required for Publishing</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      {/* Preview */}
                      <div className="md:col-span-5">
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">Thumbnail Preview</label>
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center shadow-inner group">
                          {courseInfoForm.thumbnail_url ? (
                            <>
                              <img
                                src={courseInfoForm.thumbnail_url}
                                alt={courseInfoForm.title || "Course thumbnail"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCourseInfoForm(prev => ({ ...prev, thumbnail_url: '' }))}
                                  className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all text-xs font-bold flex items-center gap-1 shadow-lg"
                                >
                                  <Trash2 size={13} /> Remove
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-6">
                              <Image className="mx-auto text-slate-300 mb-2" size={36} />
                              <p className="text-xs font-bold text-slate-400">No thumbnail selected</p>
                              <p className="text-[10px] text-slate-400 mt-1">Recommended size: 1280 × 720 (16:9)</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Upload or URL controls */}
                      <div className="md:col-span-7 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Upload Image File</label>
                          <div className="flex items-center gap-3">
                            <label className="relative flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-slate-200">
                              {uploadingThumbnail ? (
                                <>
                                  <Loader2 size={14} className="animate-spin text-slate-600" />
                                  <span>Uploading...</span>
                                </>
                              ) : (
                                <>
                                  <Upload size={14} />
                                  <span>Choose Image from Device</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailUpload}
                                disabled={uploadingThumbnail}
                                className="hidden"
                              />
                            </label>
                            <span className="text-[11px] text-slate-400 font-medium">PNG, JPG, JPEG, or WEBP up to 5MB</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Or Paste Image URL</label>
                          <input
                            type="text"
                            value={courseInfoForm.thumbnail_url}
                            onChange={(e) => setCourseInfoForm({ ...courseInfoForm, thumbnail_url: e.target.value })}
                            placeholder="https://example.com/images/course-poster.jpg"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50 focus:bg-white transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700">Or Pick from Preset MOOC Covers</label>
                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                            {DEFAULT_COURSE_LOGOS.map((imgUrl, i) => {
                              const isSelected = courseInfoForm.thumbnail_url === imgUrl;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setCourseInfoForm({ ...courseInfoForm, thumbnail_url: imgUrl })}
                                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                                    isSelected ? 'border-blue-600 ring-2 ring-blue-600/30 scale-105' : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                                  }`}
                                >
                                  <img src={imgUrl} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                                      <Check size={12} className="text-white drop-shadow" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Section 2: Learning Objectives */}
                  <Card className="p-6 space-y-4 border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Target className="text-emerald-500" size={18} />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">Learning Objectives & Outcomes</h4>
                          <p className="text-[11px] text-slate-400 font-medium">What core skills, tools, or knowledge will students gain from this course?</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addOutcome}
                        className="text-xs"
                      >
                        <Plus size={13} className="mr-1" /> Add Objective
                      </Button>
                    </div>

                    <div className="space-y-2.5">
                      {courseInfoForm.learning_outcomes.map((outcome, idx) => (
                        <div key={idx} className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black flex-shrink-0 border border-emerald-200">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={outcome}
                            onChange={(e) => updateOutcome(idx, e.target.value)}
                            placeholder="e.g. Understand relational database design and write complex SQL queries"
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50 focus:bg-white transition-all"
                          />
                          {courseInfoForm.learning_outcomes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOutcome(idx)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                              title="Remove objective"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 italic">
                      💡 Tip: Well-articulated learning objectives are displayed on the course catalog and student enrollment page. At least 1 outcome is required for publication.
                    </p>
                  </Card>

                  {/* Section 3: Course Details */}
                  <Card className="p-6 space-y-4 border border-slate-200">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <FileText className="text-purple-500" size={18} />
                      <h4 className="font-extrabold text-sm text-slate-900">General Course Information</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700">Course Title *</label>
                        <input
                          type="text"
                          value={courseInfoForm.title}
                          onChange={(e) => setCourseInfoForm({ ...courseInfoForm, title: e.target.value })}
                          placeholder="Course Title"
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-slate-900"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Category</label>
                        <select
                          value={courseInfoForm.category}
                          onChange={(e) => setCourseInfoForm({ ...courseInfoForm, category: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 bg-white"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Difficulty Level</label>
                        <select
                          value={courseInfoForm.level}
                          onChange={(e) => setCourseInfoForm({ ...courseInfoForm, level: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 bg-white"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="All Levels">All Levels</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Language</label>
                        <input
                          type="text"
                          value={courseInfoForm.language}
                          onChange={(e) => setCourseInfoForm({ ...courseInfoForm, language: e.target.value })}
                          placeholder="e.g. English, Bengali"
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Estimated Duration (Hours)</label>
                        <input
                          type="number"
                          value={courseInfoForm.estimated_hours || ''}
                          onChange={(e) => setCourseInfoForm({ ...courseInfoForm, estimated_hours: Number(e.target.value) })}
                          placeholder="e.g. 25"
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700">Short Summary</label>
                        <input
                          type="text"
                          value={courseInfoForm.short_description}
                          onChange={(e) => setCourseInfoForm({ ...courseInfoForm, short_description: e.target.value })}
                          placeholder="A punchy one-sentence summary for catalog cards..."
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700">Full Description</label>
                        <textarea
                          rows={4}
                          value={courseInfoForm.description}
                          onChange={(e) => setCourseInfoForm({ ...courseInfoForm, description: e.target.value })}
                          placeholder="Provide a comprehensive syllabus overview, course roadmap, and details..."
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 resize-none font-sans leading-relaxed"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Section 4: Prerequisites */}
                  <Card className="p-6 space-y-4 border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="text-amber-500" size={18} />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">Course Prerequisites</h4>
                          <p className="text-[11px] text-slate-400 font-medium">Prior knowledge, requirements, or tools recommended before taking this course.</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addPrerequisite}
                        className="text-xs"
                      >
                        <Plus size={13} className="mr-1" /> Add Prerequisite
                      </Button>
                    </div>

                    <div className="space-y-2.5">
                      {courseInfoForm.prerequisites.map((prereq, idx) => (
                        <div key={idx} className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black flex-shrink-0 border border-amber-200">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={prereq}
                            onChange={(e) => updatePrerequisite(idx, e.target.value)}
                            placeholder="e.g. Basic understanding of programming principles"
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50 focus:bg-white transition-all"
                          />
                          {courseInfoForm.prerequisites.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePrerequisite(idx)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                              title="Remove prerequisite"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Bottom Save Bar */}
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="text-xs text-slate-500 font-medium">
                      Make sure to save before navigating or running publication checks.
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveStep(1)}
                      >
                        Go to Curriculum
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="!bg-slate-900 px-5"
                        onClick={handleSaveCourseInfo}
                        disabled={savingCourseInfo}
                      >
                        {savingCourseInfo ? (
                          <>
                            <Loader2 size={14} className="animate-spin mr-1.5" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save size={14} className="mr-1.5" /> Save Course Info
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Assessments Overview */}
              {activeStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                        <HelpCircle className="text-purple-600" size={20} /> Course Assessments (Quizzes & Assignments)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Overview of all quizzes and assignments configured across your modules.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate('/instructor/quizzes')}>
                        Quizzes Manager
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate('/instructor/assignments')}>
                        Assignments Manager
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Quizzes list */}
                    <Card className="p-5 space-y-3 border border-slate-200">
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <HelpCircle className="text-purple-600" size={16} /> Course Quizzes
                      </h4>
                      {course.modules?.flatMap((m: any) => m.quizzes || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">No quizzes created yet. Add quizzes in Curriculum modules.</p>
                      ) : (
                        <div className="space-y-2">
                          {course.modules?.flatMap((m: any) => (m.quizzes || []).map((q: any) => ({ ...q, moduleTitle: m.title }))).map((q: any) => (
                            <div key={q.id} className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-slate-900">{q.title}</p>
                                <span className="text-[10px] text-purple-700 font-semibold">{q.moduleTitle} • Pass: {q.passing_score}%</span>
                              </div>
                              <Badge variant="default" className="text-[9px] uppercase font-bold">{q.status || 'draft'}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Assignments list */}
                    <Card className="p-5 space-y-3 border border-slate-200">
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <FileText className="text-indigo-600" size={16} /> Course Assignments
                      </h4>
                      {course.modules?.flatMap((m: any) => m.assignments || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">No assignments created yet. Add assignments in Curriculum modules.</p>
                      ) : (
                        <div className="space-y-2">
                          {course.modules?.flatMap((m: any) => (m.assignments || []).map((a: any) => ({ ...a, moduleTitle: m.title }))).map((a: any) => (
                            <div key={a.id} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-slate-900">{a.title}</p>
                                <span className="text-[10px] text-indigo-700 font-semibold">{a.moduleTitle} • {a.total_marks || 100} Marks</span>
                              </div>
                              <Badge variant="default" className="text-[9px] uppercase font-bold">{a.status || 'draft'}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              )}

              {/* Step 3: Preview */}
              {activeStep === 3 && (
                <Card className="text-center py-16 space-y-4 border border-slate-200">
                  <Eye className="mx-auto text-blue-500" size={48} />
                  <div>
                    <h4 className="text-base font-black text-slate-900">Student Course Experience Preview</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Experience this course exactly as enrolled students see it, including video playback, reading materials, quizzes, and locked module progression.
                    </p>
                  </div>
                  <div>
                    <Button variant="primary" className="!bg-slate-900" onClick={() => navigate(`/student/courses/${course.id}`)}>
                      <Eye size={14} className="mr-2" /> Launch Student Preview
                    </Button>
                  </div>
                </Card>
              )}

              {/* Step 4: Publish Portal */}
              {activeStep === 4 && (
                <Card className="p-8 space-y-6 border border-slate-200 text-center max-w-xl mx-auto">
                  <CheckCircle2 className="mx-auto text-slate-900" size={48} />
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Publication Quality Verification</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Run dynamic validation checks to ensure your title, thumbnail, learning objectives, modules, and lessons meet all standards before publishing live.
                    </p>
                  </div>
                  <div>
                    <Button variant="primary" className="!bg-slate-900 px-6 py-3" onClick={handlePublishCheck}>
                      <ShieldAlert size={16} className="mr-2 text-amber-400" /> Run Publish Verification
                    </Button>
                  </div>
                </Card>
              )}

            </>
          )}

        </div>

      </div>

      {/* ── MODULE CREATION MODAL ── */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModuleModal(false)} />
          <Card className="relative w-full max-w-md space-y-4 z-10 animate-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900">{editingModule ? 'Edit Module' : 'Add New Module'}</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Module Title *</label>
              <input
                type="text"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                placeholder="e.g. Chapter 1: Introduction to Web Design"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Description</label>
              <textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 resize-none"
                placeholder="Provide a brief summary of what's covered in this chapter..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Est. Duration (mins)</label>
                <input
                  type="number"
                  value={moduleForm.estimated_duration || ''}
                  onChange={(e) => setModuleForm({ ...moduleForm, estimated_duration: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Unlock Rule</label>
                <select
                  value={moduleForm.unlock_rule}
                  onChange={(e) => setModuleForm({ ...moduleForm, unlock_rule: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                >
                  <option value="always">Always open</option>
                  <option value="previous_completed">Prev complete</option>
                  <option value="specific_date">Specific Date</option>
                </select>
              </div>
            </div>

            {moduleForm.unlock_rule === 'specific_date' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Unlock Date</label>
                <input
                  type="date"
                  value={moduleForm.unlock_date}
                  onChange={(e) => setModuleForm({ ...moduleForm, unlock_date: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                />
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={moduleForm.required_for_certificate}
                onChange={(e) => setModuleForm({ ...moduleForm, required_for_certificate: e.target.checked })}
                className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-xs font-bold text-slate-700">Required for obtaining course certificate</span>
            </label>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowModuleModal(false)}>Cancel</Button>
              <Button variant="primary" className="!bg-slate-900" onClick={handleSaveModule} disabled={!moduleForm.title.trim()}>
                {editingModule ? 'Update' : 'Create'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── LESSON CREATION MODAL ── */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowLessonModal(null)} />
          <Card className="relative w-full max-w-lg space-y-4 z-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900">{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Lesson Title *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                  placeholder="e.g. 1.1 Intro to HTML"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Lesson Type</label>
                <select
                  value={lessonForm.type}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setLessonForm({
                      ...lessonForm,
                      type: nextType,
                      content: nextType === 'text' ? lessonForm.content : '',
                      video_url: '',
                      file_url: ''
                    });
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                >
                  <option value="video">🎥 Video Lesson</option>
                  <option value="text">✍️ Text Content</option>
                  <option value="pdf">📄 PDF Document</option>
                  <option value="ppt">📊 Slides (PPT)</option>
                  <option value="link">🔗 External URL</option>
                </select>
              </div>
            </div>

            {lessonForm.type === 'text' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Text Content / Study Notes</label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 resize-none font-mono"
                  placeholder="Study content in markdown or text..."
                />
              </div>
            )}

            {lessonForm.type !== 'text' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lessonForm.type === 'video' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Video Link (YouTube/Vimeo)</label>
                      <input
                        type="text"
                        value={lessonForm.video_url}
                        onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Or Upload Video File</label>
                      {lessonUploading ? (
                        <div className="flex items-center justify-center border border-slate-200 rounded-xl px-4 py-3 text-xs bg-slate-50/50 w-full h-[42px]">
                          <Loader2 size={14} className="text-slate-550 animate-spin mr-2" />
                          <span className="text-[10px] font-bold text-slate-500">Uploading video...</span>
                        </div>
                      ) : lessonForm.video_url && lessonForm.video_url.includes('/uploads/') ? (
                        <div className="flex items-center justify-between border border-emerald-250 rounded-xl px-4 py-2 text-xs bg-emerald-50/40 w-full h-[42px]">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <Check size={14} className="text-emerald-600 flex-shrink-0" />
                            <span className="text-[10px] font-bold text-slate-700 truncate" title={lessonForm.video_url.split('/').pop()}>
                              {lessonForm.video_url.split('/').pop() || 'Video uploaded'}
                            </span>
                          </div>
                          <label className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 cursor-pointer flex-shrink-0 ml-2">
                            Change
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleLessonFileUpload(e, 'video_url')}
                              accept="video/*"
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center border border-dashed border-slate-350 hover:border-slate-450 rounded-xl px-4 py-3 text-xs cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all w-full h-[42px]">
                          <Upload size={14} className="text-slate-500 mr-2" />
                          <span className="text-[10px] font-bold text-slate-600">Choose Video File</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleLessonFileUpload(e, 'video_url')}
                            accept="video/*"
                          />
                        </label>
                      )}
                    </div>
                  </>
                )}

                {(lessonForm.type === 'pdf' || lessonForm.type === 'ppt') && (
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Upload Lesson File *</label>
                    {lessonUploading ? (
                      <div className="flex items-center justify-center border border-slate-200 rounded-xl px-4 py-3 text-xs bg-slate-50/50 w-full h-[42px]">
                        <Loader2 size={14} className="text-slate-550 animate-spin mr-2" />
                        <span className="text-[10px] font-bold text-slate-500">Uploading file...</span>
                      </div>
                    ) : lessonForm.file_url ? (
                      <div className="flex items-center justify-between border border-emerald-250 rounded-xl px-4 py-2 text-xs bg-emerald-50/40 w-full h-[42px]">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Check size={14} className="text-emerald-600 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-slate-700 truncate" title={lessonForm.file_url.split('/').pop()}>
                            {lessonForm.file_url.split('/').pop() || 'File uploaded'}
                          </span>
                        </div>
                        <label className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 cursor-pointer flex-shrink-0 ml-2">
                          Change
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleLessonFileUpload(e, 'file_url')}
                            accept={getFileAcceptHeader(lessonForm.type)}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center border border-dashed border-slate-350 hover:border-slate-450 rounded-xl px-4 py-3 text-xs cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all w-full h-[42px]">
                        <Upload size={14} className="text-slate-500 mr-2" />
                        <span className="text-[10px] font-bold text-slate-600">Choose Local File</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleLessonFileUpload(e, 'file_url')}
                          accept={getFileAcceptHeader(lessonForm.type)}
                        />
                      </label>
                    )}
                  </div>
                )}

                {lessonForm.type === 'link' && (
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">External URL Link *</label>
                    <input
                      type="text"
                      value={lessonForm.file_url}
                      onChange={(e) => setLessonForm({ ...lessonForm, file_url: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Est. Study Duration (mins)</label>
                <input
                  type="number"
                  value={lessonForm.estimated_duration || ''}
                  onChange={(e) => setLessonForm({ ...lessonForm, estimated_duration: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer py-1 mt-6">
                <input
                  type="checkbox"
                  checked={lessonForm.required_completion}
                  onChange={(e) => setLessonForm({ ...lessonForm, required_completion: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-700">Required to mark complete</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowLessonModal(null)}>Cancel</Button>
              <Button variant="primary" className="!bg-slate-900" onClick={handleSaveLesson} disabled={!lessonForm.title.trim() || lessonUploading}>
                {editingLesson ? 'Update' : 'Add Lesson'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── RESOURCE CREATION MODAL ── */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowResourceModal(null)} />
          <Card className="relative w-full max-w-md space-y-4 z-10 animate-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900">{editingResource ? 'Edit Resource' : 'Add Study Resource'}</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Resource Title *</label>
              <input
                type="text"
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                placeholder="e.g. Cheat Sheet PDF"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Resource Type</label>
                <select
                  value={resourceForm.type}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    const wasLink = resourceForm.type === 'link';
                    const isLink = nextType === 'link';
                    const nextUrl = (wasLink !== isLink) ? '' : resourceForm.url;
                    setResourceForm({ ...resourceForm, type: nextType, url: nextUrl });
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                >
                  <option value="pdf">📄 PDF Document</option>
                  <option value="ppt">📊 Slides (PPT)</option>
                  <option value="document">📝 Text / Doc File</option>
                  <option value="video">🎥 Lecture video</option>
                  <option value="link">🔗 Web Reference Link</option>
                </select>
              </div>
              <div className="space-y-1.5">
                {resourceForm.type === 'link' ? (
                  <>
                    <label className="text-xs font-bold text-slate-500">URL / Download Link *</label>
                    <input
                      type="text"
                      value={resourceForm.url}
                      onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                      placeholder="https://..."
                    />
                  </>
                ) : (
                  <>
                    <label className="text-xs font-bold text-slate-500">Upload File *</label>
                    {uploading ? (
                      <div className="flex items-center justify-center border border-slate-200 rounded-xl px-4 py-3 text-xs bg-slate-50/50 w-full h-[42px]">
                        <div className="flex items-center gap-2">
                          <Loader2 size={14} className="text-slate-550 animate-spin" />
                          <span className="text-[10px] font-bold text-slate-500">Uploading file...</span>
                        </div>
                      </div>
                    ) : resourceForm.url ? (
                      <div className="flex items-center justify-between border border-emerald-250 rounded-xl px-4 py-2 text-xs bg-emerald-50/40 w-full h-[42px]">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Check size={14} className="text-emerald-600 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-slate-700 truncate" title={resourceForm.url.split('/').pop()}>
                            {resourceForm.url.split('/').pop() || 'File uploaded'}
                          </span>
                        </div>
                        <label className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 cursor-pointer flex-shrink-0 ml-2">
                          Change
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleResourceFileUpload}
                            accept={getFileAcceptHeader(resourceForm.type)}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center border border-dashed border-slate-350 hover:border-slate-450 rounded-xl px-4 py-3 text-xs cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all w-full h-[42px]">
                        <div className="flex items-center gap-2">
                          <Upload size={14} className="text-slate-500" />
                          <span className="text-[10px] font-bold text-slate-600">Choose File</span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleResourceFileUpload}
                          accept={getFileAcceptHeader(resourceForm.type)}
                        />
                      </label>
                    )}
                  </>
                )}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={resourceForm.downloadable}
                onChange={(e) => setResourceForm({ ...resourceForm, downloadable: e.target.checked })}
                className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-xs font-bold text-slate-700">Allow student to download this file directly</span>
            </label>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowResourceModal(null)}>Cancel</Button>
              <Button variant="primary" className="!bg-slate-900" onClick={handleSaveResource} disabled={!resourceForm.title.trim() || !resourceForm.url.trim() || uploading}>
                {editingResource ? 'Update' : 'Add Resource'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── QUIZ CREATION MODAL ── */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowQuizModal(null)} />
          <Card className="relative w-full max-w-md space-y-4 z-10 animate-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900">{editingQuiz ? 'Edit Quiz' : 'Add Module Quiz'}</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Quiz Title *</label>
              <input
                type="text"
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                placeholder="e.g. Chapter 1 Quiz"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Instructions</label>
              <textarea
                value={quizForm.instructions}
                onChange={(e) => setQuizForm({ ...quizForm, instructions: e.target.value })}
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 resize-none"
                placeholder="Instructions for students..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Time Limit (mins)</label>
                <input
                  type="number"
                  value={quizForm.time_limit}
                  onChange={(e) => setQuizForm({ ...quizForm, time_limit: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Passing Score (%)</label>
                <input
                  type="number"
                  value={quizForm.passing_score}
                  onChange={(e) => setQuizForm({ ...quizForm, passing_score: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Total Marks</label>
                <input
                  type="number"
                  value={quizForm.total_marks}
                  onChange={(e) => setQuizForm({ ...quizForm, total_marks: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Status</label>
                <select
                  value={quizForm.status}
                  onChange={(e) => setQuizForm({ ...quizForm, status: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowQuizModal(null)}>Cancel</Button>
              <Button variant="primary" className="!bg-slate-900" onClick={handleSaveQuiz} disabled={!quizForm.title.trim()}>
                {editingQuiz ? 'Update Quiz' : 'Add Quiz'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── ASSIGNMENT CREATION MODAL ── */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAssignmentModal(null)} />
          <Card className="relative w-full max-w-md space-y-4 z-10 animate-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900">{editingAssignment ? 'Edit Assignment' : 'Add Module Assignment'}</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Assignment Title *</label>
              <input
                type="text"
                value={assignmentForm.title}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                placeholder="e.g. Chapter 1 Practical Task"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Instructions / Description</label>
              <textarea
                value={assignmentForm.instructions}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 resize-none"
                placeholder="Explain the assignment requirements..."
              />
            </div>

            {/* Deadline Configuration */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Submission Deadline Schedule *
                </label>
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setAssignmentForm({ ...assignmentForm, deadline_type: 'days' })}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      assignmentForm.deadline_type === 'days'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Days after Enrollment (MOOC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentForm({ ...assignmentForm, deadline_type: 'date' })}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      assignmentForm.deadline_type === 'date'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Fixed Date
                  </button>
                </div>
              </div>

              {assignmentForm.deadline_type === 'days' ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={assignmentForm.due_days || ''}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, due_days: Number(e.target.value) })}
                      placeholder="10"
                      className="w-28 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-slate-900 dark:bg-slate-800"
                    />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">days after student's enrollment</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="date"
                    value={assignmentForm.due_date}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 dark:bg-slate-800"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Total Marks</label>
                <input
                  type="number"
                  value={assignmentForm.total_marks}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, total_marks: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-slate-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Submission Type</label>
                <select
                  value={assignmentForm.submission_type}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, submission_type: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-slate-900"
                >
                  <option value="both">Both File & Text</option>
                  <option value="file">File Upload Only</option>
                  <option value="text">Online Text Only</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Late Submission Policy</label>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="cb_allow_late"
                    checked={assignmentForm.allow_late}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, allow_late: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                  />
                  <label htmlFor="cb_allow_late" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Allow late submission
                  </label>
                </div>
              </div>
              {assignmentForm.allow_late ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Late Penalty (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={assignmentForm.late_penalty}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, late_penalty: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold outline-none focus:border-slate-900"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Status</label>
                  <select
                    value={assignmentForm.status}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold outline-none focus:border-slate-900"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              )}
            </div>

            {assignmentForm.allow_late && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Status</label>
                <select
                  value={assignmentForm.status}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, status: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-slate-900"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowAssignmentModal(null)}>Cancel</Button>
              <Button variant="primary" className="!bg-slate-900" onClick={handleSaveAssignment} disabled={!assignmentForm.title.trim()}>
                {editingAssignment ? 'Update Assignment' : 'Add Assignment'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── PUBLISH VERIFICATION CHECKLIST MODAL ── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowPublishModal(false)} />
          <Card className="relative w-full max-w-md space-y-4 z-10 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-slate-900">
              <ShieldAlert className="text-amber-500" size={24} />
              <h3 className="text-base font-black">Publish Course Verification</h3>
            </div>
            
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              We run dynamic quality controls on all MOOC courses before letting them go live. Please ensure all items in the checklist are valid.
            </p>

            <div className="space-y-2.5 py-2">
              {publishChecklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-700">{item.item}</span>
                  {item.passed ? (
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-800">
                      <Check size={12} />
                    </div>
                  ) : (
                    <div className="p-1 rounded-full bg-red-100 text-red-800">
                      <X size={12} strokeWidth={2.5} className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {canPublish ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={16} />
                <span className="text-xs font-bold text-emerald-950">Outstanding! Your course is ready to be published to students!</span>
              </div>
            ) : (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                <ShieldAlert className="text-red-600 flex-shrink-0" size={16} />
                <span className="text-xs font-bold text-red-950">You must resolve the missing items above before publishing.</span>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowPublishModal(false)}>Close</Button>
              <Button
                variant="primary"
                className="!bg-slate-900"
                onClick={handlePublish}
                disabled={!canPublish}
              >
                <Check size={14} /> Go Live Now
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── DELETE CONFIRMATION ── */}
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

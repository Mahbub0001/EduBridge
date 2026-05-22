/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, ChevronDown, ChevronRight, Search, Check,
  BookOpen, Layers, Award, Eye, FileText, Video, Link as LinkIcon,
  HelpCircle, Calendar, ShieldAlert, Sparkles, CheckCircle2, Clock,
  Upload, Loader2
} from 'lucide-react';
import {
  getMyInstructorCourses,
  getCourseBuilderData,
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
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';


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

  // Delete confirmations
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'module' | 'lesson' | 'resource'; id: string } | null>(null);

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

  // Deletions
  const triggerDelete = (type: 'module' | 'lesson' | 'resource', id: string) => {
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
    } catch {
      showToast('Failed to run publication checks.');
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
    if (course.modules && course.modules.length > 0) score += 20;
    return score;
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
                
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <Badge variant="info" className="bg-blue-900/40 text-blue-200 border-none font-bold text-[10px] uppercase">
                      {course.category}
                    </Badge>
                    <Badge variant="default" className="bg-slate-800 text-slate-300 border-none font-bold text-[10px] uppercase">
                      {course.level}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-black">{course.title}</h2>
                  <p className="text-xs text-slate-400 max-w-xl line-clamp-1">{course.short_description || course.description}</p>
                </div>

                <div className="flex flex-col items-end gap-1.5 relative z-10 w-full md:w-auto">
                  <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <span className="text-xs text-slate-400 font-bold">Building Progress</span>
                    <span className="text-xs font-black text-blue-400">{getBuildProgress()}%</span>
                  </div>
                  <div className="w-full md:w-44 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${getBuildProgress()}%` }} />
                  </div>
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
                        return (
                          <Card key={m.id} padding="none" className="overflow-hidden border border-slate-200">
                            
                            {/* Module Header Row */}
                            <div className="p-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors">
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

                                {/* Nested Lessons & Resources */}
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

                                  {/* Quizzes & Assignments indicators */}
                                  {m.quizzes && m.quizzes.length > 0 && (
                                    <div className="flex items-center gap-2 p-2.5 bg-purple-50/50 border border-purple-100 rounded-xl pl-4">
                                      <Award size={14} className="text-purple-600" />
                                      <span className="text-xs font-bold text-purple-900">Module contains {m.quizzes.length} Quizzes</span>
                                    </div>
                                  )}

                                  {m.assignments && m.assignments.length > 0 && (
                                    <div className="flex items-center gap-2 p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl pl-4">
                                      <FileText size={14} className="text-indigo-600" />
                                      <span className="text-xs font-bold text-indigo-900">Module contains {m.assignments.length} Assignments</span>
                                    </div>
                                  )}

                                  {(!m.lessons || m.lessons.length === 0) && (!m.resources || m.resources.length === 0) && (
                                    <p className="text-xs text-slate-400 font-medium italic text-center py-4">
                                      No lessons or resources in this module. Add one above.
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

              {/* Steps other than Curriculum (Placeholders for now) */}
              {activeStep !== 1 && (
                <Card className="text-center py-16">
                  <Sparkles className="mx-auto text-slate-400 animate-bounce" size={40} />
                  <h4 className="text-sm font-black text-slate-900 mt-4 uppercase tracking-wider">{STEPS[activeStep].label} Portal</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">This section is fully configured in the MOOC dashboard. Use the main Curriculum step to manage modules, lessons, and resources.</p>
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
                      <Trash2 size={12} className="w-3 h-3" />
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

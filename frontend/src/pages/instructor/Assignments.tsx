/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Plus, Edit2, Trash2, Search, CheckCircle2, ShieldAlert, Eye,
  FileText, Clock, AlertTriangle, ArrowLeft, Check, HelpCircle, User, Download, ExternalLink
} from 'lucide-react';
import { getMyInstructorCourses, getCourseModules } from '../../services/courseService';
import {
  getCourseAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  publishAssignment
} from '../../services/assignmentService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface RubricCriterion {
  name: string;
  description: string;
  max_marks: number;
}

export default function InstructorAssignments() {
  const [courses, setCourses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Selected course details
  const [assignments, setAssignments] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Editing state (null means list view)
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  const [rubrics, setRubrics] = useState<RubricCriterion[]>([]);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '', instructions: '', module_id: '', due_date: '', total_marks: 100,
    submission_type: 'both', allow_late: false, late_penalty: 10, allow_resubmission: true,
    accepted_file_types: '.pdf,.zip,.doc,.docx', max_file_size: '50MB', require_student_comment: false,
    status: 'draft'
  });

  // Grading state (null means not grading)
  const [gradingSubmissions, setGradingSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [gradingLoading, setGradingLoading] = useState(false);

  // Controls
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

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

  const loadCourseData = async (courseId: string) => {
    setLoadingAssignments(true);
    try {
      const aData = await getCourseAssignments(courseId);
      setAssignments(aData);
      
      const mData = await getCourseModules(courseId);
      setModules(mData);
    } catch {
      showToast('Failed to load course assignments', 'error');
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseData(selectedCourseId);
      setActiveAssignment(null);
      setSelectedSubmission(null);
      setGradingSubmissions([]);
    }
  }, [selectedCourseId]);

  // Rubric score calculation
  const rubricsTotal = rubrics.reduce((acc, curr) => acc + (curr.max_marks || 0), 0);

  // Add rubric criterion
  const addRubricCriterion = () => {
    setRubrics([...rubrics, { name: '', description: '', max_marks: 10 }]);
  };

  const updateRubricCriterion = (idx: number, field: keyof RubricCriterion, val: any) => {
    const updated = [...rubrics];
    updated[idx] = { ...updated[idx], [field]: field === 'max_marks' ? Number(val) : val };
    setRubrics(updated);
  };

  const removeRubricCriterion = (idx: number) => {
    setRubrics(rubrics.filter((_, i) => i !== idx));
  };

  // Launch Editor
  const openAssignmentEditor = (assign: any = null) => {
    setSelectedSubmission(null);
    setGradingSubmissions([]);
    if (assign) {
      setActiveAssignment(assign);
      setRubrics(assign.rubrics || []);
      setAssignmentForm({
        title: assign.title || '',
        instructions: assign.instructions || '',
        module_id: assign.module_id || '',
        due_date: assign.due_date ? assign.due_date.slice(0, 16) : '',
        total_marks: assign.total_marks || 100,
        submission_type: assign.submission_type || 'both',
        allow_late: assign.allow_late || false,
        late_penalty: assign.late_penalty || 10,
        allow_resubmission: assign.allow_resubmission !== undefined ? assign.allow_resubmission : true,
        accepted_file_types: assign.accepted_file_types || '.pdf,.zip,.doc,.docx',
        max_file_size: assign.max_file_size || '50MB',
        require_student_comment: assign.require_student_comment || false,
        status: assign.status || 'draft'
      });
    } else {
      setActiveAssignment({ id: 'new' });
      setRubrics([]);
      setAssignmentForm({
        title: '', instructions: '', module_id: '', due_date: '', total_marks: 100,
        submission_type: 'both', allow_late: false, late_penalty: 10, allow_resubmission: true,
        accepted_file_types: '.pdf,.zip,.doc,.docx', max_file_size: '50MB', require_student_comment: false,
        status: 'draft'
      });
    }
  };

  // Save Assignment
  const handleSaveAssignment = async () => {
    if (!assignmentForm.title.trim() || !selectedCourseId) return;

    if (rubrics.length > 0 && rubricsTotal !== assignmentForm.total_marks) {
      showToast(`Warning: Rubric total score (${rubricsTotal}) must equal Assignment Marks (${assignmentForm.total_marks})`, 'error');
      return;
    }

    try {
      const payload = { ...assignmentForm, rubrics };
      if (activeAssignment && activeAssignment.id !== 'new') {
        await updateAssignment(activeAssignment.id, payload);
        showToast('Assignment updated successfully!');
      } else {
        await createAssignment(selectedCourseId, payload);
        showToast('Assignment created successfully!');
      }
      setActiveAssignment(null);
      loadCourseData(selectedCourseId);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to save assignment', 'error');
    }
  };

  // Publish / Unpublish assignment
  const handlePublish = async (assign: any) => {
    const nextStatus = assign.status === 'published' ? 'draft' : 'published';
    try {
      await publishAssignment(assign.id, nextStatus);
      showToast(`Assignment successfully ${nextStatus === 'published' ? 'published' : 'unpublished'}!`);
      loadCourseData(selectedCourseId!);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Validation failed. Check title, instructions, due date and marks.', 'error');
    }
  };

  // Trigger Delete
  const handleDelete = async () => {
    if (!deleteConfirmId || !selectedCourseId) return;
    try {
      await deleteAssignment(deleteConfirmId);
      showToast('Assignment deleted successfully');
      loadCourseData(selectedCourseId);
      setDeleteConfirmId(null);
    } catch {
      showToast('Failed to delete assignment', 'error');
    }
  };

  // Submissions Viewer
  const viewSubmissions = async (assign: any) => {
    setActiveAssignment(assign);
    setSelectedSubmission(null);
    setGradingLoading(true);
    try {
      const data = await getAssignmentSubmissions(assign.id);
      setGradingSubmissions(data);
    } catch {
      showToast('Failed to load student submissions', 'error');
    } finally {
      setGradingLoading(false);
    }
  };

  // Open Grade Card
  const openGradingCard = (sub: any) => {
    setSelectedSubmission(sub);
    setGradeScore(sub.score || 0);
    setGradeFeedback(sub.feedback || '');
    
    // Prefill rubric scores
    const rScores: Record<string, number> = {};
    if (sub.rubric_scores) {
      sub.rubric_scores.forEach((rs: any) => {
        rScores[rs.criterion_name] = rs.score || 0;
      });
    } else {
      activeAssignment.rubrics?.forEach((r: any) => {
        rScores[r.name] = 0;
      });
    }
    setRubricScores(rScores);
  };

  // Grade rubric criteria changes
  const handleRubricScoreChange = (critName: string, val: number, maxScore: number) => {
    const clampedVal = Math.min(Math.max(0, val), maxScore);
    const updated = { ...rubricScores, [critName]: clampedVal };
    setRubricScores(updated);
    
    // Re-calculate sum score
    const total = Object.values(updated).reduce((acc, curr) => acc + curr, 0);
    setGradeScore(total);
  };

  // Grade submitter
  const handleGradeSubmission = async (status: 'graded' | 'revision') => {
    if (!selectedSubmission) return;
    try {
      const rScoresPayload = Object.entries(rubricScores).map(([name, score]) => ({
        criterion_name: name,
        score
      }));

      await gradeSubmission(selectedSubmission.id, {
        score: gradeScore,
        feedback: gradeFeedback,
        rubric_scores: rScoresPayload,
        status
      });

      showToast(status === 'graded' ? 'Grade published successfully!' : 'Returned to student for revision.');
      setSelectedSubmission(null);
      viewSubmissions(activeAssignment);
    } catch {
      showToast('Failed to save grade submission', 'error');
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-2 flex items-center gap-2 ${
          toastType === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
        }`}>
          {toastType === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Editor Banner or Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4">
        {activeAssignment ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveAssignment(null); setSelectedSubmission(null); setGradingSubmissions([]); }}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{gradingSubmissions.length > 0 ? `Submissions: ${activeAssignment.title}` : activeAssignment.id === 'new' ? 'Create Assignment' : `Edit: ${assignmentForm.title}`}</span>
                <Badge variant={activeAssignment.status === 'published' ? 'success' : 'default'} className="uppercase text-[9px] px-2 py-0.5 border-none font-bold">
                  {activeAssignment.status || 'draft'}
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Configure grading parameters, deadlines, and rubrics.</p>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-black text-slate-900">Assignment Management</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage tasks, rubrics, files, and grade student submissions.</p>
          </div>
        )}

        {activeAssignment && gradingSubmissions.length === 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePublish(activeAssignment)}>
              {assignmentForm.status === 'published' ? 'Unpublish Assignment' : 'Publish Assignment'}
            </Button>
            <Button variant="primary" size="sm" className="!bg-slate-900" onClick={handleSaveAssignment} disabled={!assignmentForm.title.trim()}>
              <Check size={14} /> Save Assignment
            </Button>
          </div>
        )}
      </div>

      {!activeAssignment ? (
        /* ───────────────── LIST VIEW ───────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Course Selector */}
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
                      onClick={() => setSelectedCourseId(c.id)}
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

          {/* Main List */}
          <div className="lg:col-span-3 space-y-4">
            {selectedCourseId ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    {courses.find(c => c.id === selectedCourseId)?.title} Assignments
                  </h3>
                  <Button variant="primary" size="sm" className="!bg-slate-900" onClick={() => openAssignmentEditor()}>
                    <Plus size={16} /> Add Assignment
                  </Button>
                </div>

                {loadingAssignments ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : assignments.length === 0 ? (
                  <Card className="text-center py-16 border-dashed border-2 border-slate-200">
                    <FileText className="mx-auto text-slate-350" size={40} />
                    <p className="text-slate-500 font-bold mt-4">No assignments yet. Create one to collect students files and tasks.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignments.map((a) => (
                      <Card key={a.id} className="border border-slate-200 hover:border-slate-350 transition-all flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                              {modules.find(m => m.id === a.module_id)?.title || 'General Tasks'}
                            </span>
                            <Badge variant={a.status === 'published' ? 'success' : 'default'} className="uppercase text-[8px] font-extrabold border-none">
                              {a.status}
                            </Badge>
                          </div>

                          <h4 className="text-sm font-black text-slate-900 line-clamp-1">{a.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2">{a.instructions || 'No instructions provided.'}</p>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                            <div className="flex flex-col">
                              <span className="text-slate-400">Total Marks</span>
                              <span className="text-slate-800 text-xs font-black">{a.total_marks || 100}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-slate-400">Submissions</span>
                              <span className="text-slate-800 text-xs font-black">{a.submissions_count || 0}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-slate-400">Graded</span>
                              <span className="text-slate-850 text-xs font-black">
                                {a.graded_count || 0} / <span className="text-slate-500">{a.submissions_count || 0}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 justify-end">
                          <Button variant="ghost" size="sm" className="!p-2 text-slate-600" onClick={() => viewSubmissions(a)}>
                            <User size={13} /> <span className="text-[10px] font-extrabold ml-1">Submissions</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="!p-2 text-slate-600" onClick={() => openAssignmentEditor(a)}>
                            <Edit2 size={13} /> <span className="text-[10px] font-extrabold ml-1">Edit</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="!p-2 text-slate-600" onClick={() => handlePublish(a)}>
                            <Eye size={13} /> <span className="text-[10px] font-extrabold ml-1">{a.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="!p-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteConfirmId(a.id)}>
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
                <FileText className="mx-auto text-slate-350" size={48} />
                <p className="text-slate-500 font-extrabold mt-4">Select a course to view and build assignments.</p>
              </Card>
            )}
          </div>

        </div>
      ) : gradingSubmissions.length > 0 ? (
        /* ───────────────── SUBMISSIONS GRADING SCREEN ───────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <Card className="lg:col-span-1 border border-slate-200 space-y-4 max-h-[600px] overflow-y-auto">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Student Papers</h3>
            {gradingLoading ? (
              <p className="text-xs text-slate-500">Loading student papers...</p>
            ) : gradingSubmissions.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold italic">No student submissions received yet.</p>
            ) : (
              <div className="space-y-2">
                {gradingSubmissions.map((sub) => {
                  const active = selectedSubmission?.id === sub.id;
                  const isLate = sub.submitted_at && activeAssignment.due_date && new Date(sub.submitted_at) > new Date(activeAssignment.due_date);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => openGradingCard(sub)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all border flex flex-col gap-1.5 ${
                        active ? 'bg-slate-900 border-transparent text-white' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-black line-clamp-1">{sub.student_name}</span>
                        <Badge variant={sub.status === 'graded' ? 'success' : 'warning'} className="text-[8px] uppercase">
                          {sub.status}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
                        <span className={active ? 'text-slate-400' : 'text-slate-500'}>
                          Score: {sub.score !== undefined ? `${sub.score}/${activeAssignment.total_marks}` : 'Not graded'}
                        </span>
                        {isLate && (
                          <span className="text-red-500 font-extrabold flex items-center gap-0.5">
                            <Clock size={10} /> Late
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Submission Detail Card & Grading Box */}
          <div className="lg:col-span-2">
            {selectedSubmission ? (
              <div className="space-y-6">
                
                {/* Paper Content */}
                <Card className="border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{selectedSubmission.student_name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedSubmission.student_email}</p>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex flex-col items-end">
                      <span>Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}</span>
                      {selectedSubmission.submitted_at && activeAssignment.due_date && new Date(selectedSubmission.submitted_at) > new Date(activeAssignment.due_date) && (
                        <span className="text-red-500 font-extrabold flex items-center gap-1 mt-1">
                          <AlertTriangle size={12} /> Late Submission (Penalty eligible)
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedSubmission.submission_text && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Written Answer / Submission Text:</span>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedSubmission.submission_text}
                      </div>
                    </div>
                  )}

                  {selectedSubmission.file_url && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Attached File / URL Link:</span>
                      <a
                        href={selectedSubmission.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-3 bg-blue-55 border border-blue-150 text-blue-800 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors w-fit"
                      >
                        <Download size={14} />
                        <span>Download Attachment File</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {selectedSubmission.student_comment && (
                    <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Student Comments:</span>
                      <p className="text-xs font-medium text-slate-600 italic mt-0.5">"{selectedSubmission.student_comment}"</p>
                    </div>
                  )}
                </Card>

                {/* Grading Panel */}
                <Card className="border border-slate-200 space-y-6">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">Grading & Feedback Card</h4>
                  
                  {activeAssignment.rubrics && activeAssignment.rubrics.length > 0 ? (
                    /* Rubric Assessment Builder */
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Rubrics Grading Criteria:</h5>
                      <div className="space-y-3">
                        {activeAssignment.rubrics.map((r: any, rIdx: number) => (
                          <div key={rIdx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-slate-800">{r.name}</span>
                              {r.description && <p className="text-[10px] text-slate-500 font-medium">{r.description}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score:</span>
                              <input
                                type="number"
                                max={r.max_marks}
                                min={0}
                                value={rubricScores[r.name] !== undefined ? rubricScores[r.name] : ''}
                                onChange={(e) => handleRubricScoreChange(r.name, Number(e.target.value), r.max_marks)}
                                className="w-16 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none text-center focus:border-slate-900"
                              />
                              <span className="text-xs font-bold text-slate-500">/ {r.max_marks} max</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Direct Grading */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500">Direct Grade Score *</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            max={activeAssignment.total_marks}
                            min={0}
                            value={gradeScore || ''}
                            onChange={(e) => setGradeScore(Number(e.target.value))}
                            className="w-24 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-slate-900"
                          />
                          <span className="text-sm font-bold text-slate-500">/ {activeAssignment.total_marks} marks</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Calculated summary */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 flex justify-between items-center">
                    <span className="text-xs font-bold">Total Grade Awarded:</span>
                    <span className="text-lg font-black">{gradeScore} / {activeAssignment.total_marks} Marks</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Feedback Comments for Student</label>
                    <textarea
                      rows={4}
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 resize-none"
                      placeholder="Provide helpful constructive feedback to guide the student's learning outcomes..."
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                    <Button variant="ghost" onClick={() => setSelectedSubmission(null)}>Cancel</Button>
                    <Button variant="outline" className="text-orange-650 hover:bg-orange-50 hover:text-orange-700 border-orange-200" onClick={() => handleGradeSubmission('revision')}>
                      Return for Revision
                    </Button>
                    <Button variant="primary" className="!bg-slate-900" onClick={() => handleGradeSubmission('graded')}>
                      Publish Grade Score
                    </Button>
                  </div>

                </Card>

              </div>
            ) : (
              <Card className="text-center py-20 border-dashed border-2 border-slate-200">
                <HelpCircle className="mx-auto text-slate-350" size={40} />
                <p className="text-slate-500 font-bold mt-4">Select a student submission paper from the list on the left to grade.</p>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* ───────────────── CREATE / EDIT ASSIGNMENT FORM ───────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parameters Panel */}
          <Card className="lg:col-span-2 space-y-6 border border-slate-200">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">Task Settings</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Assignment Title *</label>
                <input
                  type="text"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="e.g. Design Research Report: UX Principles"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Module Association</label>
                <select
                  value={assignmentForm.module_id}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, module_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 text-slate-700"
                >
                  <option value="">General Tasks (Not associated with a module)</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Instructions / Prompt *</label>
              <textarea
                rows={6}
                value={assignmentForm.instructions}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                placeholder="Type detailed assignments instructions, requirements, goals, and reference links..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Due Date and Time *</label>
                <input
                  type="datetime-local"
                  value={assignmentForm.due_date}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 text-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Total Score (Marks)</label>
                <input
                  type="number"
                  value={assignmentForm.total_marks || ''}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, total_marks: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 text-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Accepted Submission Type</label>
                <select
                  value={assignmentForm.submission_type}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, submission_type: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 text-slate-700"
                >
                  <option value="text">Text response only</option>
                  <option value="file">File attachment link only</option>
                  <option value="both">Both Text and File attachment</option>
                </select>
              </div>
            </div>

            {/* Submission limits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Late Submission</label>
                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={assignmentForm.allow_late}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, allow_late: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-700">Allow late submission</span>
                </label>
              </div>

              {assignmentForm.allow_late && (
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Late Penalty (%)</label>
                  <input
                    type="number"
                    value={assignmentForm.late_penalty}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, late_penalty: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-slate-900"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Resubmissions</label>
                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={assignmentForm.allow_resubmission}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, allow_resubmission: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-700">Allow student resubmissions</span>
                </label>
              </div>
            </div>

            {/* File Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Accepted File Types</label>
                <input
                  type="text"
                  value={assignmentForm.accepted_file_types}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, accepted_file_types: e.target.value })}
                  placeholder="e.g. .pdf,.zip"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Max File Size Helper</label>
                <input
                  type="text"
                  value={assignmentForm.max_file_size}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, max_file_size: e.target.value })}
                  placeholder="e.g. 50MB"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 block mb-2">Student Comments</label>
                <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
                  <input
                    type="checkbox"
                    checked={assignmentForm.require_student_comment}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, require_student_comment: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-700">Require student comments</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setActiveAssignment(null)}>Cancel</Button>
              <Button variant="primary" className="!bg-slate-900" onClick={handleSaveAssignment} disabled={!assignmentForm.title.trim()}>
                {activeAssignment.id === 'new' ? 'Create Assignment' : 'Save Assignment'}
              </Button>
            </div>
          </Card>

          {/* Rubric Builder Panel */}
          <Card className="lg:col-span-1 border border-slate-200 flex flex-col justify-between gap-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Rubrics Setup</h3>
                <Button variant="ghost" size="sm" className="!p-1.5 text-slate-900" onClick={addRubricCriterion}>
                  <Plus size={16} /> Add Criterion
                </Button>
              </div>

              {rubrics.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                  <HelpCircle className="mx-auto text-slate-400" size={24} />
                  <p className="text-xs text-slate-500 font-bold mt-2">No rubrics criteria established yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[450px] overflow-y-auto">
                  {rubrics.map((r, rIdx) => (
                    <div key={rIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3 relative">
                      <button
                        onClick={() => removeRubricCriterion(rIdx)}
                        className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-red-650 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="space-y-1.5 pr-6">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Criterion Name *</label>
                        <input
                          type="text"
                          value={r.name}
                          onChange={(e) => updateRubricCriterion(rIdx, 'name', e.target.value)}
                          placeholder="e.g. Code structure"
                          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-slate-900 bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Description</label>
                        <textarea
                          rows={2}
                          value={r.description}
                          onChange={(e) => updateRubricCriterion(rIdx, 'description', e.target.value)}
                          placeholder="Brief grading criteria rules..."
                          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-slate-900 resize-none bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Max Marks *</label>
                        <input
                          type="number"
                          value={r.max_marks}
                          onChange={(e) => updateRubricCriterion(rIdx, 'max_marks', e.target.value)}
                          className="w-24 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-slate-900 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rubrics validation indicators */}
            {rubrics.length > 0 && (
              <div className={`p-4 rounded-2xl border flex items-start gap-2.5 ${
                rubricsTotal === assignmentForm.total_marks
                  ? 'bg-emerald-50 border-emerald-250 text-emerald-800'
                  : 'bg-amber-50 border-amber-250 text-amber-800'
              }`}>
                {rubricsTotal === assignmentForm.total_marks ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />}
                <div className="text-[11px] font-bold">
                  <div>Rubric Marks total: <span className="underline">{rubricsTotal} pts</span></div>
                  {rubricsTotal !== assignmentForm.total_marks && (
                    <p className="font-medium mt-0.5">Warning: Setup total must match assignment marks ({assignmentForm.total_marks} pts).</p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Delete dialog */}
      {deleteConfirmId && (
        <ConfirmDialog
          open={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={handleDelete}
          title="Delete Assignment"
          message="Are you absolutely sure you want to delete this assignment and all of its associated submissions? This operation cannot be reversed."
        />
      )}
    </div>
  );
}

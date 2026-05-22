/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Search, Filter, CheckCircle2, ShieldAlert, FileText, Check, Clock, AlertTriangle,
  Download, ExternalLink, Award, RefreshCw, X, Edit3
} from 'lucide-react';
import { getMyInstructorCourses } from '../../services/courseService';
import {
  getInstructorAllSubmissions,
  getInstructorSingleSubmission,
  gradeSubmission,
  returnSubmission
} from '../../services/assignmentService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function InstructorSubmissions() {
  const [courses, setCourses] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, 7days, 30days

  // Selected Submission detail Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [internalNote, setInternalNote] = useState<string>('');
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Controls
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [confirmPublish, setConfirmPublish] = useState<boolean>(false);
  const [returnConfirm, setReturnConfirm] = useState<boolean>(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const cData = await getMyInstructorCourses();
      setCourses(cData);
      
      const sData = await getInstructorAllSubmissions();
      setSubmissions(sData);
    } catch {
      showToast('Failed to retrieve student submissions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter calculations
  const filteredSubmissions = submissions.filter((sub) => {
    // Course match
    if (selectedCourseId && sub.course_id !== selectedCourseId) return false;
    
    // Assignment match
    if (selectedAssignmentId && sub.assignment_id !== selectedAssignmentId) return false;
    
    // Status match
    if (selectedStatus !== 'all') {
      const isLate = sub.submitted_at && sub.due_date && new Date(sub.submitted_at) > new Date(sub.due_date);
      if (selectedStatus === 'late' && !isLate) return false;
      if (selectedStatus === 'submitted' && sub.status !== 'pending' && sub.status !== 'submitted') return false;
      if (selectedStatus === 'graded' && sub.status !== 'graded') return false;
      if (selectedStatus === 'returned' && sub.status !== 'revision') return false;
    }

    // Search query match
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      const name = (sub.student_name || '').toLowerCase();
      const email = (sub.student_email || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q)) return false;
    }

    // Date range filter
    if (dateFilter !== 'all') {
      if (!sub.submitted_at) return false;
      const diffTime = Math.abs(new Date().getTime() - new Date(sub.submitted_at).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (dateFilter === '7days' && diffDays > 7) return false;
      if (dateFilter === '30days' && diffDays > 30) return false;
    }

    return true;
  });

  // Extract unique assignments from courses taught
  const filteredAssignments = submissions
    .filter(s => !selectedCourseId || s.course_id === selectedCourseId)
    .reduce((acc: any[], curr: any) => {
      if (!acc.find(a => a.id === curr.assignment_id)) {
        acc.push({ id: curr.assignment_id, title: curr.assignment_title });
      }
      return acc;
    }, []);

  // KPI Calculations
  const kpis = {
    total: filteredSubmissions.length,
    pending: filteredSubmissions.filter(s => s.status === 'pending' || s.status === 'submitted').length,
    late: filteredSubmissions.filter(s => s.submitted_at && s.due_date && new Date(s.submitted_at) > new Date(s.due_date)).length,
    graded: filteredSubmissions.filter(s => s.status === 'graded').length
  };

  // Open Drawer
  const openDrawer = async (sub: any) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const detailed = await getInstructorSingleSubmission(sub.id);
      setSelectedSub(detailed);
      setFeedback(detailed.feedback || '');
      setInternalNote(detailed.internal_note || '');
      
      // Rubrics mapping
      const rScores: Record<string, number> = {};
      if (detailed.rubric_scores) {
        detailed.rubric_scores.forEach((rs: any) => {
          rScores[rs.criterion_name] = rs.score || 0;
        });
      } else {
        detailed.rubrics?.forEach((rub: any) => {
          rScores[rub.name] = 0;
        });
      }
      setRubricScores(rScores);
      setGradeScore(detailed.score || 0);
    } catch {
      showToast('Failed to load detailed submission card.', 'error');
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Score Slider adjustment
  const handleRubricScoreChange = (critName: string, val: number, maxScore: number) => {
    const clampedVal = Math.min(Math.max(0, val), maxScore);
    const updated = { ...rubricScores, [critName]: clampedVal };
    setRubricScores(updated);
    
    // Aggregated score sum
    const total = Object.values(updated).reduce((acc, curr) => acc + curr, 0);
    setGradeScore(total);
  };

  // Submits Grade Publish
  const handlePublishGrade = async () => {
    if (!selectedSub) return;
    try {
      const rScoresPayload = Object.entries(rubricScores).map(([name, score]) => ({
        criterion_name: name,
        score
      }));

      await gradeSubmission(selectedSub.id, {
        score: gradeScore,
        feedback,
        rubric_scores: rScoresPayload,
        internal_note: internalNote,
        status: 'graded'
      });

      showToast('Grade score published successfully!');
      setConfirmPublish(false);
      setDrawerOpen(false);
      loadData();
    } catch {
      showToast('Failed to grade paper.', 'error');
    }
  };

  // Return to student for revision
  const handleReturnRevision = async () => {
    if (!selectedSub) return;
    try {
      await returnSubmission(selectedSub.id, feedback || 'Revision requested. Please check instructions.');
      showToast('Returned to student for revision.');
      setReturnConfirm(false);
      setDrawerOpen(false);
      loadData();
    } catch {
      showToast('Failed to return submission', 'error');
    }
  };

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

      {/* Title */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900">Student Submissions</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Review papers, grade dynamically using rubrics, and publish scores.</p>
        </div>
        <Button variant="ghost" size="sm" className="!p-2.5 hover:bg-slate-50 text-slate-700" onClick={loadData}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* KPI Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Papers', val: kpis.total, icon: FileText, color: 'text-blue-500 bg-blue-50' },
          { label: 'Pending Grading', val: kpis.pending, icon: Clock, color: 'text-amber-500 bg-amber-50' },
          { label: 'Late Submissions', val: kpis.late, icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
          { label: 'Graded Papers', val: kpis.graded, icon: Award, color: 'text-emerald-500 bg-emerald-50' }
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <Card key={i} className="border border-slate-200 p-4 flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${k.color}`}>
                <Icon size={18} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{k.label}</span>
                <p className="text-lg font-black text-slate-900 leading-none mt-1">{loading ? '...' : k.val}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters Row */}
      <Card className="border border-slate-200 p-4 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Filter size={14} className="text-slate-500" />
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Search & Filters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Course Selection</label>
            <select
              value={selectedCourseId}
              onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedAssignmentId(''); }}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
            >
              <option value="">All Courses taught</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Assignment</label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
            >
              <option value="">All Assignments</option>
              {filteredAssignments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Submission Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
            >
              <option value="all">All statuses</option>
              <option value="submitted">Pending grading</option>
              <option value="late">Late papers</option>
              <option value="graded">Graded papers</option>
              <option value="returned">Revision / Returned</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Submission Recency</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
            >
              <option value="all">All submission times</option>
              <option value="7days">Submitted past 7 days</option>
              <option value="30days">Submitted past 30 days</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Search student</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search name/email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
              />
            </div>
          </div>

        </div>
      </Card>

      {/* Main Submissions Table */}
      <Card className="border border-slate-200 p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto text-slate-300 animate-bounce" size={40} />
            <p className="text-slate-500 font-extrabold mt-4">No submissions found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Student</th>
                  <th className="py-4 px-3">Course / task</th>
                  <th className="py-4 px-3">Submitted</th>
                  <th className="py-4 px-3">Status</th>
                  <th className="py-4 px-3">Score</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredSubmissions.map((sub) => {
                  const isLate = sub.submitted_at && sub.due_date && new Date(sub.submitted_at) > new Date(sub.due_date);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border flex items-center justify-center font-black text-slate-600 text-xs flex-shrink-0">
                            {sub.student_name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 leading-none">{sub.student_name}</div>
                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">{sub.student_email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 max-w-[220px]">
                        <span className="font-extrabold uppercase text-[9px] text-slate-400 tracking-wider block">{sub.course_title}</span>
                        <span className="text-slate-800 line-clamp-1 mt-0.5">{sub.assignment_title}</span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex flex-col">
                          <span>{new Date(sub.submitted_at).toLocaleDateString()}</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">{new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant={sub.status === 'graded' ? 'success' : sub.status === 'revision' ? 'default' : 'warning'} className="text-[8px] uppercase">
                            {sub.status === 'revision' ? 'Returned' : sub.status === 'graded' ? 'Graded' : 'Submitted'}
                          </Badge>
                          {isLate && (
                            <span className="text-red-500 text-[8px] font-black uppercase tracking-wide flex items-center gap-0.5">
                              <AlertTriangle size={8} /> Late submission
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        {sub.status === 'graded' ? (
                          <span className="text-xs font-black text-slate-900">{sub.score} / <span className="text-slate-500">{sub.total_marks || 100}</span></span>
                        ) : (
                          <span className="text-slate-400 font-medium">--</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="sm" className="!px-3 !py-1 text-slate-700 hover:bg-slate-100" onClick={() => openDrawer(sub)}>
                            <Edit3 size={12} className="mr-1" />
                            <span>Grade paper</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── HIGH FIDELITY GRADING DRAWER ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setDrawerOpen(false)} />
          
          {/* Drawer Body */}
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Submissions Grade Card</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">EduBridge Evaluation System</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {drawerLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
                  ))}
                </div>
              ) : selectedSub ? (
                <div className="space-y-6">
                  
                  {/* Student profile card */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                      {selectedSub.student_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-950">{selectedSub.student_name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedSub.student_email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="default" className="text-[8px] uppercase">{selectedSub.course_title}</Badge>
                        <span className="text-[10px] font-bold text-slate-400">/</span>
                        <span className="text-[10px] font-extrabold text-slate-600 line-clamp-1">{selectedSub.assignment_title}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission deadlines */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-extrabold uppercase tracking-wide p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="flex flex-col gap-1 text-slate-400">
                      <span>Submitted Time</span>
                      <span className="text-slate-800 text-xs font-black">{new Date(selectedSub.submitted_at).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-slate-400">
                      <span>Deadline Status</span>
                      {selectedSub.submitted_at && selectedSub.due_date && new Date(selectedSub.submitted_at) > new Date(selectedSub.due_date) ? (
                        <span className="text-red-500 text-xs font-black flex items-center gap-0.5">
                          <AlertTriangle size={12} /> Late submission
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-xs font-black flex items-center gap-0.5">
                          <CheckCircle2 size={12} /> On-Time Submission
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Written Answer */}
                  {selectedSub.submission_text && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Student Response Paper:</span>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedSub.submission_text}
                      </div>
                    </div>
                  )}

                  {/* Attachment File */}
                  {selectedSub.file_url && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Attachment Link / Link:</span>
                      <a
                        href={selectedSub.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-3.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors w-fit"
                      >
                        <Download size={14} />
                        <span>Download Attachment File</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {/* Rubric evaluation criteria */}
                  {selectedSub.rubrics && selectedSub.rubrics.length > 0 ? (
                    <div className="space-y-4">
                      <h5 className="text-xs font-extrabold text-slate-750 uppercase tracking-widest">Rubrics Grading Parameters:</h5>
                      <div className="space-y-3">
                        {selectedSub.rubrics.map((rub: any, rIdx: number) => (
                          <div key={rIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-xs font-black text-slate-905">{rub.name}</span>
                                {rub.description && <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">{rub.description}</p>}
                              </div>
                              <span className="text-xs font-bold text-slate-500">/ {rub.max_marks} pts</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min={0}
                                max={rub.max_marks}
                                value={rubricScores[rub.name] || 0}
                                onChange={(e) => handleRubricScoreChange(rub.name, Number(e.target.value), rub.max_marks)}
                                className="flex-1 accent-slate-900 cursor-pointer h-1 bg-slate-200 rounded-lg"
                              />
                              <input
                                type="number"
                                min={0}
                                max={rub.max_marks}
                                value={rubricScores[rub.name] !== undefined ? rubricScores[rub.name] : ''}
                                onChange={(e) => handleRubricScoreChange(rub.name, Number(e.target.value), rub.max_marks)}
                                className="w-16 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-black text-center outline-none focus:border-slate-900"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Direct Grading */
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Direct Grade Score *</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          max={selectedSub.total_marks || 100}
                          min={0}
                          value={gradeScore || ''}
                          onChange={(e) => setGradeScore(Number(e.target.value))}
                          className="w-24 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus:border-slate-900"
                        />
                        <span className="text-xs font-bold text-slate-500">/ {selectedSub.total_marks || 100} marks max score</span>
                      </div>
                    </div>
                  )}

                  {/* score sum display card */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center shadow-md">
                    <span className="text-xs font-bold">Accumulated Grade Score:</span>
                    <span className="text-base font-black">{gradeScore} / {selectedSub.total_marks || 100} pts</span>
                  </div>

                  {/* Feedback Comments */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Feedback Comments for Student</label>
                    <textarea
                      rows={4}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Type constructive evaluation feedback..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 resize-none"
                    />
                  </div>

                  {/* Optional private internal note */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Private Internal Note (Only visible to Instructors)</label>
                    <textarea
                      rows={2}
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="e.g. Student showed exceptional code quality but missed deadline. Late penalty adjusted."
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-slate-900 resize-none bg-slate-50/50"
                    />
                  </div>

                </div>
              ) : null}
            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>Cancel</Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-orange-650 hover:bg-orange-50 hover:text-orange-700 border-orange-200" onClick={() => setReturnConfirm(true)}>
                  Return for Revision
                </Button>
                <Button variant="primary" size="sm" className="!bg-slate-900" onClick={() => setConfirmPublish(true)}>
                  <Check size={14} /> Publish Grade
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Grade Publish Dialog */}
      {confirmPublish && (
        <ConfirmDialog
          open={confirmPublish}
          onClose={() => setConfirmPublish(false)}
          onConfirm={handlePublishGrade}
          title="Publish Grade"
          message={`Are you ready to publish the score of ${gradeScore}/${selectedSub?.total_marks || 100} to ${selectedSub?.student_name}? This score will become visible to the student immediately.`}
        />
      )}

      {/* Revision Dialog */}
      {returnConfirm && (
        <ConfirmDialog
          open={returnConfirm}
          onClose={() => setReturnConfirm(false)}
          onConfirm={handleReturnRevision}
          title="Return for Revision"
          message="Are you sure you want to return this paper to the student for revision? They will be allowed to resubmit in accordance with settings."
        />
      )}
    </div>
  );
}

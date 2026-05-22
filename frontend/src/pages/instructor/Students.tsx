/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Users, Search, Filter, Mail, CheckCircle2, ShieldAlert,
  User, BookOpen, Clock, AlertTriangle, ChevronRight, X,
  GraduationCap, Award, Save, Edit3, Loader2, Sparkles
} from 'lucide-react';
import { getMyInstructorCourses } from '../../services/courseService';
import {
  getInstructorStudentsList,
  getInstructorStudentProgress,
  sendStudentReminder,
  saveStudentPrivateNotes
} from '../../services/instructorService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';

export default function InstructorStudents() {
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected student progress detail (drawer)
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [, setDetailLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Send reminder modal/dialog
  const [reminderStudent, setReminderStudent] = useState<any | null>(null);
  const [reminderText, setReminderText] = useState('');
  const [reminderSending, setReminderSending] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, sList] = await Promise.all([
        getMyInstructorCourses(),
        getInstructorStudentsList()
      ]);
      setCourses(cList);
      setStudents(sList);
    } catch {
      showToast('Failed to load student tracking data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetail = async (studentId: string, courseId: string) => {
    setDetailLoading(true);
    setSelectedStudent(null);
    try {
      const details = await getInstructorStudentProgress(studentId, courseId);
      setSelectedStudent(details);
      setNoteText(details.instructor_notes || '');
    } catch {
      showToast('Failed to load student progress details.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedStudent) return;
    setNoteSaving(true);
    try {
      await saveStudentPrivateNotes(selectedStudent.student.id, selectedStudent.quiz_attempts[0]?.course_id || selectedStudent.assignments[0]?.course_id || selectedCourseId || students.find(s => s.id === selectedStudent.student.id)?.course_id, noteText);
      showToast('Private instructor notes successfully saved!');
    } catch {
      showToast('Failed to save private notes.', 'error');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleOpenReminder = (student: any) => {
    setReminderStudent(student);
    setReminderText(`Hi ${student.name}! Your instructor noticed you haven't completed your syllabus progress in "${student.course_title}". Log back in to continue learning!`);
  };

  const handleSendReminder = async () => {
    if (!reminderStudent) return;
    setReminderSending(true);
    try {
      await sendStudentReminder(reminderStudent.id, reminderStudent.course_id, reminderText);
      showToast(`Friendly progress reminder successfully dispatched to ${reminderStudent.name}!`);
      setReminderStudent(null);
    } catch {
      showToast('Failed to send progress reminder.', 'error');
    } finally {
      setReminderSending(false);
    }
  };

  // Filter logic
  const filteredStudents = students.filter((s) => {
    if (selectedCourseId && s.course_id !== selectedCourseId) return false;
    
    // Status filter
    if (selectedStatus === 'not-started' && s.progress > 0) return false;
    if (selectedStatus === 'completed' && s.progress < 100) return false;
    if (selectedStatus === 'in-progress' && (s.progress === 0 || s.progress === 100)) return false;
    if (selectedStatus === 'at-risk' && s.progress >= 25) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const n = (s.name || '').toLowerCase();
      const e = (s.email || '').toLowerCase();
      if (!n.includes(q) && !e.includes(q)) return false;
    }
    return true;
  });

  // Analytics aggregation
  const totalStudents = filteredStudents.length;
  const activeStudents = filteredStudents.filter(s => s.progress > 0 && s.progress < 100).length;
  const completedStudents = filteredStudents.filter(s => s.progress === 100).length;
  const atRiskStudents = filteredStudents.filter(s => s.progress < 25).length;

  return (
    <div className="space-y-6">
      {/* Toast popup */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-2 flex items-center gap-2 ${
          toastType === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
        }`}>
          {toastType === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900">Enrolled Students</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Track learner progress, monitor at-risk cohorts, review quiz/assignment attempts, and email reminders.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', val: totalStudents, icon: Users, color: 'text-blue-500 bg-blue-50' },
          { label: 'Active Students', val: activeStudents, icon: Clock, color: 'text-amber-500 bg-amber-50' },
          { label: 'Completed Students', val: completedStudents, icon: GraduationCap, color: 'text-emerald-500 bg-emerald-50' },
          { label: 'At-risk Students', val: atRiskStudents, icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
        ].map((card, i) => (
          <Card key={i} className="flex items-center gap-4 border border-slate-200 p-4 bg-white">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon size={20} />
            </span>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{card.label}</p>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">{card.val}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters Toolbar */}
      <Card className="border border-slate-200 p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Filter size={14} className="text-slate-500" />
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Search & Filters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Filter by Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
            >
              <option value="">All courses taught</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Progress Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
            >
              <option value="all">All progress levels</option>
              <option value="not-started">Not Started (0%)</option>
              <option value="in-progress">In Progress (1-99%)</option>
              <option value="completed">Completed (100%)</option>
              <option value="at-risk">At Risk (&lt; 25%)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Search student</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid: Left student list card, right drawer slide-over panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Students list */}
        <div className={`space-y-4 ${selectedStudent ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card className="text-center py-20 border border-slate-200 bg-white">
              <Users className="mx-auto text-slate-300 animate-bounce" size={40} />
              <p className="text-slate-500 font-extrabold mt-4">No matching students found.</p>
            </Card>
          ) : (
            <Card className="border border-slate-200 overflow-hidden bg-white p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4">Progress %</th>
                      <th className="px-6 py-4">Quiz Avg</th>
                      <th className="px-6 py-4">Assignments</th>
                      <th className="px-6 py-4">Certificate</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => {
                      const isAtRisk = s.progress < 25;
                      const hasCert = s.certificate_status === 'Issued';
                      const hasPending = s.assignment_status === 'Pending Grading';
                      return (
                        <tr
                          key={`${s.id}-${s.course_id}`}
                          onClick={() => handleOpenDetail(s.id, s.course_id)}
                          className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                            selectedStudent?.student.id === s.id && selectedStudent?.modules[0]?.id === s.course_id ? 'bg-slate-50' : ''
                          }`}
                        >
                          <td className="px-6 py-4 flex items-center gap-3 min-w-[200px]">
                            {s.photo_url ? (
                              <img src={s.photo_url} alt={s.name} className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={16} /></div>
                            )}
                            <div>
                              <p className="text-sm font-black text-slate-900 leading-tight">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{s.email}</p>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="line-clamp-1 max-w-[150px] font-bold text-slate-800">{s.course_title}</span>
                          </td>

                          <td className="px-6 py-4 space-y-1 min-w-[120px]">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-extrabold text-slate-900">{s.progress}%</span>
                              {isAtRisk && <span className="text-red-500 font-black text-[8px] uppercase">At Risk</span>}
                            </div>
                            <ProgressBar value={s.progress} className={isAtRisk ? 'bg-red-500' : s.progress === 100 ? 'bg-emerald-500' : 'bg-slate-900'} />
                          </td>

                          <td className="px-6 py-4">
                            <Badge variant={s.quiz_average >= 80 ? 'success' : s.quiz_average >= 50 ? 'warning' : s.quiz_average > 0 ? 'danger' : 'default'} className="text-[9px] font-mono">
                              {s.quiz_average > 0 ? `${s.quiz_average}%` : 'N/A'}
                            </Badge>
                          </td>

                          <td className="px-6 py-4">
                            <Badge variant={hasPending ? 'warning' : s.assignment_status === 'Graded' ? 'success' : 'default'} className="text-[8px] uppercase">
                              {s.assignment_status}
                            </Badge>
                          </td>

                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1">
                              <Award size={14} className={hasCert ? 'text-emerald-500' : 'text-slate-300'} />
                              <span className={`text-[10px] font-bold ${hasCert ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>{s.certificate_status}</span>
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1.5">
                              <Button variant="ghost" size="sm" className="!p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" onClick={() => handleOpenDetail(s.id, s.course_id)}>
                                <ChevronRight size={14} />
                              </Button>
                              <Button variant="ghost" size="sm" className="!p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600" onClick={() => handleOpenReminder(s)}>
                                <Mail size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Selected student detail drawer */}
        {selectedStudent && (
          <div className="lg:col-span-6 space-y-4 animate-in slide-in-from-right-4 duration-200">
            <Card className="border border-slate-200 p-5 space-y-5 bg-white relative">
              
              {/* Close Drawer Button */}
              <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors">
                <X size={18} />
              </button>

              {/* Drawer Title Header */}
              <div className="pb-4 border-b border-slate-100 flex items-center gap-3">
                {selectedStudent.student.photo_url ? (
                  <img src={selectedStudent.student.photo_url} alt={selectedStudent.student.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={20} /></div>
                )}
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">{selectedStudent.student.name}</h2>
                  <p className="text-xs text-slate-400 font-semibold">{selectedStudent.student.email}</p>
                </div>
              </div>

              {/* Sub-grid metrics summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Progress</span>
                  <p className="text-sm font-black text-slate-900">{selectedStudent.progress_percent}%</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Discussions</span>
                  <p className="text-sm font-black text-slate-900">{selectedStudent.discussions_count} Posts</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Certificates</span>
                  <p className="text-xs font-black text-slate-900 mt-1">{selectedStudent.certificates.length > 0 ? 'Issued' : 'None'}</p>
                </div>
              </div>

              {/* Completed Modules list */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen size={13} className="text-slate-500" />
                  <span>Completed Modules</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedStudent.modules.map((m: any) => (
                    <div key={m.id} className="p-2.5 rounded-xl border border-slate-150 flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-800 line-clamp-1">{m.title}</span>
                      {m.is_completed ? (
                        <Badge variant="success" className="text-[8px] scale-90">Done</Badge>
                      ) : (
                        <Badge variant="default" className="text-[8px] scale-90">Pending</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quiz Attempts */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={13} className="text-slate-500" />
                  <span>Quiz Attempts</span>
                </h3>
                {selectedStudent.quiz_attempts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">No quizzes attempted in this course yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedStudent.quiz_attempts.map((qa: any) => (
                      <div key={qa.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-black text-slate-900">{qa.quiz_title}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{new Date(qa.attempted_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-800">{qa.score} / {qa.max_score}</p>
                          <Badge variant={qa.passed ? 'success' : 'danger'} className="text-[8px] scale-90 mt-0.5">
                            {qa.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assignment submissions */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Award size={13} className="text-slate-500" />
                  <span>Assignment Submissions</span>
                </h3>
                {selectedStudent.assignments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">No assignment submissions handed in yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedStudent.assignments.map((as: any) => (
                      <div key={as.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-slate-900">{as.assignment_title}</span>
                          <Badge variant={as.status === 'graded' ? 'success' : 'warning'} className="text-[8px] scale-90">
                            {as.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Grade: <strong className="text-slate-800 font-bold">{as.grade} / {as.max_grade}</strong></span>
                          <span>Handed in: {new Date(as.submitted_at).toLocaleDateString()}</span>
                        </div>
                        {as.feedback && (
                          <p className="text-[10px] text-slate-500 leading-relaxed bg-white border border-slate-100 p-2 rounded-lg italic">
                            &ldquo;{as.feedback}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Private Notes block */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 size={13} className="text-slate-500" />
                  <span>Private Instructor Notes</span>
                </h3>
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Write private notes about this student's performance (only visible to you)..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-slate-900 resize-none font-semibold text-slate-700"
                  />
                  <div className="flex justify-end">
                    <Button variant="primary" size="sm" onClick={handleSaveNotes} disabled={noteSaving} className="!bg-slate-950">
                      {noteSaving ? <Loader2 size={10} className="animate-spin mr-1" /> : <Save size={10} className="mr-1" />}
                      <span>Save Notes</span>
                    </Button>
                  </div>
                </div>
              </div>

            </Card>
          </div>
        )}

      </div>

      {/* Send Reminder Dialog Modal */}
      {reminderStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-md border border-slate-200 p-6 space-y-4 bg-white relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setReminderStudent(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900">
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Mail size={16} className="text-amber-500" />
              <h3 className="text-sm font-black text-slate-900">Send Progress Reminder</h3>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-black text-slate-800">Recurrent student</p>
              <p className="text-xs text-slate-500 font-semibold">{reminderStudent.name} ({reminderStudent.email})</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Reminder Message</label>
              <textarea
                rows={4}
                required
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-slate-900 font-semibold text-slate-700"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setReminderStudent(null)}>Cancel</Button>
              <Button variant="primary" size="sm" className="!bg-slate-950" onClick={handleSendReminder} disabled={reminderSending}>
                {reminderSending ? 'Sending...' : 'Dispatch Reminder'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

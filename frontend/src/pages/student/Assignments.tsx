import { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllAssignments, submitAssignment } from '../../services/assignmentService';
import type { Assignment } from '../../types';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    getAllAssignments().then(setAssignments).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    pending: assignments.filter((a) => a.status === 'pending').length,
    submitted: assignments.filter((a) => a.status === 'submitted').length,
    graded: assignments.filter((a) => a.status === 'graded').length,
    overdue: assignments.filter((a) => a.status === 'pending' && new Date(a.due_date) < new Date()).length,
  }), [assignments]);

  const totalPages = Math.max(1, Math.ceil(assignments.length / 5));
  const pageItems = assignments.slice(page * 5, (page + 1) * 5);

  const openSubmit = (a: Assignment) => {
    setSelectedAssignment(a);
    setSubmissionText('');
    setSubmitMsg('');
    setShowSubmitModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    setSubmitting(true);
    setSubmitMsg('');
    try {
      await submitAssignment(selectedAssignment.id, { submission_text: submissionText });
      setSubmitMsg('Assignment submitted successfully!');
      setAssignments((prev) =>
        prev.map((a) => (a.id === selectedAssignment.id ? { ...a, status: 'submitted' as const } : a))
      );
      setTimeout(() => setShowSubmitModal(false), 1500);
    } catch {
      setSubmitMsg('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading assignments...</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Assignments"
        description="Submit assignments, view grades, and check instructor feedback."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending" value={String(stats.pending).padStart(2, '0')} icon={AlertCircle} iconBg="bg-rose-50" iconColor="text-rose-600" />
        <StatCard label="Submitted" value={String(stats.submitted).padStart(2, '0')} icon={Clock} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Graded" value={String(stats.graded).padStart(2, '0')} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Overdue" value={String(stats.overdue).padStart(2, '0')} icon={Calendar} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/80 dark:border-slate-800">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">Assignment</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">Course</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">Due Date</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <p className="font-bold text-navy-900 dark:text-white">{item.title}</p>
                    {item.subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{item.course_name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4">
                    <Badge variant={item.status === 'pending' ? 'warning' : item.status === 'submitted' ? 'info' : 'success'}>
                      {item.status === 'pending' ? 'Pending' : item.status === 'submitted' ? 'Submitted' : `Graded ${item.grade || ''}`}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.status === 'pending' ? (
                      <Button variant="primary" size="sm" className="!bg-navy-900 dark:!bg-teal-600 dark:!text-white" onClick={() => openSubmit(item)}>Submit</Button>
                    ) : item.status === 'graded' ? (
                      <Button variant="outline" size="sm">View Grade</Button>
                    ) : (
                      <Button variant="ghost" size="sm">View</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {page + 1} of {totalPages} ({assignments.length} total)
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 dark:disabled:opacity-20">
              <ChevronLeft size={16} />
            </button>
            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 dark:disabled:opacity-20">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </Card>

      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg space-y-4">
            <h3 className="text-lg font-extrabold text-navy-900 dark:text-white">Submit: {selectedAssignment.title}</h3>
            {submitMsg && (
              <div className={`rounded-xl px-4 py-3 text-sm ${submitMsg.includes('success') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-rose-950/30 dark:text-rose-450'}`}>
                {submitMsg}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Your Submission</label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={6}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                placeholder="Write your submission here or paste a link to your work..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowSubmitModal(false)} disabled={submitting}>Cancel</Button>
              <Button variant="primary" className="!bg-navy-900 dark:!bg-teal-600 dark:!text-white" onClick={handleSubmit} disabled={submitting || !submissionText.trim()}>
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllAssignments, submitAssignment } from '../../services/assignmentService';
import type { Assignment } from '../../types';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useTranslation } from '../../utils/translations';

export default function Assignments() {
  const { t } = useTranslation();
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
        title={t('assignmentsTitle')}
        description={t('assignmentsDesc')}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('pending')} value={String(stats.pending).padStart(2, '0')} icon={AlertCircle} iconBg="bg-rose-50" iconColor="text-rose-600" />
        <StatCard label={t('submitted')} value={String(stats.submitted).padStart(2, '0')} icon={Clock} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label={t('graded')} value={String(stats.graded).padStart(2, '0')} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label={t('overdue')} value={String(stats.overdue).padStart(2, '0')} icon={Calendar} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/80 dark:border-slate-800">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">{t('assignmentHeader')}</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">{t('courseHeader')}</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">{t('dueDateHeader')}</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">{t('statusHeader')}</th>
                <th className="text-right px-6 py-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">{t('actionHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <p className="font-bold text-navy-900 dark:text-white">{item.title}</p>
                    {item.subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>}
                    {(item.status === 'revision' || item.status === 'returned') && item.feedback && (
                      <div className="mt-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl p-2 font-medium max-w-md">
                        <span className="font-black text-amber-900 dark:text-amber-200">Instructor Feedback: </span>
                        {item.feedback}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    <div className="flex flex-col">
                      <span className="font-semibold">{item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}</span>
                      {item.due_days ? (
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                          {item.due_days}d from enrollment
                        </span>
                      ) : null}
                      {item.allow_late && item.late_penalty ? (
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
                          Late allowed (-{item.late_penalty}%)
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.status === 'revision' || item.status === 'returned' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        Returned / Revision
                      </span>
                    ) : (
                      <Badge variant={item.status === 'pending' ? 'warning' : item.status === 'submitted' ? 'info' : 'success'}>
                        {item.status === 'pending' ? t('pending') : item.status === 'submitted' ? t('submitted') : `${t('graded')} ${item.grade || ''}`}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === 'revision' || item.status === 'returned' ? (
                        <Link to={`/student/courses/${item.course_id}/learn?assignmentId=${item.id}`}>
                          <Button variant="outline" size="sm" className="border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 font-bold">
                            Review &amp; Resubmit
                          </Button>
                        </Link>
                      ) : item.status === 'pending' ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openSubmit(item)}>{t('submitBtn')}</Button>
                          <Link to={`/student/courses/${item.course_id}/learn?assignmentId=${item.id}`}>
                            <Button variant="primary" size="sm" className="!bg-navy-900 dark:!bg-teal-600 dark:!text-white">
                              Open
                            </Button>
                          </Link>
                        </>
                      ) : item.status === 'graded' ? (
                        <Link to={`/student/courses/${item.course_id}/learn?assignmentId=${item.id}`}>
                          <Button variant="outline" size="sm">{t('viewGradeBtn')}</Button>
                        </Link>
                      ) : (
                        <Link to={`/student/courses/${item.course_id}/learn?assignmentId=${item.id}`}>
                          <Button variant="ghost" size="sm">{t('viewBtn')}</Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('pageInfo').replace('{page}', String(page + 1)).replace('{total}', String(totalPages)).replace('{count}', String(assignments.length))}
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
            <h3 className="text-lg font-extrabold text-navy-900 dark:text-white">{t('submitModalTitle').replace('{title}', selectedAssignment.title)}</h3>
            {selectedAssignment.due_date && new Date() > new Date(selectedAssignment.due_date) && (
              <div className="rounded-xl px-4 py-2.5 text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Notice: Deadline passed on {new Date(selectedAssignment.due_date).toLocaleDateString()}. {selectedAssignment.allow_late ? `Late submission allowed (${selectedAssignment.late_penalty || 10}% penalty applies).` : 'Late submissions may be penalized.'}</span>
              </div>
            )}
            {submitMsg && (
              <div className={`rounded-xl px-4 py-3 text-sm ${submitMsg.includes('success') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-rose-950/30 dark:text-rose-450'}`}>
                {submitMsg}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('yourSubmissionLabel')}</label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={6}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none resize-none dark:bg-white dark:border-slate-300 dark:text-black dark:focus:border-slate-500 text-black"
                placeholder={t('submissionPlaceholder')}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowSubmitModal(false)} disabled={submitting}>{t('cancelBtn')}</Button>
              <Button variant="primary" className="!bg-navy-900 dark:!bg-teal-600 dark:!text-white" onClick={handleSubmit} disabled={submitting || !submissionText.trim()}>
                {submitting ? t('submittingBtn') : t('submitAssignmentBtn')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

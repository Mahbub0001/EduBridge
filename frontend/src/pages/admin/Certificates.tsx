/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Award,
  Search,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { getAdminCertificates, revokeAdminCertificate } from '../../services/adminService';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import UserAvatar from '../../components/ui/UserAvatar';
import CertificateModal from '../../components/ui/CertificateModal';

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Preview Certificate Modal
  const [previewCert, setPreviewCert] = useState<any | null>(null);

  // Revoke Confirmation
  const [revokeTarget, setRevokeTarget] = useState<any | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loadCertificates = async () => {
    try {
      const data = await getAdminCertificates({ search: search || undefined });
      setCertificates(data);
    } catch (err: any) {
      console.error('Failed to load certificates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCertificates();
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await revokeAdminCertificate(revokeTarget.id);
      setMsg({ text: 'Certificate successfully revoked.', type: 'success' });
      setRevokeTarget(null);
      loadCertificates();
    } catch (err: any) {
      setMsg({ text: 'Failed to revoke certificate.', type: 'error' });
    } finally {
      setRevoking(false);
    }
  };

  const totalCerts = certificates.length;
  const verifiedCerts = certificates.filter((c) => c.valid !== false).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Certificates Registry"
        description="Audit, verify, and manage all student course completion certificates across the academy."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setLoading(true); loadCertificates(); }}
            className="gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      {msg && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
            msg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900'
          }`}
        >
          <span>{msg.text}</span>
          <button type="button" onClick={() => setMsg(null)} className="text-xs font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
            <Award size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{totalCerts}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Certificates Issued</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{verifiedCerts}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified &amp; Valid</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">100%</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Authenticity Guaranteed</p>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, course title, or certificate ID..."
              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <Button type="submit" variant="primary" className="!bg-navy-900 dark:!bg-teal-600">
            Search
          </Button>
        </form>
      </Card>

      {/* Certificates Table */}
      <Card padding="none" className="overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Certificate ID</th>
                <th className="px-6 py-4">Recipient Student</th>
                <th className="px-6 py-4">Completed Course</th>
                <th className="px-6 py-4">Issued Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {certificates.map((cert) => {
                const dateStr = cert.issued_at
                  ? new Date(cert.issued_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—';

                return (
                  <tr key={cert.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                    {/* Certificate ID */}
                    <td className="px-6 py-4 font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                      {cert.id.substring(0, 14)}...
                    </td>

                    {/* Student */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={cert.student_name || 'Student'}
                          size="sm"
                        />
                        <span className="font-extrabold text-navy-900 dark:text-white">
                          {cert.student_name || 'Student'}
                        </span>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-navy-900 dark:text-slate-200 text-xs">
                          {cert.course_title || 'Course'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Instructor: {cert.instructor_name || 'Instructor'}
                        </p>
                      </div>
                    </td>

                    {/* Issued Date */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {dateStr}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <Badge variant={cert.valid !== false ? 'success' : 'danger'}>
                        {cert.valid !== false ? 'Verified' : 'Revoked'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewCert(cert)}
                          className="gap-1 text-xs text-teal-600 hover:text-teal-700"
                        >
                          <Eye size={14} /> Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokeTarget(cert)}
                          className="text-rose-600 hover:text-rose-700 dark:hover:bg-rose-950/30 p-1.5"
                          title="Revoke certificate"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {certificates.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <Award size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-base">No certificates found.</p>
                    <p className="text-xs mt-1">Certificates are automatically issued when students complete all modules &amp; pass quizzes.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Official Certificate Viewer Modal */}
      <CertificateModal
        isOpen={!!previewCert}
        certificate={previewCert}
        onClose={() => setPreviewCert(null)}
      />

      {/* Revoke Confirmation Modal */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-sm space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
              <Trash2 size={18} /> Revoke Certificate
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to revoke the certificate for <strong>{revokeTarget.student_name}</strong> in{' '}
              <strong>{revokeTarget.course_title}</strong>? Once revoked, the certificate will no longer be valid.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(null)} disabled={revoking}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRevoke}
                disabled={revoking}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {revoking ? 'Revoking...' : 'Yes, Revoke'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

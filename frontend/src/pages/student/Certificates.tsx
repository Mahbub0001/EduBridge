import { useEffect, useState } from 'react';
import { Award, Download, ExternalLink, Calendar } from 'lucide-react';
import { getMyCertificates, type Certificate } from '../../services/certificateService';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyCertificates()
      .then(setCertificates)
      .catch(() => setError('Failed to load certificates'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (cert: Certificate) => {
    window.open(cert.certificate_url, '_blank');
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading certificates...</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Certificates"
        description="View and download certificates earned from completed courses."
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-rose-950/30 px-4 py-3 text-sm text-red-700 dark:text-rose-450">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-bold">✕</button>
        </div>
      )}

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} padding="none" className="overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="h-36 relative overflow-hidden bg-gradient-to-br from-navy-900 to-navy-700 dark:from-slate-950 dark:to-slate-800">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Award size={120} className="text-white" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <Badge className="!bg-teal-500/90 !text-white mb-2">Verified</Badge>
                  <h3 className="font-extrabold text-sm">{cert.course_title || 'Course'}</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
                    <Award className="text-amber-600 dark:text-amber-400" size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">EduBridge Academy</p>
                    <p className="text-sm font-bold text-navy-900 dark:text-white">Certificate of Completion</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar size={14} />
                  Issued {new Date(cert.issued_at).toLocaleDateString()}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">ID: {cert.id}</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="primary" size="sm" className="flex-1 !bg-navy-900 dark:!bg-teal-600 dark:!text-white" onClick={() => handleDownload(cert)}>
                    <Download size={14} /> Download
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <ExternalLink size={14} /> Share
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-10">
          <Award className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
          <p className="text-sm text-slate-500 dark:text-slate-400">Complete courses to earn certificates.</p>
          <a href="/student/my-courses" className="inline-block mt-3 text-sm font-bold text-navy-800 dark:text-teal-400 hover:underline">
            View your courses
          </a>
        </Card>
      )}
    </div>
  );
}

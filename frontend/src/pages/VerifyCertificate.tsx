import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import api, { unwrap } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

interface CertificateVerify {
  id: string;
  student_name: string;
  user_name?: string;
  course_title: string;
  issued_at: string;
  instructor_name?: string;
  instructor_signature_url?: string;
  valid: boolean;
}

export default function VerifyCertificate() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [data, setData] = useState<CertificateVerify | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!certificateId) return;
    api
      .get(`/certificates/verify/${certificateId}`)
      .then((res) => setData(unwrap<CertificateVerify>(res)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [certificateId]);

  const studentName = data?.student_name || data?.user_name || 'Student';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-2xl text-center space-y-6" padding="lg">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-navy-900 text-amber-400 flex items-center justify-center shadow-lg">
          <Award size={36} />
        </div>
        
        <div>
          <h1 className="text-2xl font-black text-navy-950 dark:text-white">Certificate Verification</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">ID: {certificateId}</p>
        </div>

        {loading && <p className="text-slate-500 py-8">Verifying certificate credentials...</p>}

        {!loading && error && (
          <div className="space-y-4 py-6">
            <XCircle className="mx-auto text-red-500" size={56} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Certificate Invalid or Not Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              This certificate ID could not be authenticated in the EduBridge public registry.
            </p>
            <Link to="/" className="inline-block pt-2"><Button variant="outline">Return to EduBridge</Button></Link>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
              <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-extrabold text-sm">Authentic & Verified Certificate</span>
            </div>

            {/* Certificate Preview Card */}
            <div className="relative bg-white text-slate-900 p-8 rounded-2xl border-4 border-navy-900 shadow-md text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-xs">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-navy-900 to-teal-600 text-white flex items-center justify-center shadow-xs">
                  <GraduationCap size={16} />
                </div>
                <span className="font-black text-navy-900 tracking-wider">EDUBRIDGE ACADEMY</span>
              </div>

              <div className="py-2 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Certificate of Completion</p>
                <p className="text-xs text-slate-500">This certifies that</p>
                <h2 className="text-xl md:text-2xl font-serif font-extrabold text-teal-700">{studentName}</h2>
                <p className="text-xs text-slate-500">has successfully completed the online course</p>
                <h3 className="text-base font-black text-navy-900 pt-1">"{data.course_title}"</h3>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <div className="text-left">
                  <p className="font-bold">Issued: {new Date(data.issued_at || Date.now()).toLocaleDateString()}</p>
                  <p className="font-mono text-[9px] text-slate-400">Registry: Verified</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{data.instructor_name || 'EduBridge Instructor'}</p>
                  <p className="text-[9px] text-slate-400">Course Lead</p>
                </div>
              </div>
            </div>

            <Link to="/" className="block">
              <Button variant="primary" className="w-full justify-center !bg-navy-900 dark:!bg-teal-600 dark:!text-white">
                Back to EduBridge Academy
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

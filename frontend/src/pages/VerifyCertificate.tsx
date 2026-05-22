import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import api, { unwrap } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

interface CertificateVerify {
  id: string;
  student_name: string;
  course_title: string;
  issued_at: string;
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center" padding="lg">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-navy-900 flex items-center justify-center mb-6">
          <Award className="text-white" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-navy-900 mb-2">Certificate Verification</h1>
        <p className="text-sm text-slate-500 mb-8">ID: {certificateId}</p>

        {loading && <p className="text-slate-500">Verifying certificate...</p>}

        {!loading && error && (
          <div className="space-y-4">
            <XCircle className="mx-auto text-red-500" size={48} />
            <p className="text-slate-600">Certificate could not be verified.</p>
            <Link to="/"><Button variant="outline">Back to Home</Button></Link>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-4 text-left">
            <div className={`flex items-center gap-2 justify-center ${data.valid ? 'text-emerald-600' : 'text-red-600'}`}>
              {data.valid ? <CheckCircle size={24} /> : <XCircle size={24} />}
              <span className="font-bold">{data.valid ? 'Valid Certificate' : 'Invalid Certificate'}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <p><span className="text-slate-500">Student:</span> <strong>{data.student_name}</strong></p>
              <p><span className="text-slate-500">Course:</span> <strong>{data.course_title}</strong></p>
              <p><span className="text-slate-500">Issued:</span> <strong>{new Date(data.issued_at).toLocaleDateString()}</strong></p>
            </div>
            <Link to="/" className="block text-center"><Button>Back to EduBridge</Button></Link>
          </div>
        )}
      </Card>
    </div>
  );
}

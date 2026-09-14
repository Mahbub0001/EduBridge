import { useState } from 'react';
import { Award, Download, Share2, Check, ExternalLink, X, GraduationCap } from 'lucide-react';
import Button from './Button';

export interface CertificateData {
  id: string;
  student_name?: string;
  course_title: string;
  issued_at: string;
  instructor_name?: string;
  instructor_signature_url?: string;
  certificate_url?: string;
  valid?: boolean;
}

interface CertificateModalProps {
  certificate: CertificateData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CertificateModal({ certificate, isOpen, onClose }: CertificateModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !certificate) return null;

  const verifyUrl = `${window.location.origin}/verify-certificate/${certificate.id}`;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const formattedDate = new Date(certificate.issued_at || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      {/* Container - hide overflow in normal view, printable styling applied via CSS */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Header Actions (hidden during printing) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Award className="text-teal-600 dark:text-teal-400" size={20} />
            <h2 className="text-base font-extrabold text-navy-900 dark:text-white">Official Course Certificate</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5 text-xs">
              {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
              {copied ? 'Link Copied!' : 'Share'}
            </Button>
            <Button variant="primary" size="sm" onClick={handlePrint} className="gap-1.5 text-xs !bg-navy-900 dark:!bg-teal-600 dark:!text-white">
              <Download size={14} /> Print / Save PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Certificate Template Document */}
        <div className="p-6 md:p-10 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
          <div
            id="printable-certificate"
            className="print:shadow-none print:w-full print:m-0 print:border-8 print:border-teal-700 relative w-full max-w-3xl bg-white text-slate-900 p-8 md:p-12 rounded-xl shadow-xl border-8 border-navy-900 overflow-hidden text-center select-none"
            style={{ minHeight: '520px' }}
          >
            {/* Elegant Background Watermark & Corner Frames */}
            <div className="absolute -top-16 -left-16 w-36 h-36 border-4 border-amber-400/30 rounded-full pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 border-4 border-amber-400/30 rounded-full pointer-events-none" />
            <div className="absolute inset-4 border border-amber-400/40 rounded-lg pointer-events-none" />

            {/* Header / Brand */}
            <div className="flex items-center justify-between mb-8 px-4">
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-navy-900 to-teal-600 text-white flex items-center justify-center shadow-md">
                  <GraduationCap size={24} />
                </div>
                <div className="text-left">
                  <h4 className="font-black text-navy-900 tracking-wider text-base">EDUBRIDGE</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Academy of Higher Learning</p>
                </div>
              </div>
            </div>

            {/* Main Title */}
            <div className="my-6 space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">Certificate of Achievement</p>
              <h1 className="text-3xl md:text-4xl font-serif font-extrabold text-navy-950 tracking-tight">
                PROUDLY PRESENTED TO
              </h1>
            </div>

            {/* Student Name */}
            <div className="my-6 py-2 border-b-2 border-amber-400/60 max-w-md mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold text-teal-700 tracking-wide font-serif">
                {certificate.student_name || 'Student'}
              </h2>
            </div>

            {/* Description */}
            <div className="max-w-xl mx-auto space-y-2 text-sm text-slate-600">
              <p>has successfully completed the comprehensive online course requirements for</p>
              <h3 className="text-lg md:text-xl font-black text-navy-900 py-1">
                "{certificate.course_title}"
              </h3>
              <p className="text-xs text-slate-500">
                demonstrating mastery of required learning modules, assessments, and practical exercises.
              </p>
            </div>

            {/* Footer Signatures & Details */}
            <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 items-end text-xs px-4">
              {/* Date & Verification ID */}
              <div className="text-left space-y-1">
                <p className="font-bold text-slate-700">Issued Date: <span className="font-normal text-slate-900">{formattedDate}</span></p>
                <p className="font-mono text-[10px] text-slate-500">Certificate ID: {certificate.id}</p>
                <a
                  href={verifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="print:hidden inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:underline pt-1"
                >
                  Verify Authenticity <ExternalLink size={12} />
                </a>
              </div>

              {/* Signature */}
              <div className="text-right flex flex-col items-end">
                {certificate.instructor_signature_url ? (
                  <img src={certificate.instructor_signature_url} alt="Signature" className="h-10 object-contain mb-1 max-w-[140px]" />
                ) : (
                  <div className="flex flex-col items-center justify-center relative min-w-[150px] px-2 mb-1">
                    <span
                      className="text-4xl font-normal text-navy-950 dark:text-navy-900 tracking-wider select-none transform -rotate-6"
                      style={{ fontFamily: "'Great Vibes', 'Dancing Script', 'Brush Script MT', cursive", textShadow: "0 0 1px rgba(15,23,42,0.2)" }}
                    >
                      Mahbub
                    </span>
                    <svg className="w-32 h-4 text-navy-900 -mt-2 overflow-visible" viewBox="0 0 120 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 10 C 25 14, 60 4, 116 8 C 90 12, 45 15, 110 14" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                <p className="font-bold text-slate-800 text-xs">{certificate.instructor_name || 'EduBridge Academy Instructor'}</p>
                <p className="text-[10px] text-slate-500 font-medium">EduBridge Lead Instructor</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Embedded CSS for Print Mode */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-certificate, #printable-certificate * {
            visibility: visible;
          }
          #printable-certificate {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            border-width: 12px !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}

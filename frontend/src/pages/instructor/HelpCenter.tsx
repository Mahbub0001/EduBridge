/* eslint-disable @typescript-eslint/no-explicit-any */
import { BookOpen, HelpCircle, FileText, Compass, ExternalLink, Award } from 'lucide-react';
import Card from '../../components/ui/Card';

export default function InstructorHelpCenter() {
  const faqs = [
    {
      q: "How do I release a course draft to the public?",
      a: "Navigate to the Course Builder, select your course, complete the Publish Checklist (verify syllabus modules, quizzes, and outcomes), then select 'Publish Course' on the dashboard."
    },
    {
      q: "Can I use multiple rubrics criteria on a single assignment?",
      a: "Yes! In the Assignments setup, click 'Add Criterion' to create multiple grading fields. Note that the sum of all criterion max points must equal the assignment's total marks."
    },
    {
      q: "How does late grading work?",
      a: "If 'Allow late submissions' is enabled, students can turn in assignments after the deadline. The system flags the paper as late and suggests the configured penalty deduction on the grading panel."
    },
    {
      q: "What triggers automatic notifications for students?",
      a: "Releasing an Announcement or publishing a new Course instantly seeds custom notification objects into the database, alerting all enrolled student participants."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900">Instructor Help Center</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Explore documentation, interactive guides, and platform FAQs to optimize your classroom.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Help Cards */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-slate-200 p-5 space-y-4 bg-white">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Compass size={16} className="text-slate-500" />
              <span>Frequently Asked Questions</span>
            </h3>

            <div className="space-y-4 divide-y divide-slate-100">
              {faqs.map((faq, i) => (
                <div key={i} className="pt-4 first:pt-0 space-y-1.5">
                  <h4 className="text-xs font-black text-slate-800 flex items-start gap-1.5 leading-snug">
                    <HelpCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed pl-5">{faq.a}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Resources Panel */}
        <div className="space-y-6">
          <Card className="border border-slate-200 p-5 space-y-4 bg-white">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <BookOpen size={16} className="text-slate-500" />
              <span>Reference Guides</span>
            </h3>

            <div className="space-y-3">
              <a href="#quickstart" className="flex items-center justify-between p-3 rounded-xl border border-slate-150 hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700">
                <span className="flex items-center gap-2">
                  <FileText size={14} className="text-blue-500" />
                  <span>Curriculum Design Manual</span>
                </span>
                <ExternalLink size={12} className="text-slate-400" />
              </a>

              <a href="#assessments" className="flex items-center justify-between p-3 rounded-xl border border-slate-150 hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700">
                <span className="flex items-center gap-2">
                  <Award size={14} className="text-emerald-500" />
                  <span>Rubric Grading Rubicon</span>
                </span>
                <ExternalLink size={12} className="text-slate-400" />
              </a>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

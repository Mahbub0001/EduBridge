/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, Save,
  BookOpen, Image, Target, Eye, Upload, Sparkles, Loader2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { createCourse, uploadInstructorFile } from '../../services/courseService';
import { cn } from '../../lib/utils';

/* ── Types ── */
interface CourseFormData {
  title: string;
  short_description: string;
  description: string;
  category: string;
  level: string;
  language: string;
  estimated_hours: number;
  status: string;
  thumbnail_url: string;
  preview_video_url: string;
  banner_image_url: string;
  instructor_signature_url: string;
  learning_outcomes: string[];
  prerequisites: string[];
  target_learners: string;
  requirements: string;
  price_type: string;
  price: number;
  certificate_available: boolean;
  enrollment_open: boolean;
  allow_discussion: boolean;
}

const INITIAL: CourseFormData = {
  title: '', short_description: '', description: '', category: '',
  level: 'Beginner', language: 'English', estimated_hours: 0, status: 'draft',
  thumbnail_url: '', preview_video_url: '', banner_image_url: '', instructor_signature_url: '',
  learning_outcomes: [''], prerequisites: [''],
  target_learners: '', requirements: '',
  price_type: 'free', price: 0, certificate_available: true,
  enrollment_open: true, allow_discussion: true,
};


const STEPS = [
  { id: 0, label: 'Basic Info', icon: BookOpen },
  { id: 1, label: 'Learning', icon: Target },
  { id: 2, label: 'Media & Settings', icon: Image },
  { id: 3, label: 'Review', icon: Eye },
];

const CATEGORIES = [
  'Web Development', 'Data Science', 'Cloud Engineering',
  'Mobile Development', 'Cybersecurity', 'AI & Machine Learning',
  'DevOps', 'UI/UX Design', 'Business', 'Other',
];

export const DEFAULT_COURSE_LOGOS = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580894732413-a75151b96f01?w=800&auto=format&fit=crop&q=80',
];

/* ── helpers ── */
const fieldCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/10 transition-all bg-white placeholder-slate-400';
const labelCls = 'text-xs font-bold text-slate-500 uppercase tracking-wider';
const errCls = 'text-[11px] text-red-500 font-semibold mt-1';

/* ── Component ── */
export default function CreateCourse() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CourseFormData>({ ...INITIAL });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500); };

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadInstructorFile(file);
      setForm((p) => ({ ...p, thumbnail_url: url }));
      showToast('Course logo uploaded successfully!');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  /* ── field updater ── */
  const set = <K extends keyof CourseFormData>(key: K, val: CourseFormData[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  /* ── dynamic list helpers ── */
  const addListItem = (key: 'learning_outcomes' | 'prerequisites') =>
    set(key, [...form[key], '']);
  const updateListItem = (key: 'learning_outcomes' | 'prerequisites', i: number, val: string) => {
    const copy = [...form[key]];
    copy[i] = val;
    set(key, copy);
  };
  const removeListItem = (key: 'learning_outcomes' | 'prerequisites', i: number) => {
    const copy = [...form[key]];
    copy.splice(i, 1);
    set(key, copy.length === 0 ? [''] : copy);
  };

  /* ── validation ── */
  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.title.trim()) e.title = 'Title is required';
      if (!form.category) e.category = 'Category is required';
      if (form.estimated_hours <= 0) e.estimated_hours = 'Enter estimated hours';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canProceed = (s: number) => {
    if (s === 0) return form.title.trim() && form.category;
    return true;
  };

  const next = () => { if (validate(step) && step < 3) setStep(step + 1); };
  const prev = () => { if (step > 0) setStep(step - 1); };

  /* ── submit ── */
  const submit = async (asDraft: boolean) => {
    if (!validate(0)) { setStep(0); return; }
    setSaving(true);
    try {
      const finalThumbnail = form.thumbnail_url.trim() || DEFAULT_COURSE_LOGOS[Math.floor(Math.random() * DEFAULT_COURSE_LOGOS.length)];
      const payload = {
        ...form,
        thumbnail_url: finalThumbnail,
        status: asDraft ? 'draft' : 'published',
        learning_outcomes: form.learning_outcomes.filter((o) => o.trim()),
        prerequisites: form.prerequisites.filter((p) => p.trim()),
        price: form.price_type === 'free' ? 0 : form.price,
      };
      await createCourse(payload);
      showToast(asDraft ? 'Course saved as draft!' : 'Course created successfully!');
      setTimeout(() => navigate('/instructor/courses'), 1200);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to create course');
    } finally {
      setSaving(false);
    }
  };

  /* ──────── RENDER ──────── */
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Create New Course</h1>
            <p className="text-sm text-slate-500 mt-0.5">Fill in the course details step by step.</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === i;
          const done = step > i;
          return (
            <button
              key={s.id}
              onClick={() => { if (done || i === step) setStep(i); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                active ? 'bg-slate-900 text-white shadow-sm' :
                done ? 'bg-emerald-50 text-emerald-700' :
                'bg-slate-100 text-slate-500'
              )}
            >
              {done ? <Check size={14} /> : <Icon size={14} />}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <Card padding="lg" className="space-y-6">

        {/* ── STEP 0 : Basic Info ── */}
        {step === 0 && (
          <>
            <h2 className="text-base font-extrabold text-slate-900">Basic Information</h2>

            <div className="space-y-1.5">
              <label className={labelCls}>Course Title *</label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} className={fieldCls} placeholder="e.g. Advanced Web Architecture" />
              {errors.title && <p className={errCls}>{errors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Short Description</label>
              <input value={form.short_description} onChange={(e) => set('short_description', e.target.value)} className={fieldCls} placeholder="One-line summary" maxLength={160} />
              <p className="text-[10px] text-slate-400 text-right">{form.short_description.length}/160</p>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Full Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={cn(fieldCls, 'resize-none')} rows={4} placeholder="Detailed course description..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Category *</label>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className={fieldCls}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className={errCls}>{errors.category}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Level</label>
                <select value={form.level} onChange={(e) => set('level', e.target.value)} className={fieldCls}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Language</label>
                <select value={form.language} onChange={(e) => set('language', e.target.value)} className={fieldCls}>
                  <option>English</option>
                  <option>Bangla</option>
                  <option>Hindi</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Estimated Hours *</label>
                <input type="number" min={0} step={0.5} value={form.estimated_hours || ''} onChange={(e) => set('estimated_hours', Number(e.target.value))} className={fieldCls} placeholder="e.g. 24" />
                {errors.estimated_hours && <p className={errCls}>{errors.estimated_hours}</p>}
              </div>
            </div>
          </>
        )}

        {/* ── STEP 1 : Learning Details ── */}
        {step === 1 && (
          <>
            <h2 className="text-base font-extrabold text-slate-900">Learning Design</h2>

            {/* Learning Outcomes */}
            <div className="space-y-2">
              <label className={labelCls}>Learning Outcomes</label>
              {form.learning_outcomes.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input value={o} onChange={(e) => updateListItem('learning_outcomes', i, e.target.value)} className={cn(fieldCls, 'flex-1')} placeholder={`Outcome ${i + 1}`} />
                  {form.learning_outcomes.length > 1 && (
                    <button type="button" onClick={() => removeListItem('learning_outcomes', i)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => addListItem('learning_outcomes')}><Plus size={14} /> Add Outcome</Button>
            </div>

            {/* Prerequisites */}
            <div className="space-y-2">
              <label className={labelCls}>Prerequisites</label>
              {form.prerequisites.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input value={p} onChange={(e) => updateListItem('prerequisites', i, e.target.value)} className={cn(fieldCls, 'flex-1')} placeholder={`Prerequisite ${i + 1}`} />
                  {form.prerequisites.length > 1 && (
                    <button type="button" onClick={() => removeListItem('prerequisites', i)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => addListItem('prerequisites')}><Plus size={14} /> Add Prerequisite</Button>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Target Learners</label>
              <textarea value={form.target_learners} onChange={(e) => set('target_learners', e.target.value)} className={cn(fieldCls, 'resize-none')} rows={3} placeholder="Describe who this course is for..." />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Course Requirements</label>
              <textarea value={form.requirements} onChange={(e) => set('requirements', e.target.value)} className={cn(fieldCls, 'resize-none')} rows={3} placeholder="Software, tools, or prior knowledge needed..." />
            </div>
          </>
        )}

        {/* ── STEP 2 : Media & Settings ── */}
        {step === 2 && (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Course Thumbnail & Media</h2>
                  <p className="text-xs text-slate-500">Upload a custom course logo/thumbnail, or choose from defaults.</p>
                </div>
                <Badge variant="info" className="gap-1 text-[11px] font-bold">
                  <Sparkles size={12} /> Auto-Assign If Blank
                </Badge>
              </div>

              {/* Upload or URL input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Upload Logo / Thumbnail Image</label>
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {uploadingLogo ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-teal-600" />
                        <span className="text-xs font-bold text-slate-600">Uploading Logo...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Choose Image File</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoFileUpload} disabled={uploadingLogo} />
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className={labelCls}>Or Thumbnail URL</label>
                  <input value={form.thumbnail_url} onChange={(e) => set('thumbnail_url', e.target.value)} className={fieldCls} placeholder="https://..." />
                </div>
              </div>

              {/* Preset Default Logos Selection Grid */}
              <div className="space-y-2 pt-2">
                <label className={labelCls}>Or Pick from Preset Logos</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {DEFAULT_COURSE_LOGOS.map((logoUrl, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => set('thumbnail_url', logoUrl)}
                      className={cn(
                        'relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105',
                        form.thumbnail_url === logoUrl
                          ? 'border-teal-600 shadow-md ring-2 ring-teal-600/30'
                          : 'border-slate-200 opacity-75 hover:opacity-100'
                      )}
                    >
                      <img src={logoUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      {form.thumbnail_url === logoUrl && (
                        <div className="absolute inset-0 bg-teal-900/40 flex items-center justify-center text-white">
                          <Check size={14} className="stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Preview */}
              {form.thumbnail_url ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="w-20 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                    <img src={form.thumbnail_url} alt="thumb" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Selected Thumbnail</p>
                    <p className="text-[11px] text-slate-500 truncate">{form.thumbnail_url}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => set('thumbnail_url', '')} className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                    Remove
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  💡 No logo selected: A random course logo will be automatically assigned when saved!
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className={labelCls}>Preview Video URL</label>
                  <input value={form.preview_video_url} onChange={(e) => set('preview_video_url', e.target.value)} className={fieldCls} placeholder="https://youtube.com/..." />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Banner Image URL (optional)</label>
                  <input value={form.banner_image_url} onChange={(e) => set('banner_image_url', e.target.value)} className={fieldCls} placeholder="https://..." />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <h2 className="text-base font-extrabold text-slate-900">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Price Type</label>
                <select value={form.price_type} onChange={(e) => set('price_type', e.target.value)} className={fieldCls}>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Price (USD)</label>
                <input type="number" min={0} step={0.01} value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} className={fieldCls} disabled={form.price_type === 'free'} placeholder={form.price_type === 'free' ? 'Free' : '0.00'} />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.certificate_available} onChange={(e) => set('certificate_available', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
              <span className="text-sm font-semibold text-slate-700">Certificate available upon completion</span>
            </label>

            <hr className="border-slate-100" />

            <h2 className="text-base font-extrabold text-slate-900">Settings</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.enrollment_open} onChange={(e) => set('enrollment_open', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                <span className="text-sm font-semibold text-slate-700">Enrollment open</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.allow_discussion} onChange={(e) => set('allow_discussion', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                <span className="text-sm font-semibold text-slate-700">Allow discussion forum</span>
              </label>
            </div>
          </>
        )}

        {/* ── STEP 3 : Review ── */}
        {step === 3 && (
          <>
            <h2 className="text-base font-extrabold text-slate-900">Review Your Course</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div><span className="font-bold text-slate-500 text-xs">Title</span><p className="font-semibold text-slate-900 mt-0.5">{form.title || '—'}</p></div>
              <div><span className="font-bold text-slate-500 text-xs">Category</span><p className="mt-0.5"><Badge>{form.category || '—'}</Badge></p></div>
              <div><span className="font-bold text-slate-500 text-xs">Level</span><p className="font-semibold text-slate-900 mt-0.5">{form.level}</p></div>
              <div><span className="font-bold text-slate-500 text-xs">Language</span><p className="font-semibold text-slate-900 mt-0.5">{form.language}</p></div>
              <div><span className="font-bold text-slate-500 text-xs">Estimated Hours</span><p className="font-semibold text-slate-900 mt-0.5">{form.estimated_hours}h</p></div>
              <div><span className="font-bold text-slate-500 text-xs">Price</span><p className="font-semibold text-slate-900 mt-0.5">{form.price_type === 'free' ? 'Free' : `$${form.price}`}</p></div>
            </div>

            {form.short_description && (
              <div><span className="font-bold text-slate-500 text-xs">Short Description</span><p className="text-sm text-slate-700 mt-1">{form.short_description}</p></div>
            )}

            {form.learning_outcomes.filter((o) => o.trim()).length > 0 && (
              <div>
                <span className="font-bold text-slate-500 text-xs">Learning Outcomes</span>
                <ul className="mt-1 space-y-1">
                  {form.learning_outcomes.filter((o) => o.trim()).map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" /> {o}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <span className={cn('w-3 h-3 rounded-full', form.certificate_available ? 'bg-emerald-500' : 'bg-slate-300')} />
                <span className="text-slate-700 font-medium">Certificate {form.certificate_available ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={cn('w-3 h-3 rounded-full', form.enrollment_open ? 'bg-emerald-500' : 'bg-slate-300')} />
                <span className="text-slate-700 font-medium">Enrollment {form.enrollment_open ? 'Open' : 'Closed'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={cn('w-3 h-3 rounded-full', form.allow_discussion ? 'bg-emerald-500' : 'bg-slate-300')} />
                <span className="text-slate-700 font-medium">Discussions {form.allow_discussion ? 'On' : 'Off'}</span>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
        <div className="flex gap-3">
          {step > 0 && <Button variant="outline" onClick={prev}><ArrowLeft size={14} /> Back</Button>}
          {step < 3 && (
            <Button variant="primary" className="!bg-slate-900" onClick={next} disabled={!canProceed(step)}>
              Next <ArrowRight size={14} />
            </Button>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => submit(true)} disabled={saving}>
                <Save size={14} /> Save Draft
              </Button>
              <Button variant="primary" className="!bg-slate-900" onClick={() => submit(false)} disabled={saving || !form.title.trim()}>
                <Check size={14} /> {saving ? 'Creating...' : 'Create Course'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Shield, Bell, User, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function InstructorSettings() {
  const [toastMsg, setToastMsg] = useState('');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [marketingNotifs, setMarketingNotifs] = useState(true);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Your workspace settings have been successfully saved!');
  };

  return (
    <div className="space-y-6">
      {/* Toast popup */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm bg-slate-900 text-white font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900">Workspace Settings</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Customize your EduBridge instructor workstation profiles, alerts, and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Side Tabs */}
        <div className="md:col-span-1 space-y-3">
          <Card className="border border-slate-200 p-4 space-y-1">
            <button className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-black bg-slate-950 text-white flex items-center gap-2 transition-all">
              <User size={14} />
              <span>Instructor Profile</span>
            </button>
            <button className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all">
              <Bell size={14} />
              <span>Notification Settings</span>
            </button>
            <button className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all">
              <Shield size={14} />
              <span>Privacy & Security</span>
            </button>
          </Card>
        </div>

        {/* Right Column: Preferences Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-slate-200 p-6 bg-white">
            <form onSubmit={handleSave} className="space-y-6">
              
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <span>Profile Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">First Name</label>
                    <input type="text" defaultValue="Demo" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-950 bg-slate-50/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Last Name</label>
                    <input type="text" defaultValue="Instructor" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-950 bg-slate-50/50" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Public Biography</label>
                    <textarea rows={3} defaultValue="Dedicated educator specialized in blended learning, professional digital curriculum designs, and assessment methods." className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-950 bg-slate-50/50 resize-none" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-950 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Bell size={16} className="text-slate-400" />
                  <span>Email Alerts Preferences</span>
                </h3>
                <div className="space-y-3 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={emailNotifs} onChange={(e) => setEmailNotifs(e.target.checked)} className="rounded text-slate-950 focus:ring-slate-950 h-4 w-4" />
                    <div>
                      <p className="text-xs font-black text-slate-800">Student submissions alerts</p>
                      <p className="text-[10px] text-slate-400">Receive email summaries when homework is completed or handed in.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={smsNotifs} onChange={(e) => setSmsNotifs(e.target.checked)} className="rounded text-slate-950 focus:ring-slate-950 h-4 w-4" />
                    <div>
                      <p className="text-xs font-black text-slate-800">SMS updates</p>
                      <p className="text-[10px] text-slate-400">Receive texts for urgent administrative requests.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={marketingNotifs} onChange={(e) => setMarketingNotifs(e.target.checked)} className="rounded text-slate-950 focus:ring-slate-950 h-4 w-4" />
                    <div>
                      <p className="text-xs font-black text-slate-800">Weekly platform analytics digest</p>
                      <p className="text-[10px] text-slate-400">Receive automated enrollment reports and insights digests.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" size="sm">Reset preferences</Button>
                <Button type="submit" variant="primary" size="sm" className="!bg-slate-950">Save changes</Button>
              </div>

            </form>
          </Card>
        </div>

      </div>
    </div>
  );
}

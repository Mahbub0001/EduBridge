import { useState, useCallback } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { updateProfile } from '../../services/authService';
import { User, Shield, Bell, Palette } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const NAV = [
  { key: 'profile', label: 'Profile', icon: User, path: '/student/settings/profile' },
  { key: 'account', label: 'Account', icon: Shield, path: '/student/settings/account' },
  { key: 'notifications', label: 'Notifications', icon: Bell, path: '/student/settings/notifications' },
  { key: 'appearance', label: 'Appearance', icon: Palette, path: '/student/settings/appearance' },
];

export default function Settings() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [email] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);
  const [language, setLanguage] = useState('English');
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await updateProfile({ name, bio, language, notifications_enabled: emailNotif });
      setSaveMsg('Settings saved successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [name, bio, language, emailNotif]);

  if (location.pathname === '/student/settings' || location.pathname === '/student/settings/') {
    return <Navigate to="/student/settings/profile" replace />;
  }

  const section = location.pathname.split('/').pop() || 'profile';

  return (
    <div className="space-y-8">
      <PageHeader title="Account Settings" description="Manage your profile, preferences, and security." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.key;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  active ? 'bg-navy-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <Card className="lg:col-span-2 space-y-6">
          {section === 'profile' && (
            <>
              <h3 className="text-base font-extrabold text-navy-900">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-2xl px-4 py-3 text-sm outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Student ID</label>
                  <input type="text" value={user?.student_id || 'STU-2024-001'} disabled className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none resize-none" placeholder="Tell us about yourself..." />
                </div>
              </div>
            </>
          )}

          {section === 'account' && (
            <>
              <h3 className="text-base font-extrabold text-navy-900">Security</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Email</label>
                <input type="email" value={email} disabled className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                </div>
              </div>
            </>
          )}

          {section === 'notifications' && (
            <>
              <h3 className="text-base font-extrabold text-navy-900">Notification Preferences</h3>
              {[
                { label: 'Email notifications', desc: 'Course updates and announcements', checked: emailNotif, set: setEmailNotif },
                { label: 'Push notifications', desc: 'Real-time alerts on your device', checked: pushNotif, set: setPushNotif },
                { label: 'Assignment reminders', desc: 'Reminders before due dates', checked: assignmentReminders, set: setAssignmentReminders },
              ].map((pref) => (
                <div key={pref.label} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <h4 className="text-sm font-bold text-navy-900">{pref.label}</h4>
                    <p className="text-xs text-slate-500">{pref.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => pref.set(!pref.checked)}
                    className={`w-11 h-6 rounded-full relative transition-all ${pref.checked ? 'bg-teal-600' : 'bg-slate-200'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pref.checked ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </>
          )}

          {section === 'appearance' && (
            <>
              <h3 className="text-base font-extrabold text-navy-900">Appearance & Language</h3>
              <div className="flex justify-between items-center py-3">
                <div>
                  <h4 className="text-sm font-bold text-navy-900">Language</h4>
                  <p className="text-xs text-slate-500">Display language for the platform</p>
                </div>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                  <option>English</option>
                  <option>Bangla</option>
                </select>
              </div>
              <div className="flex justify-between items-center py-3 border-t border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-navy-900">Dark Mode</h4>
                  <p className="text-xs text-slate-500">Switch between light and dark themes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-11 h-6 rounded-full relative ${darkMode ? 'bg-teal-600' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full ${darkMode ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </>
          )}

          <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
            {saveMsg && (
              <span className={`text-sm font-bold ${saveMsg.includes('success') ? 'text-emerald-600' : 'text-red-600'}`}>
                {saveMsg}
              </span>
            )}
            <Button variant="primary" className="!bg-navy-900 ml-auto" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

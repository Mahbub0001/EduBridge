/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Bell,
  Sliders,
  Shield,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  X
} from 'lucide-react';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getPlatformSettings,
  updatePlatformSettings,
} from '../../services/adminService';
import { updateProfile } from '../../services/authService';
import { useAuthStore } from '../../store';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import UserAvatar from '../../components/ui/UserAvatar';

type SettingsTab = 'platform' | 'announcements' | 'security';

export default function AdminSettings() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('platform');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Platform Configuration State
  const [platformConfig, setPlatformConfig] = useState({
    platform_name: 'EduBridge Academy',
    support_email: 'support@edubridge.edu',
    contact_phone: '+1 (555) 019-2834',
    allow_registration: true,
    maintenance_mode: false,
    enable_community: true,
    auto_issue_certificates: true,
    default_language: 'English',
  });

  // Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  // Admin Profile State
  const [adminName, setAdminName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = async () => {
    try {
      const [settings, anns] = await Promise.all([
        getPlatformSettings().catch(() => ({})),
        getAnnouncements().catch(() => []),
      ]);
      if (settings && Object.keys(settings).length > 0) {
        setPlatformConfig((prev) => ({ ...prev, ...settings }));
      }
      setAnnouncements(anns);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (user?.name) setAdminName(user.name);
  }, [user]);

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updatePlatformSettings(platformConfig);
      setMsg({ text: 'Platform configuration saved successfully!', type: 'success' });
    } catch (err) {
      setMsg({ text: 'Failed to save platform configuration.', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) return;

    setCreatingAnnouncement(true);
    try {
      await createAnnouncement({
        ...announcementForm,
        type: 'global',
        author_name: user?.name || 'Administrator',
      });
      setMsg({ text: 'Global announcement published!', type: 'success' });
      setShowAnnouncementModal(false);
      setAnnouncementForm({ title: '', content: '' });
      loadData();
    } catch (err) {
      setMsg({ text: 'Failed to publish announcement.', type: 'error' });
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      setMsg({ text: 'Announcement removed.', type: 'success' });
      loadData();
    } catch {
      setMsg({ text: 'Failed to delete announcement.', type: 'error' });
    }
  };

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) return;
    setSavingProfile(true);
    try {
      const updated = await updateProfile({ name: adminName.trim() });
      if (user) {
        setUser({ ...user, name: updated.name || adminName.trim() });
      }
      setMsg({ text: 'Administrator profile updated!', type: 'success' });
    } catch {
      setMsg({ text: 'Failed to update admin profile.', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Settings &amp; Configuration"
        description="Configure system preferences, publish global announcements, and manage admin credentials."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setLoading(true); loadData(); }}
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

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-extrabold">
        <button
          type="button"
          onClick={() => setActiveTab('platform')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'platform'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Sliders size={16} /> Platform Configuration
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'announcements'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Bell size={16} /> Global Announcements ({announcements.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'security'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Shield size={16} /> Administrator Profile
        </button>
      </div>

      {/* TAB 1: Platform Configuration */}
      {activeTab === 'platform' && (
        <Card className="space-y-6">
          <form onSubmit={handleSavePlatformSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Globe size={14} className="text-teal-600" /> Platform / Academy Name
                </label>
                <input
                  type="text"
                  required
                  value={platformConfig.platform_name}
                  onChange={(e) => setPlatformConfig({ ...platformConfig, platform_name: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail size={14} className="text-teal-600" /> Support Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={platformConfig.support_email}
                  onChange={(e) => setPlatformConfig({ ...platformConfig, support_email: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone size={14} className="text-teal-600" /> Support Phone Number
                </label>
                <input
                  type="text"
                  value={platformConfig.contact_phone}
                  onChange={(e) => setPlatformConfig({ ...platformConfig, contact_phone: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Default Platform Language
                </label>
                <select
                  value={platformConfig.default_language}
                  onChange={(e) => setPlatformConfig({ ...platformConfig, default_language: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                >
                  <option value="English">English</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="Spanish">Spanish (Español)</option>
                </select>
              </div>
            </div>

            {/* Policy Toggles */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                System Switches &amp; Access Controls
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Registration Toggle */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-navy-900 dark:text-white">Allow Self Registration</p>
                    <p className="text-[11px] text-slate-400">Permit new learners to create accounts freely.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformConfig.allow_registration}
                    onChange={(e) => setPlatformConfig({ ...platformConfig, allow_registration: e.target.checked })}
                    className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Maintenance Mode Toggle */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-navy-900 dark:text-white">Maintenance Mode</p>
                    <p className="text-[11px] text-slate-400">Temporarily display maintenance screen to learners.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformConfig.maintenance_mode}
                    onChange={(e) => setPlatformConfig({ ...platformConfig, maintenance_mode: e.target.checked })}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </div>

                {/* Community Zone Toggle */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-navy-900 dark:text-white">Enable Community Zone</p>
                    <p className="text-[11px] text-slate-400">Allow peer discussions and collaborative posts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformConfig.enable_community}
                    onChange={(e) => setPlatformConfig({ ...platformConfig, enable_community: e.target.checked })}
                    className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Auto Issue Certificate */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-navy-900 dark:text-white">Auto-Issue Certificates</p>
                    <p className="text-[11px] text-slate-400">Generate verified certificates immediately on course 100%.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformConfig.auto_issue_certificates}
                    onChange={(e) => setPlatformConfig({ ...platformConfig, auto_issue_certificates: e.target.checked })}
                    className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={savingSettings}
                className="!bg-teal-600 hover:!bg-teal-700 text-white font-bold gap-1.5"
              >
                <Save size={16} /> {savingSettings ? 'Saving Configuration...' : 'Save Configuration'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: Global Announcements */}
      {activeTab === 'announcements' && (
        <Card className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-navy-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-teal-600" /> Platform Announcements
              </h2>
              <p className="text-xs text-slate-400">Broadcast updates to all active students and instructors.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAnnouncementModal(true)}
              className="!bg-navy-900 dark:!bg-teal-600 gap-1.5"
            >
              <Plus size={16} /> New Announcement
            </Button>
          </div>

          <div className="space-y-4">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-navy-900 dark:text-white text-sm">{a.title}</span>
                    <Badge variant="info">Global Broadcast</Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    {a.content}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                    <span>By {a.author_name || 'Administrator'}</span>
                    <span>•</span>
                    <span>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAnnouncement(a.id)}
                  className="text-rose-600 hover:text-rose-700 p-1.5"
                  title="Delete announcement"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}

            {announcements.length === 0 && (
              <p className="text-center py-12 text-slate-400 text-xs">
                No active global announcements. Click 'New Announcement' to broadcast a message.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* TAB 3: Admin Profile & Credentials */}
      {activeTab === 'security' && (
        <Card className="space-y-6 max-w-2xl">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <UserAvatar src={user?.photo_url} name={user?.name} size="lg" />
            <div>
              <h3 className="text-lg font-black text-navy-900 dark:text-white">{user?.name}</h3>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <Badge variant="danger" className="mt-1">Administrator Privileges</Badge>
            </div>
          </div>

          <form onSubmit={handleUpdateAdminProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Display Name</label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Email</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={savingProfile}
                className="!bg-teal-600 text-white font-bold"
              >
                {savingProfile ? 'Updating...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* New Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-navy-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-teal-600" /> New Global Announcement
              </h3>
              <button
                type="button"
                onClick={() => setShowAnnouncementModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Title *</label>
                <input
                  required
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="e.g. Scheduled System Upgrade"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Message Content *</label>
                <textarea
                  required
                  rows={4}
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="Write your platform-wide announcement here..."
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowAnnouncementModal(false)} disabled={creatingAnnouncement}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={creatingAnnouncement} className="!bg-teal-600 text-white font-bold">
                  {creatingAnnouncement ? 'Publishing...' : 'Publish Announcement'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

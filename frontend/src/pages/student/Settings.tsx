/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore, usePreferencesStore } from '../../store';
import { updateProfile, uploadAvatar, getMe } from '../../services/authService';
import { User, Shield, Bell, Palette, Upload, Trash2, Link as LinkIcon, Loader2, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import UserAvatar from '../../components/ui/UserAvatar';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../utils/translations';

const NAV = [
  { key: 'profile', label: 'Profile', icon: User, path: '/student/settings/profile' },
  { key: 'account', label: 'Account', icon: Shield, path: '/student/settings/account' },
  { key: 'notifications', label: 'Notifications', icon: Bell, path: '/student/settings/notifications' },
  { key: 'appearance', label: 'Appearance', icon: Palette, path: '/student/settings/appearance' },
];

export default function Settings() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, setUser } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email] = useState(user?.email || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photo_url || '');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailNotif, setEmailNotif] = useState(user?.notifications_enabled ?? true);
  const [pushNotif, setPushNotif] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);

  const { language: globalLanguage, setLanguage: setGlobalLanguage } = usePreferencesStore();
  const [language, setLanguage] = useState(globalLanguage === 'bn' ? 'Bangla' : 'English');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setSaveMsg({ text, type });
    setTimeout(() => setSaveMsg(null), 3500);
  };

  useEffect(() => {
    setLanguage(globalLanguage === 'bn' ? 'Bangla' : 'English');
  }, [globalLanguage]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setPhone(user.phone || '');
      setPhotoUrl(user.photo_url || '');
      setEmailNotif(user.notifications_enabled ?? true);
    }

    getMe().then((fresh) => {
      if (fresh) {
        setName(fresh.name || '');
        setBio(fresh.bio || '');
        setPhone(fresh.phone || '');
        setPhotoUrl(fresh.photo_url || '');
        if (user) {
          setUser({ ...user, ...fresh } as any);
        }
      }
    }).catch(() => {});
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMsg('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMsg('Image size must be less than 5MB', 'error');
      return;
    }

    setUploadingImg(true);
    try {
      const res = await uploadAvatar(file);
      const newUrl = res.url;
      setPhotoUrl(newUrl);
      if (user) {
        setUser({ ...user, photo_url: newUrl } as any);
      }
      showMsg('Profile photo updated successfully!');
    } catch (err: any) {
      console.error('Failed to upload photo', err);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPhotoUrl(dataUrl);
        showMsg('Photo loaded. Click "Save changes" to apply.');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setPhotoUrl(customUrlInput.trim());
    setShowUrlInput(false);
    setCustomUrlInput('');
    showMsg('Photo URL applied! Click "Save changes" to persist.');
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    showMsg('Photo removed. Click "Save changes" to persist.');
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        name: name.trim() || user?.name || 'Student',
        bio: bio.trim(),
        phone: phone.trim(),
        photo_url: photoUrl,
        language,
        notifications_enabled: emailNotif,
      };

      const updated = await updateProfile(payload);

      // Sync Zustand AuthStore
      if (user) {
        setUser({
          ...user,
          ...updated,
          name: name.trim() || user?.name,
          photo_url: photoUrl,
        } as any);
      }

      showMsg('Profile settings saved successfully!');
    } catch {
      showMsg('Failed to save settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }, [name, bio, phone, photoUrl, language, emailNotif, user, setUser]);

  if (location.pathname === '/student/settings' || location.pathname === '/student/settings/') {
    return <Navigate to="/student/settings/profile" replace />;
  }

  const section = location.pathname.split('/').pop() || 'profile';

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <PageHeader title={t('settingsTitle')} description={t('settingsDesc')} />

      {saveMsg && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in ${
            saveMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>{saveMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.key;
            const tabLabel = item.key === 'profile' ? t('profileTab') : item.key === 'account' ? t('accountTab') : item.key === 'notifications' ? t('notificationsTab') : t('appearanceTab');
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  active ? 'bg-navy-900 text-white shadow-sm dark:bg-teal-600' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <Icon size={18} />
                {tabLabel}
              </Link>
            );
          })}
        </div>

        <Card className="lg:col-span-2 space-y-6">
          {section === 'profile' && (
            <>
              <h3 className="text-base font-extrabold text-navy-900 dark:text-white">{t('profileHeading')}</h3>

              {/* Profile Photo Upload & Preview */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <div className="relative group">
                  <UserAvatar
                    src={photoUrl}
                    name={name || user?.name}
                    email={email}
                    size="xl"
                    className="shadow-sm ring-2 ring-white dark:ring-slate-700"
                  />
                  {uploadingImg && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white">
                      <Loader2 size={20} className="animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Profile Photo</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload a square picture or link an image URL. If none is set, clean initials will be displayed.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={uploadingImg}
                      onClick={() => fileInputRef.current?.click()}
                      className="!bg-navy-900 dark:!bg-teal-600 flex items-center gap-1.5 text-xs"
                    >
                      {uploadingImg ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      <span>Upload</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <LinkIcon size={13} />
                      <span>Link URL</span>
                    </Button>

                    {photoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePhoto}
                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5 text-xs"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </Button>
                    )}
                  </div>

                  {showUrlInput && (
                    <div className="flex items-center gap-2 pt-2 animate-in fade-in duration-200">
                      <input
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-1 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
                      />
                      <Button type="button" size="sm" variant="primary" onClick={handleApplyCustomUrl} className="!bg-teal-600 text-xs">
                        Apply
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('nameLabel')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-2xl px-4 py-3 text-sm outline-none dark:bg-white dark:border-slate-300 dark:text-black dark:focus:border-slate-500 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Student ID</label>
                  <input
                    type="text"
                    value={user?.student_id || 'STU-2024-001'}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed dark:bg-slate-100 dark:border-slate-200 dark:text-slate-400 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1700-000000"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-2xl px-4 py-3 text-sm outline-none dark:bg-white dark:border-slate-300 dark:text-black dark:focus:border-slate-500 font-semibold"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('bioLabel')}</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none resize-none dark:bg-white dark:border-slate-300 dark:text-black dark:focus:border-slate-500 font-medium"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </>
          )}

          {section === 'account' && (
            <>
              <h3 className="text-base font-extrabold text-navy-900 dark:text-white">{t('accountHeading')}</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('emailLabel')}</label>
                <input type="email" value={email} disabled className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed dark:bg-slate-100 dark:border-slate-200 dark:text-slate-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('currentPasswordPlaceholder')}</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none dark:bg-white dark:border-slate-300 dark:text-black dark:focus:border-slate-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('newPasswordPlaceholder')}</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none dark:bg-white dark:border-slate-300 dark:text-black dark:focus:border-slate-500" />
                </div>
              </div>
            </>
          )}

          {section === 'notifications' && (
            <>
              <h3 className="text-base font-extrabold text-navy-900 dark:text-white">{t('notificationsHeading')}</h3>
              {[
                { label: t('emailNotificationsLabel'), desc: t('emailNotificationsDesc'), checked: emailNotif, set: setEmailNotif },
                { label: t('pushNotificationsLabel'), desc: t('pushNotificationsDesc'), checked: pushNotif, set: setPushNotif },
                { label: 'Assignment Reminders', desc: 'Receive reminders before assignment deadlines', checked: assignmentReminders, set: setAssignmentReminders },
              ].map((pref) => (
                <div key={pref.label} className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div>
                    <h4 className="text-sm font-bold text-navy-900 dark:text-white">{pref.label}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{pref.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => pref.set(!pref.checked)}
                    className={`w-11 h-6 rounded-full relative transition-all ${pref.checked ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pref.checked ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </>
          )}

          {section === 'appearance' && (
            <>
              <h3 className="text-base font-extrabold text-navy-900 dark:text-white">{t('appearanceHeading')}</h3>
              <div className="flex justify-between items-center py-3">
                <div>
                  <h4 className="text-sm font-bold text-navy-900 dark:text-white">{t('languageLabel')}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('languageDesc')}</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLanguage(val);
                    setGlobalLanguage(val === 'Bangla' ? 'bn' : 'en');
                  }}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option>English</option>
                  <option>Bangla</option>
                </select>
              </div>
              <div className="flex justify-between items-center py-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-navy-900 dark:text-white">{t('darkModeLabel')}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('darkModeDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`w-11 h-6 rounded-full relative transition-all ${isDark ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDark ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex items-center justify-between">
            <Button variant="primary" className="!bg-navy-900 dark:!bg-teal-600 ml-auto font-bold px-6" onClick={handleSave} disabled={saving}>
              {saving ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  <span>{t('submittingBtn')}</span>
                </div>
              ) : (
                t('saveChanges')
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

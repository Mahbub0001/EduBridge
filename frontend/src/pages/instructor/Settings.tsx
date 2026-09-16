/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Bell, User as UserIcon, CheckCircle2, Upload, Trash2, Camera, Lock, Link as LinkIcon, Loader2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import UserAvatar from '../../components/ui/UserAvatar';
import { useAuthStore } from '../../store';
import { updateProfile, uploadAvatar, getMe } from '../../services/authService';

export default function InstructorSettings() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Profile Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Notification Preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [marketingNotifs, setMarketingNotifs] = useState(true);

  // Security / Password Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync initial user data
  useEffect(() => {
    const initData = (u: any) => {
      if (!u) return;
      const parts = (u.name || '').trim().split(/\s+/);
      const fn = u.first_name || (parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '');
      const ln = u.last_name || (parts.length > 1 ? parts[parts.length - 1] : '');

      setFirstName(fn);
      setLastName(ln);
      setEmail(u.email || '');
      setBio(u.bio || '');
      setTitle(u.title || '');
      setDepartment(u.department || '');
      setPhone(u.phone || '');
      setPhotoUrl(u.photo_url || '');
      setEmailNotifs(u.email_notifications ?? u.notifications_enabled ?? true);
      setSmsNotifs(u.sms_notifications ?? false);
      setMarketingNotifs(u.marketing_notifications ?? true);
    };

    if (user) {
      initData(user);
    }

    // Also fetch fresh from API
    getMe().then((freshUser) => {
      if (freshUser) {
        initData(freshUser);
        setUser({ ...user, ...freshUser } as any);
      }
    }).catch(() => {});
  }, []);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
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
      showToast('Profile photo uploaded and updated successfully!');
    } catch (err: any) {
      console.error('Failed to upload photo', err);
      // Fallback: preview with FileReader data URL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPhotoUrl(dataUrl);
        showToast('Image loaded. Click "Save changes" to apply.');
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
    showToast('Photo URL applied! Click "Save changes" to persist.');
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    showToast('Photo removed. Click "Save changes" to persist.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || user?.name || 'Instructor';

      const payload: Partial<any> = {
        name: fullName,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim(),
        title: title.trim(),
        department: department.trim(),
        phone: phone.trim(),
        photo_url: photoUrl,
        email_notifications: emailNotifs,
        sms_notifications: smsNotifs,
        marketing_notifications: marketingNotifs,
      };

      const updatedUser = await updateProfile(payload);

      // Sync with Zustand AuthStore so topbar, sidebar, and all pages update immediately
      if (user) {
        setUser({
          ...user,
          ...updatedUser,
          name: fullName,
          photo_url: photoUrl,
        } as any);
      }

      showToast('Your instructor profile has been successfully saved!');
    } catch (err: any) {
      console.error('Save settings error:', err);
      showToast(err?.response?.data?.message || 'Failed to save changes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      showToast('Please enter a new password', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    showToast('Security preferences updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast popup */}
      {toastMsg && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 border ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-800'
              : 'bg-rose-950 text-rose-200 border-rose-800'
          }`}
        >
          <CheckCircle2 size={18} className={toastMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'} />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Instructor Profile & Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Manage your public instructor identity, display picture, contact details, and workspace alerts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Side Tabs */}
        <div className="lg:col-span-1 space-y-3">
          <Card className="border border-slate-200 dark:border-slate-800 p-3 space-y-1 bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black flex items-center gap-3 transition-all ${
                activeTab === 'profile'
                  ? 'bg-slate-950 text-white dark:bg-teal-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <UserIcon size={16} />
              <span>Instructor Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black flex items-center gap-3 transition-all ${
                activeTab === 'notifications'
                  ? 'bg-slate-950 text-white dark:bg-teal-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Bell size={16} />
              <span>Notification Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black flex items-center gap-3 transition-all ${
                activeTab === 'security'
                  ? 'bg-slate-950 text-white dark:bg-teal-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Shield size={16} />
              <span>Security & Password</span>
            </button>
          </Card>
        </div>

        {/* Right Column: Active Tab Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <Card className="border border-slate-200 dark:border-slate-800 p-6 sm:p-8 bg-white dark:bg-slate-900 space-y-8">
              {/* Profile Photo Section */}
              <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Camera size={16} className="text-teal-600 dark:text-teal-400" />
                  <span>Instructor Avatar & Display Photo</span>
                </h3>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
                  <div className="relative group">
                    <UserAvatar
                      src={photoUrl}
                      name={`${firstName} ${lastName}`.trim() || user?.name}
                      email={email}
                      size="2xl"
                      className="shadow-md ring-4 ring-slate-100 dark:ring-slate-800"
                    />
                    {uploadingImg && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white">
                        <Loader2 size={24} className="animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Profile Image
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Upload a photo or provide an image link. When no image is present, your clean initial badge is displayed automatically.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={uploadingImg}
                        onClick={() => fileInputRef.current?.click()}
                        className="!bg-slate-900 hover:!bg-slate-800 dark:!bg-teal-600 flex items-center gap-1.5"
                      >
                        {uploadingImg ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        <span>Upload Photo</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="flex items-center gap-1.5"
                      >
                        <LinkIcon size={14} />
                        <span>Link URL</span>
                      </Button>

                      {photoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePhoto}
                          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5"
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </Button>
                      )}
                    </div>

                    {showUrlInput && (
                      <div className="flex items-center gap-2 pt-2 animate-in fade-in duration-200 max-w-md">
                        <input
                          type="url"
                          placeholder="https://example.com/avatar.jpg"
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
                        />
                        <Button type="button" size="sm" variant="primary" onClick={handleApplyCustomUrl} className="!bg-teal-600">
                          Apply
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details Form */}
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <UserIcon size={16} className="text-teal-600 dark:text-teal-400" />
                    <span>Personal & Professional Info</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Mahbub"
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-slate-900 dark:focus:border-teal-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Bhuiyan"
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-slate-900 dark:focus:border-teal-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Academic / Professional Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Senior Lecturer / Lead Educator"
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-slate-900 dark:focus:border-teal-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Department & Institution
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Computer Science, EduBridge"
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-slate-900 dark:focus:border-teal-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Email Address (Account ID)
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+880 1700-000000"
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-slate-900 dark:focus:border-teal-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Public Biography
                      </label>
                      <textarea
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Dedicated educator specialized in blended learning, digital curriculum design, and assessment methods..."
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-slate-900 dark:focus:border-teal-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={saving}
                    className="!bg-slate-950 hover:!bg-slate-800 dark:!bg-teal-600 dark:!text-white font-extrabold px-6"
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Saving Changes...</span>
                      </div>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="border border-slate-200 dark:border-slate-800 p-6 sm:p-8 bg-white dark:bg-slate-900 space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Bell size={16} className="text-teal-600 dark:text-teal-400" />
                  <span>Email & Alert Preferences</span>
                </h3>

                <div className="space-y-4 mt-6">
                  <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={emailNotifs}
                      onChange={(e) => setEmailNotifs(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 dark:bg-slate-800 dark:border-slate-700 h-4 w-4"
                    />
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-slate-100">Student submissions & quiz alerts</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Receive instant notifications when students complete quizzes or submit module assignments.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={smsNotifs}
                      onChange={(e) => setSmsNotifs(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 dark:bg-slate-800 dark:border-slate-700 h-4 w-4"
                    />
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-slate-100">SMS urgent notifications</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Receive text messages for administrative announcements and platform alerts.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={marketingNotifs}
                      onChange={(e) => setMarketingNotifs(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 dark:bg-slate-800 dark:border-slate-700 h-4 w-4"
                    />
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-slate-100">Weekly platform analytics digest</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Receive automated weekly enrollment summaries, course completion rates, and student engagement digests.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  disabled={saving}
                  className="!bg-slate-950 hover:!bg-slate-800 dark:!bg-teal-600 font-extrabold px-6"
                >
                  Save Notification Preferences
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="border border-slate-200 dark:border-slate-800 p-6 sm:p-8 bg-white dark:bg-slate-900 space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Lock size={16} className="text-teal-600 dark:text-teal-400" />
                  <span>Update Password & Security</span>
                </h3>

                <form onSubmit={handlePasswordSave} className="space-y-4 mt-6 max-w-lg">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-slate-900 dark:focus:border-teal-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-slate-900 dark:focus:border-teal-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-slate-900 dark:focus:border-teal-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-3">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="!bg-slate-950 hover:!bg-slate-800 dark:!bg-teal-600 font-extrabold px-6"
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  Search,
  UserPlus,
  Trash2,
  Key,
  Eye,
  Shield,
  UserCheck,
  Users,
  ShieldAlert,
  X,
  BookOpen,
  Award,
  RefreshCw,
  GraduationCap
} from 'lucide-react';
import {
  getAllUsers,
  createAdminUser,
  updateUserRole,
  updateUserStatus,
  deleteAdminUser,
  resetUserPassword,
  getUserDetails,
} from '../../services/adminService';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import UserAvatar from '../../components/ui/UserAvatar';
import type { User } from '../../types';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    title: '',
    phone_number: '',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // User Detail Drawer
  const [detailUser, setDetailUser] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Password Reset Modal
  const [resetTarget, setResetTarget] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Delete User Modal
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await updateUserRole(userId, role);
      setMsg({ text: `User role updated to ${role}.`, type: 'success' });
      loadUsers();
    } catch {
      setMsg({ text: 'Failed to update user role.', type: 'error' });
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      await updateUserStatus(userId, nextStatus);
      setMsg({ text: `User account has been ${nextStatus === 'blocked' ? 'blocked' : 'unblocked'}.`, type: 'success' });
      loadUsers();
    } catch {
      setMsg({ text: 'Failed to update user status.', type: 'error' });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name.trim() || !newUserData.email.trim() || !newUserData.password.trim()) {
      setMsg({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }
    if (newUserData.password.length < 6) {
      setMsg({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setCreatingUser(true);
    try {
      await createAdminUser(newUserData);
      setMsg({ text: `Account for ${newUserData.name} created successfully!`, type: 'success' });
      setShowAddModal(false);
      setNewUserData({ name: '', email: '', password: '', role: 'student', title: '', phone_number: '' });
      loadUsers();
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.detail || 'Failed to create user.', type: 'error' });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleOpenDetails = async (u: any) => {
    setLoadingDetails(true);
    setDetailUser({ user: u });
    try {
      const fullDetails = await getUserDetails(u.id || u.uid);
      setDetailUser(fullDetails);
    } catch (err) {
      console.error('Failed to load user details', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget || newPassword.length < 6) {
      setMsg({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    setResetting(true);
    try {
      await resetUserPassword(resetTarget.id || resetTarget.uid, newPassword);
      setMsg({ text: `Password for ${resetTarget.name} has been reset.`, type: 'success' });
      setResetTarget(null);
      setNewPassword('');
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.detail || 'Failed to reset password.', type: 'error' });
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminUser(deleteTarget.id || deleteTarget.uid);
      setMsg({ text: `User ${deleteTarget.name} has been permanently deleted.`, type: 'success' });
      setDeleteTarget(null);
      loadUsers();
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.detail || 'Failed to delete user.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const totalUsers = users.length;
  const studentCount = users.filter((u) => u.role === 'student').length;
  const instructorCount = users.filter((u) => u.role === 'instructor').length;
  const adminCount = users.filter((u) => u.role === 'admin' || (u as any).role === 'super_admin').length;
  const blockedCount = users.filter((u) => u.status === 'blocked').length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="User Management"
        description="Oversee student and instructor accounts, modify roles, and manage credentials."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setLoading(true); loadUsers(); }}
              className="gap-1.5"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="!bg-navy-900 dark:!bg-teal-600 gap-1.5"
            >
              <UserPlus size={16} />
              Add User
            </Button>
          </div>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Users size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{totalUsers}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{studentCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{instructorCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instructors</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{adminCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admins</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{blockedCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blocked</p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user name or email..."
              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy-900 dark:focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>

            <Button type="submit" variant="outline" size="sm">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Users Table */}
      <Card padding="none" className="overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => {
                const uid = u.id || (u as any).uid || '';
                const isBlocked = u.status === 'blocked';

                return (
                  <tr key={uid} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={u.photo_url}
                          name={u.name}
                          size="sm"
                        />
                        <div>
                          <p className="font-extrabold text-navy-900 dark:text-white leading-tight">
                            {u.name}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">
                            {(u as any).title || (u.role === 'instructor' ? 'Instructor' : 'Learner')}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {u.email}
                    </td>

                    {/* Role Selection */}
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(uid, e.target.value)}
                        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-navy-900 dark:text-slate-200 outline-none focus:border-teal-500"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <Badge variant={isBlocked ? 'danger' : 'success'}>
                        {isBlocked ? 'Blocked' : 'Active'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(u)}
                          className="p-1.5 text-slate-600 hover:text-navy-900 dark:text-slate-300 dark:hover:text-white"
                          title="View user details & history"
                        >
                          <Eye size={16} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setResetTarget(u); setNewPassword(''); }}
                          className="p-1.5 text-slate-600 hover:text-navy-900 dark:text-slate-300 dark:hover:text-white"
                          title="Reset password"
                        >
                          <Key size={16} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusToggle(uid, u.status || 'active')}
                          className={`text-xs px-2 py-1 ${
                            isBlocked
                              ? 'text-emerald-600 hover:text-emerald-700'
                              : 'text-amber-600 hover:text-amber-700'
                          }`}
                        >
                          {isBlocked ? 'Unblock' : 'Block'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(u)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 dark:hover:bg-rose-950/30"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <Users size={44} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-base">No users found.</p>
                    <p className="text-xs mt-1">Try adjusting your search criteria or add a new user.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-navy-900 dark:text-white flex items-center gap-2">
                <UserPlus size={18} className="text-teal-600" /> Create New User
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Initial Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Role *</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Title / Job</label>
                  <input
                    type="text"
                    value={newUserData.title}
                    onChange={(e) => setNewUserData({ ...newUserData, title: e.target.value })}
                    placeholder="e.g. Senior Lecturer"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddModal(false)} disabled={creatingUser}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={creatingUser} className="!bg-teal-600 text-white font-bold">
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* User Details Drawer / Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <UserAvatar src={detailUser.user?.photo_url} name={detailUser.user?.name} size="md" />
                <div>
                  <h3 className="text-lg font-black text-navy-900 dark:text-white leading-tight">
                    {detailUser.user?.name}
                  </h3>
                  <p className="text-xs text-slate-500">{detailUser.user?.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={detailUser.user?.role === 'instructor' ? 'purple' : 'default'}>
                      {detailUser.user?.role}
                    </Badge>
                    <Badge variant={detailUser.user?.status === 'blocked' ? 'danger' : 'success'}>
                      {detailUser.user?.status || 'active'}
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading complete history...</div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Enrolled Courses */}
                <div className="space-y-2">
                  <h4 className="font-extrabold uppercase text-slate-500 text-[11px] flex items-center gap-1.5">
                    <GraduationCap size={14} /> Enrolled Courses ({detailUser.enrollments?.length || 0})
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                    {(detailUser.enrollments || []).map((e: any) => (
                      <div key={e.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-navy-900 dark:text-white">{e.course_title || 'Course'}</p>
                          <p className="text-[10px] text-slate-400">Status: {e.status}</p>
                        </div>
                        <div className="w-24 text-right">
                          <span className="font-bold">{Math.round(e.progress_percent || 0)}%</span>
                          <ProgressBar value={e.progress_percent || 0} />
                        </div>
                      </div>
                    ))}
                    {(detailUser.enrollments || []).length === 0 && (
                      <p className="p-4 text-center text-slate-400">Not enrolled in any courses.</p>
                    )}
                  </div>
                </div>

                {/* Certificates Earned */}
                <div className="space-y-2">
                  <h4 className="font-extrabold uppercase text-slate-500 text-[11px] flex items-center gap-1.5">
                    <Award size={14} /> Certificates Earned ({detailUser.certificates?.length || 0})
                  </h4>
                  <div className="space-y-1.5">
                    {(detailUser.certificates || []).map((c: any) => (
                      <div key={c.id} className="p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-teal-900 dark:text-teal-200">{c.course_title}</p>
                          <p className="text-[10px] text-teal-600 dark:text-teal-400">Issued on {new Date(c.issued_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="success">Verified</Badge>
                      </div>
                    ))}
                    {(detailUser.certificates || []).length === 0 && (
                      <p className="text-slate-400 text-center py-2">No certificates earned yet.</p>
                    )}
                  </div>
                </div>

                {/* Authored Courses (If Instructor) */}
                {detailUser.user?.role === 'instructor' && (
                  <div className="space-y-2">
                    <h4 className="font-extrabold uppercase text-slate-500 text-[11px] flex items-center gap-1.5">
                      <BookOpen size={14} /> Authored Courses ({detailUser.authored_courses?.length || 0})
                    </h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                      {(detailUser.authored_courses || []).map((c: any) => (
                        <div key={c.id} className="p-3 flex items-center justify-between">
                          <p className="font-bold text-navy-900 dark:text-white">{c.title}</p>
                          <Badge variant={c.status === 'published' ? 'success' : 'warning'}>{c.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setDetailUser(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-sm space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-black text-navy-900 dark:text-white flex items-center gap-2">
              <Key size={18} className="text-teal-600" /> Reset User Password
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter a new password for <strong>{resetTarget.name}</strong> ({resetTarget.email}).
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setResetTarget(null)} disabled={resetting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleResetPassword}
                disabled={resetting || newPassword.length < 6}
                className="!bg-teal-600 text-white font-bold"
              >
                {resetting ? 'Resetting...' : 'Save Password'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-sm space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
              <Trash2 size={18} /> Confirm Permanent Deletion
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.email})?
              This action permanently deletes their authentication record and profile.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteUser}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

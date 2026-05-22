import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getAllUsers, updateUserRole, updateUserStatus } from '../../services/adminService';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import type { User } from '../../types';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getAllUsers({ search: search || undefined, role: roleFilter || undefined, status: statusFilter || undefined })
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter]);

  const refreshUsers = () => getAllUsers({ search: search || undefined, role: roleFilter || undefined, status: statusFilter || undefined })
    .then(setUsers).catch(() => setUsers([]));

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await updateUserRole(userId, role);
      setMsg(`Role updated to ${role}`);
      refreshUsers();
    } catch { setMsg('Failed to update role'); }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      await updateUserStatus(userId, newStatus);
      setMsg(`User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'}`);
      refreshUsers();
    } catch { setMsg('Failed to update status'); }
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading users...</div>;

  return (
    <div className="space-y-8">
      <PageHeader title="User Management" description="Manage students, instructors, and roles." />

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {msg}
        </div>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-navy-900"
              placeholder="Search by name or email..."
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy-900">
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy-900">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Name</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Email</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Role</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-extrabold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id || u.uid} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-navy-900">{u.name}</td>
                  <td className="px-6 py-4 text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id || u.uid || '', e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-navy-900"
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={u.status === 'blocked' ? 'danger' : 'success'}>
                      {u.status || 'active'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant={u.status === 'blocked' ? 'outline' : 'danger'}
                      size="sm"
                      onClick={() => handleStatusToggle(u.id || u.uid || '', u.status || 'active')}
                    >
                      {u.status === 'blocked' ? 'Unblock' : 'Block'}
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

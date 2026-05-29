// ✅ FIX #9: import useCallback
import { useState, useEffect, useCallback } from 'react';
import userService from '../services/user.service';
import adminService from '../services/admin.service';
import { useAuth } from '../context/AuthContext';
import QPBadge from '../components/QPBadge';
import { ROLE_LABELS } from '../utils/constants';
import { timeAgo } from '../utils/helpers';

export default function UserListPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const isAdmin = user?.role === 'admin';
  const isSenior = user?.role === 'senior';

  // ✅ FIX #9: wrap loadUsers in useCallback so useEffect dep is stable
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.listUsers({ role: roleFilter || undefined });
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  // ✅ FIX #9: add loadUsers to dependency array
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleRestrict = async (userId) => {
    const u = users.find(u => u._id === userId);
    const prev = users;
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, restrictedAt: u.restrictedAt ? null : new Date() } : u));
    try {
      await userService.restrictUser(userId);
    } catch (err) {
      setUsers(prev);
      alert(err.message);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this user? This cannot be undone.')) return;
    const prev = users;
    setUsers(prev => prev.filter(u => u._id !== userId));
    try {
      await userService.removeUser(userId);
    } catch (err) {
      setUsers(prev);
      alert(err.message);
    }
  };

  const handleAssignRole = async (userId, role) => {
    const prev = users;
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
    try {
      await adminService.assignRole({ userId, role });
    } catch (err) {
      setUsers(prev);
      alert(err.message);
    }
  };

  const handleAddToWhitelist = async (e) => {
    e.preventDefault();
    if (!wlEmail) return;
    const entry = {
      _id: `temp-${Date.now()}`,
      email: wlEmail,
      note: wlNote,
      addedBy: { name: user?.name },
      addedAt: new Date().toISOString()
    };

    const prev = whitelist;
    setWhitelist(prev => [...prev, entry]);
    setWlEmail('');
    setWlNote('');

    try {
      await adminService.addToWhitelist({
        email: wlEmail,
        note: wlNote
      });
    } catch (err) {
      setWhitelist(prev);
      setWlEmail(wlEmail);
      setWlNote(wlNote);
      alert(err.message);
    }
  };

  const handleRemoveFromWhitelist = async (id) => {
    if (!confirm('Remove this email from the whitelist?')) return;

    const prev = whitelist;
    setWhitelist(prev => prev.filter(e => e._id !== id));

    try {
      await adminService.removeFromWhitelist(id);
    } catch (err) {
      setWhitelist(prev);
      alert(err.message);
    }
  };

  const handleApproveAccessRequest = async (requestId) => {
    const prev = accessRequests;
    setAccessRequests(prev => prev.filter(r => r._id !== requestId));

    try {
      await adminService.approveAccessRequest(requestId);
    } catch (err) {
      setAccessRequests(prev);
      alert(err.message);
    }
  };

  const handleRejectAccessRequest = async (requestId) => {
    const prev = accessRequests;
    setAccessRequests(prev => prev.filter(r => r._id !== requestId));

    try {
      await adminService.rejectAccessRequest(
        requestId,
        rejectNote[requestId] || ''
      );

      setRejectNote(prev => ({
        ...prev,
        [requestId]: ''
      }));
    } catch (err) {
      setAccessRequests(prev);
      alert(err.message);
    }
  };
  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">User Management</h1>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="input flex-1"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input w-auto">
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="moderator">Moderator</option>
          <option value="senior">Senior</option>
          {isAdmin && <option value="admin">Admin</option>}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Loading users...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="text-left p-3 font-medium text-muted">User</th>
                <th className="text-left p-3 font-medium text-muted">Role</th>
                <th className="text-left p-3 font-medium text-muted">QP</th>
                <th className="text-left p-3 font-medium text-muted">Status</th>
                <th className="text-left p-3 font-medium text-muted">Joined</th>
                {(isSenior || isAdmin) && <th className="text-left p-3 font-medium text-muted">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="p-3">
                    <div className="font-medium text-primary">{u.name}</div>
                    <div className="text-xs text-muted">@{u.username}</div>
                  </td>
                  <td className="p-3">
                    {isAdmin ? (
                      <select
                        value={u.role}
                        onChange={e => handleAssignRole(u._id, e.target.value)}
                        className="input py-1 text-xs w-auto"
                      >
                        <option value="student">Student</option>
                        <option value="moderator">Moderator</option>
                        <option value="senior">Senior</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">{ROLE_LABELS[u.role] || u.role}</span>
                    )}
                  </td>
                  <td className="p-3"><QPBadge qp={u.qp || 0} small /></td>
                  <td className="p-3">
                    {u.restrictedAt ? (
                      <span className="text-xs text-red-600">Restricted</span>
                    ) : u.status === 'blocked' ? (
                      <span className="text-xs text-red-600">Blocked</span>
                    ) : (
                      <span className="text-xs text-green-600">Active</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted">{timeAgo(u.createdAt)}</td>
                  {(isSenior || isAdmin) && (
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestrict(u._id)}
                          className="text-xs px-2 py-1 border border-border rounded hover:border-orange-500 text-muted"
                        >
                          {u.restrictedAt ? 'Unrestrict' : 'Restrict'}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleRemove(u._id)}
                            className="text-xs px-2 py-1 border border-red-200 rounded text-red-500 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}

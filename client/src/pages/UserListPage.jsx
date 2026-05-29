import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import userService from '../services/user.service';
import adminService from '../services/admin.service';
import { useAuth } from '../context/AuthContext';
import QPBadge from '../components/QPBadge';
import { ROLE_LABELS } from '../utils/constants';
import { timeAgo } from '../utils/helpers';
import Breadcrumb from '../components/Breadcrumb';

export default function UserListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [whitelist, setWhitelist] = useState([]);
  const [wlLoading, setWlLoading] = useState(false);
  const [wlEmail, setWlEmail] = useState('');
  const [wlNote, setWlNote] = useState('');

  const [accessRequests, setAccessRequests] = useState([]);
  const [arLoading, setArLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState({});

  const isAdmin = user?.role === 'admin';
  const isSenior = user?.role === 'senior';

  useEffect(() => { loadUsers(); }, [roleFilter]);
  useEffect(() => { if (isAdmin && tab === 'whitelist') loadWhitelist(); }, [tab, isAdmin]);
  useEffect(() => { if (isAdmin && tab === 'requests') loadAccessRequests(); }, [tab, isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.listUsers({ role: roleFilter || undefined });
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadWhitelist = async () => {
    setWlLoading(true);
    try {
      const data = await adminService.getWhitelist();
      setWhitelist(data);
    } catch (err) {
      console.error(err);
    } finally {
      setWlLoading(false);
    }
  };

  const loadAccessRequests = async () => {
    setArLoading(true);
    try {
      const data = await adminService.getAccessRequests('pending');
      setAccessRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setArLoading(false);
    }
  };

const handleRestrict = async (userId) => {
    const u = users.find(x => x._id === userId);
    const action = u?.restrictedAt ? ' unrestrict ' : ' restrict ';
    if (!confirm(`Are you sure you want to${action} "${u?.name}"?`)) return;
    const prev = users;
    setUsers(prev => prev.map(x => x._id === userId ? { ...x, restrictedAt: x.restrictedAt ? null : new Date() } : x));
    try {
      await userService.restrictUser(userId);
    } catch (err) {
      setUsers(prev);
      alert(err.message);
    }
  };

  const handleAssignRole = async (userId, role) => {
    const u = users.find(x => x._id === userId);
    if (!confirm(`Change "${u?.name}"'s role to ${role}?`)) return;
    const prev = users;
    setUsers(prev => prev.map(x => x._id === userId ? { ...x, role } : x));
    try {
      await adminService.assignRole({ userId, role });
    } catch (err) {
      setUsers(prev);
      alert(err.message);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this user? This cannot be undone.')) return;
    try {
      await userService.removeUser(userId);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddToWhitelist = async (e) => {
    e.preventDefault();
    if (!wlEmail) return;
    try {
      await adminService.addToWhitelist({ email: wlEmail, note: wlNote });
      setWlEmail('');
      setWlNote('');
      loadWhitelist();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveFromWhitelist = async (id) => {
    if (!confirm('Remove this email from the whitelist?')) return;
    try {
      await adminService.removeFromWhitelist(id);
      loadWhitelist();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveAccessRequest = async (requestId) => {
    try {
      await adminService.approveAccessRequest(requestId);
      loadAccessRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectAccessRequest = async (requestId) => {
    const note = rejectNote[requestId] || '';
    try {
      await adminService.rejectAccessRequest(requestId, note);
      setRejectNote(prev => ({ ...prev, [requestId]: '' }));
      loadAccessRequests();
    } catch (err) {
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
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'Users' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">User Management</h1>
      </div>

      {isAdmin && (
        <div className="flex gap-2 mb-6 border-b border-border">
          {['users', 'whitelist', 'requests'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-primary'
              }`}
            >
              {t === 'users' ? 'Users' : t === 'whitelist' ? 'Email Whitelist' : 'Access Requests'}
            </button>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <>
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
                        <Link to={`/users/${u._id}`} className="font-medium text-primary hover:underline">{u.name}</Link>
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
        </>
      )}

      {tab === 'whitelist' && isAdmin && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-primary mb-4">Add Email to Whitelist</h3>
            <form onSubmit={handleAddToWhitelist} className="flex gap-3">
              <input
                type="email"
                value={wlEmail}
                onChange={e => setWlEmail(e.target.value)}
                placeholder="admin@example.com"
                className="input flex-1"
                required
              />
              <input
                value={wlNote}
                onChange={e => setWlNote(e.target.value)}
                placeholder="Note (optional)"
                className="input flex-1"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Add to Whitelist
              </button>
            </form>
          </div>

          {wlLoading ? (
            <div className="text-center py-8 text-muted">Loading...</div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted">Email</th>
                    <th className="text-left p-3 font-medium text-muted">Added By</th>
                    <th className="text-left p-3 font-medium text-muted">Note</th>
                    <th className="text-left p-3 font-medium text-muted">Added</th>
                    <th className="text-left p-3 font-medium text-muted">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {whitelist.map(entry => (
                    <tr key={entry._id} className="border-b border-border last:border-0 hover:bg-surface">
                      <td className="p-3 font-medium text-primary">{entry.email}</td>
                      <td className="p-3 text-xs text-muted">{entry.addedBy?.name || '—'}</td>
                      <td className="p-3 text-xs text-muted">{entry.note || '—'}</td>
                      <td className="p-3 text-xs text-muted">{timeAgo(entry.addedAt)}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleRemoveFromWhitelist(entry._id)}
                          className="text-xs px-2 py-1 border border-red-200 rounded text-red-500 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {whitelist.length === 0 && (
                <div className="text-center py-8 text-muted">No emails in whitelist.</div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'requests' && isAdmin && (
        <div className="space-y-6">
          {arLoading ? (
            <div className="text-center py-12 text-muted">Loading...</div>
          ) : accessRequests.length === 0 ? (
            <div className="card p-8 text-center text-muted">No pending access requests.</div>
          ) : (
            accessRequests.map(req => (
              <div key={req._id} className="card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-primary">{req.name}</div>
                    <div className="text-sm text-muted">@{req.username} · {req.email}</div>
                    <div className="text-xs text-muted mt-1">Requested {timeAgo(req.requestedAt)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveAccessRequest(req._id)}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectAccessRequest(req._id)}
                      className="text-xs px-3 py-1.5 border border-red-200 rounded text-red-500 hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a note (optional)"
                    value={rejectNote[req._id] || ''}
                    onChange={e => setRejectNote(prev => ({ ...prev, [req._id]: e.target.value }))}
                    className="input flex-1 text-sm"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

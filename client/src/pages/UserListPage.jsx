import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userService from '../services/user.service';
import adminService from '../services/admin.service';
import faqService from '../services/faq.service';
import { useAuth } from '../context/AuthContext';
import QPBadge from '../components/QPBadge';
import { RoleBadge } from '../components/Badge';
import { timeAgo } from '../utils/helpers';
import Breadcrumb from '../components/Breadcrumb';
import { Check, X, Trophy, Crown } from 'lucide-react';

export default function UserListPage() {
  const { user } = useAuth();
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

  const [faqConversionRequests, setFaqConversionRequests] = useState([]);
  const [fcrLoading, setFcrLoading] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isSenior = user?.role === 'senior';

  useEffect(() => { loadUsers(); }, [roleFilter]);
  useEffect(() => { if (isAdmin && tab === 'whitelist') loadWhitelist(); }, [tab, isAdmin]);
  useEffect(() => { if (isAdmin && tab === 'requests') loadAccessRequests(); }, [tab, isAdmin]);
  useEffect(() => { if (isAdmin && tab === 'faq-requests') loadFaqConversionRequests(); }, [tab, isAdmin]);

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

  const loadFaqConversionRequests = async () => {
    setFcrLoading(true);
    try {
      const data = await faqService.listConversionRequests();
      setFaqConversionRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFcrLoading(false);
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

  const handleBlock = async (userId) => {
    if (!confirm('Block this user? They will not be able to access their account.')) return;
    const prev = users;
    setUsers(prev => prev.map(x => x._id === userId ? { ...x, status: 'blocked', restrictedAt: new Date() } : x));
    try {
      await adminService.blockUser(userId);
    } catch (err) {
      setUsers(prev);
      alert(err.message);
    }
  };

  const handleUnblock = async (userId) => {
    if (!confirm('Unblock this user? They will regain access to their account.')) return;
    const prev = users;
    setUsers(prev => prev.map(x => x._id === userId ? { ...x, status: 'active', restrictedAt: null } : x));
    try {
      await adminService.unblockUser(userId);
    } catch (err) {
      setUsers(prev);
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

  const handleApproveFaqConversion = async (requestId) => {
    if (!confirm('Approve this FAQ conversion? The FAQ will be created.')) return;
    try {
      await faqService.approveConversionRequest(requestId);
      loadFaqConversionRequests();
    } catch (err) {
      alert(err.message || 'Failed to approve conversion request');
    }
  };

  const handleRejectFaqConversion = async (requestId, adminNote) => {
    try {
      await faqService.rejectConversionRequest(requestId, adminNote);
      loadFaqConversionRequests();
    } catch (err) {
      alert(err.message || 'Failed to reject conversion request');
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
<div className="max-w-4xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'Leaderboard' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Leaderboard</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setTab('whitelist')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'whitelist' ? 'bg-primary text-white' : 'bg-slate-100 text-muted hover:bg-slate-200'
              }`}
            >
              Whitelist
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'requests' ? 'bg-primary text-white' : 'bg-slate-100 text-muted hover:bg-slate-200'
              }`}
            >
              Access Requests
            </button>
            <button
              onClick={() => setTab('faq-requests')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'faq-requests' ? 'bg-primary text-white' : 'bg-slate-100 text-muted hover:bg-slate-200'
              }`}
            >
              FAQ Requests
            </button>
          </div>
        )}
      </div>

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
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="select w-auto">
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="moderator">Moderator</option>
              <option value="senior">Senior</option>
              {isAdmin && <option value="admin">Admin</option>}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted">Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted">No users found</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((u) => {
                const rank = filtered.indexOf(u) + 1;
                const isTop3 = rank <= 3;
                const isCurrentUser = u._id === user._id;
                const rankIcon = rank === 1 ? <Crown className="w-5 h-5 text-amber-500" /> : rank === 2 ? <Trophy className="w-5 h-5 text-slate-400" /> : rank === 3 ? <Trophy className="w-5 h-5 text-orange-400" /> : null;

                return (
                  <div
                    key={u._id}
                    className={`card-padded flex items-center gap-4 ${
                      isCurrentUser ? 'ring-2 ring-primary/20 bg-primary/[0.02]' : ''
                    } ${isTop3 ? 'border-2' : 'border'}`}
                    style={isTop3 ? {
                      borderColor: rank === 1 ? '#fbbf24' : rank === 2 ? '#cbd5e1' : rank === 3 ? '#fb923c' : undefined,
                    } : undefined}
                  >
                    <div className="w-8 text-center shrink-0">
                      {rankIcon || <span className="text-sm font-semibold text-muted">{rank}</span>}
                    </div>
                    <Link to={`/users/${u._id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate text-primary">{u.name}</p>
                        {isCurrentUser && <span className="text-xs text-muted">(you)</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted">@{u.username}</span>
                        <span className="text-muted">&middot;</span>
                        <RoleBadge role={u.role} />
                      </div>
                    </Link>
                    <div className="text-right shrink-0">
                      {u.status === 'blocked' && (
                        <span className="inline-block text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded mb-1">Blocked</span>
                      )}
                      <QPBadge qp={u.qp || 0} />
                      <p className="text-xs text-muted mt-0.5">joined {timeAgo(u.createdAt)}</p>
                    </div>
                    {(isSenior || isAdmin) && (
                      <div className="flex gap-1.5 shrink-0">
                        {isAdmin && (
                          <select
                            value={u.role}
                            onChange={e => handleAssignRole(u._id, e.target.value)}
                            className="input-sm text-xs"
                          >
                            <option value="student">Student</option>
                            <option value="moderator">Moderator</option>
                            <option value="senior">Senior</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                        <button
                          onClick={() => handleRestrict(u._id)}
                          className={`btn-ghost-sm ${u.restrictedAt ? 'text-red-500' : ''}`}
                          title={u.restrictedAt ? 'Unrestrict' : 'Restrict'}
                        >
                          {u.restrictedAt ? 'Unrestrict' : 'Restrict'}
                        </button>
                        {isAdmin && (
                          u.status === 'blocked' ? (
                            <button
                              onClick={() => handleUnblock(u._id)}
                              className="btn-ghost-sm text-green-600"
                              title="Unblock"
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(u._id)}
                              className="btn-ghost-sm text-red-500"
                              title="Block"
                            >
                              Block
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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

      {tab === 'faq-requests' && isAdmin && (
        <div className="space-y-6">
          {fcrLoading ? (
            <div className="text-center py-12 text-muted">Loading...</div>
          ) : faqConversionRequests.length === 0 ? (
            <div className="card p-8 text-center text-muted">No FAQ conversion requests.</div>
          ) : (
            faqConversionRequests.map(req => (
              <div key={req._id} className="card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        req.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                      <span className="text-xs text-muted">by {req.requestedBy?.name || 'Unknown'}</span>
                      <span className="text-xs text-muted">· {timeAgo(req.requestedAt)}</span>
                    </div>
                    <div className="font-medium text-primary text-sm mb-1">{req.rtqQuestion}</div>
                    {req.rtqAnswer && (
                      <div className="text-xs text-muted mb-1">
                        <span className="font-medium">Top Answer:</span> {req.rtqAnswer.substring(0, 100)}...
                      </div>
                    )}
                    {req.suggestedAnswer && (
                      <div className="text-xs text-blue-600">
                        <span className="font-medium">Suggested Answer:</span> {req.suggestedAnswer.substring(0, 100)}...
                      </div>
                    )}
                    {req.adminNote && (
                      <div className="text-xs text-muted mt-1 italic">Note: {req.adminNote}</div>
                    )}
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApproveFaqConversion(req._id)}
                        className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const note = prompt('Rejection note (optional):');
                          handleRejectFaqConversion(req._id, note);
                        }}
                        className="p-1.5 border border-red-200 text-red-500 rounded hover:bg-red-50 transition-colors"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

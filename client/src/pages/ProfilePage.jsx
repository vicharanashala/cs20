import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/user.service';
import QPBadge from '../components/QPBadge';
import { ROLE_LABELS } from '../utils/constants';
import Breadcrumb from '../components/Breadcrumb';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [saveMsg, setSaveMsg] = useState('');

  const handleProfileUpdate = async e => {
    e.preventDefault();
    try {
      await userService.updateProfile(editForm);
      const updated = await refreshUser();
      setEditMode(false);
      setSaveMsg('Profile updated!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(err.message || 'Failed to update');
    }
  };

  const handlePasswordChange = async e => {
    e.preventDefault();
    try {
      await userService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setSaveMsg('Password changed!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(err.message || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'Profile' }]} />
      <h1 className="text-2xl font-bold text-primary mb-6">My Profile</h1>

      {saveMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
          {saveMsg}
        </div>
      )}

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-primary">{user?.name}</h2>
            <p className="text-sm text-muted">@{user?.username} • {ROLE_LABELS[user?.role] || user?.role}</p>
          </div>
          <QPBadge qp={user?.qp || 0} />
        </div>

        {!editMode ? (
          <div className="space-y-2 text-sm">
            <p><span className="text-muted">Email:</span> {user?.email}</p>
            <p><span className="text-muted">Role:</span> {ROLE_LABELS[user?.role] || user?.role}</p>
            <p><span className="text-muted">QP Balance:</span> {user?.qp || 0}</p>
            <button onClick={() => { setEditForm({ name: user?.name || '' }); setEditMode(true); }} className="btn-secondary text-sm mt-3">Edit Profile</button>
          </div>
        ) : (
          <form onSubmit={handleProfileUpdate} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Name</label>
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="input" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm">Save</button>
              <button type="button" onClick={() => setEditMode(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        )}
      </div>

      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-primary mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Current Password</label>
            <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">New Password</label>
            <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} className="input" required minLength={6} />
          </div>
          <button type="submit" className="btn-primary text-sm">Change Password</button>
        </form>
      </div>
  );
}

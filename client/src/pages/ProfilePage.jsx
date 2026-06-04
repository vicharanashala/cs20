import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/user.service';
import QPBadge from '../components/QPBadge';
import Avatar from '../components/Avatar';
import { ROLE_LABELS } from '../utils/constants';
import { RoleBadge } from '../components/Badge';
import Breadcrumb from '../components/Breadcrumb';
import { User, Mail, Shield, Key, Lock, Edit3, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [saveMsg, setSaveMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.updateProfile(editForm);
      await refreshUser();
      setEditMode(false);
      setSaveMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setSaveMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setSaveMsg({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => setSaveMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'Profile' }]} />
      
      {/* Page Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-100">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary">My Profile</h1>
          <p className="text-sm text-muted">Manage your personal settings and security</p>
        </div>
      </div>

      {saveMsg.text && (
        <div className={`border p-4 rounded-2xl text-sm mb-6 flex items-center gap-3 transition-all ${
          saveMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            saveMsg.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}>
            {saveMsg.type === 'success' ? '✓' : '!'}
          </div>
          <span className="font-medium">{saveMsg.text}</span>
        </div>
      )}

      {/* Main Profile Info Widget */}
      <div className="card shadow-md overflow-hidden bg-white/80 backdrop-blur-lg border border-white/40 mb-6">
        {/* Decorative Top Accent Banner */}
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
        </div>
        
        {/* Header Block with Avatar overlapping top banner */}
        {/* Header Block with Avatar overlapping top banner */}
        <div className="px-6 pb-6 relative pt-16">
          {/* Avatar absolutely positioned to overlap the border line of the banner */}
          <div className="absolute top-0 left-6 -translate-y-1/2 p-1 bg-white rounded-full shadow-md z-10 shrink-0">
            <Avatar name={user?.name} role={user?.role} size="xl" gradient />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 flex-wrap">
                {user?.name}
                <RoleBadge role={user?.role} />
              </h2>
              <p className="text-sm text-muted font-medium">@{user?.username}</p>
            </div>
            
            {!editMode && (
              <button 
                onClick={() => { setEditForm({ name: user?.name || '' }); setEditMode(true); }} 
                className="btn-outline-sm flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            )}
          </div>

          <div className="divider mb-6" />

          {/* Form / Details body */}
          {!editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Email Address</p>
                    <p className="font-semibold text-slate-800">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Role & Permissions</p>
                    <p className="font-semibold text-slate-800 uppercase text-xs tracking-wider">{ROLE_LABELS[user?.role] || user?.role}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Account Created</p>
                    <p className="font-semibold text-slate-800">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Quality Point Standing</p>
                    <p className="font-semibold text-slate-800">{user?.qp || 0} QP ({user?.qp >= 50 ? 'Good Standing' : 'Restricted Standing'})</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
                  <input 
                    type="text"
                    value={editForm.name} 
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} 
                    className="input-icon w-full"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="submit" disabled={loading} className="btn-gradient-sm">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditMode(false)} className="btn-outline-sm">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Change Password Widget */}
      <div className="card shadow-md overflow-hidden bg-white/80 backdrop-blur-lg border border-white/40">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shadow-sm">
            <Lock className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-primary">Security Settings</h2>
            <p className="text-[10px] text-muted">Update your account password</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="p-6 space-y-4 max-w-md">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
              <input 
                type="password" 
                value={passwordForm.currentPassword} 
                onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} 
                className="input-icon w-full" 
                placeholder="••••••••"
                required 
              />
            </div>
          </div>
          
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
              <input 
                type="password" 
                value={passwordForm.newPassword} 
                onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} 
                className="input-icon w-full" 
                placeholder="Min 6 characters"
                required 
                minLength={6} 
              />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="btn-gradient-sm flex items-center gap-1.5 mt-2">
            <Key className="w-4 h-4" />
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

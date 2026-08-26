import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Check,
  Save,
  Moon,
  Sun,
  Activity,
  Database,
  Sparkles
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserAvatar from '../components/UserAvatar';

const AVATAR_COLORS = [
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Rose', hex: '#EF4444' }
];

export default function ProfileSettings() {
  const { user, updateUser, theme, toggleTheme } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [roleTitle, setRoleTitle] = useState(user?.role_title || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || '#6366F1');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => { });
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
      }
      if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        role_title: roleTitle.trim(),
        avatar_color: avatarColor,
        ...(newPassword
          ? { current_password: currentPassword, new_password: newPassword }
          : {})
      };

      const res = await api.auth.updateProfile(payload);
      if (res.user) {
        updateUser(res.user);
      }
      showToast('Profile settings saved successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message || 'Error saving profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">
          Account Settings & Preferences
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Customize your profile, team identity, appearance theme, and security.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Public Profile</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <UserAvatar name={name || 'User'} color={avatarColor} size="xl" />
              <span className="text-[11px] text-slate-400">Avatar Preview</span>
            </div>

            {/* Fields */}
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Role / Professional Title
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Architect"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address (Account ID)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-800/40 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Avatar Theme Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setAvatarColor(c.hex)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${avatarColor === c.hex
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                          : 'hover:scale-105'
                        }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {avatarColor === c.hex && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance & Theme Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Appearance & Theme</span>
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-200">Color Theme</p>
              <p className="text-xs text-slate-400">
                Switch between modern Dark and clean Light themes.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Switch to Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>Switch to Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security / Password Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <span>Security & Password (Optional)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {/* System Health Info */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Database: {health?.database?.toUpperCase() || 'Connected'}</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">API Online</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}


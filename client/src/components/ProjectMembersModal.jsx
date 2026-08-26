import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, User, Trash2, CheckCircle2, Search, Mail } from 'lucide-react';
import Modal from './Modal';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserAvatar from './UserAvatar';

export default function ProjectMembersModal({
  isOpen,
  onClose,
  projectId,
  members = [],
  onMembersUpdated
}) {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);

  // Fetch all system users
  useEffect(() => {
    if (isOpen) {
      api.auth
        .getAllUsers()
        .then((data) => setAllUsers(Array.isArray(data) ? data : []))
        .catch(() => { });
    }
  }, [isOpen]);

  const memberList = Array.isArray(members) ? members : [];
  const userList = Array.isArray(allUsers) ? allUsers : [];

  const existingUserIds = new Set(memberList.map((m) => m.user_id || m.id));
  const availableUsers = userList.filter((u) => !existingUserIds.has(u.id));

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId && !customEmail.trim()) {
      showToast('Please select a user or enter an email', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        role,
        ...(selectedUserId ? { user_id: parseInt(selectedUserId, 10) } : { email: customEmail.trim() })
      };

      const res = await api.projects.addMember(projectId, payload);
      showToast(res.message || 'Member added to project', 'success');

      setSelectedUserId('');
      setCustomEmail('');
      setRole('Member');

      if (onMembersUpdated) onMembersUpdated();
    } catch (err) {
      showToast(err.message || 'Error adding member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.projects.updateMemberRole(projectId, userId, newRole);
      showToast('Member role updated', 'success');
      if (onMembersUpdated) onMembersUpdated();
    } catch (err) {
      showToast(err.message || 'Error updating member role', 'error');
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this project?`)) return;

    try {
      await api.projects.removeMember(projectId, userId);
      showToast(`${memberName} removed from project`, 'info');
      if (onMembersUpdated) onMembersUpdated();
    } catch (err) {
      showToast(err.message || 'Error removing member', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Team & Members"
      description="Manage who has access to this project and their permissions."
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Add Member Form */}
        <form
          onSubmit={handleAddMember}
          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/70 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>Invite Team Member</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* User Selector Dropdown */}
            <div className="sm:col-span-2">
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  if (e.target.value) setCustomEmail('');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="">Select registered team member...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role_title || u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Role Picker */}
            <div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Or enter email */}
          {!selectedUserId && (
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="...or invite by email (e.g. teammate@company.com)"
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || (!selectedUserId && !customEmail.trim())}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{loading ? 'Adding...' : 'Add Member'}</span>
            </button>
          </div>
        </form>

        {/* Current Members List */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Current Members ({memberList.length})
          </h4>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {memberList.map((m) => {
              const uId = m.user_id || m.id;
              const isMe = currentUser && Number(currentUser.id) === Number(uId);

              return (
                <div
                  key={uId}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      name={m.name}
                      color={m.avatar_color}
                      size="sm"
                      roleTitle={m.role_title}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {m.name} {isMe && '(You)'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            m.role === 'Admin'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-slate-700/50 text-slate-300 border-slate-600/40'
                          }`}
                        >
                          {m.role || 'Member'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={m.role || 'Member'}
                      onChange={(e) => handleUpdateRole(uId, e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded-lg px-2 py-1 focus:outline-hidden"
                    >
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                    </select>

                    {!isMe && (
                      <button
                        onClick={() => handleRemoveMember(uId, m.name)}
                        title="Remove member"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

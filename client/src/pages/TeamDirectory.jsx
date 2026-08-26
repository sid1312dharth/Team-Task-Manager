import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Shield, Sparkles, UserCheck } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserAvatar from '../components/UserAvatar';

export default function TeamDirectory() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.auth
      .getAllUsers()
      .then((data) => setUsers(data || []))
      .catch(() => showToast('Error loading team directory', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.role_title && u.role_title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Team Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Discover team members, roles, and project contributors across the organization.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, email..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading team members...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          No team members found matching "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((u) => {
            const isMe = currentUser && Number(currentUser.id) === Number(u.id);

            return (
              <div
                key={u.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all group"
              >
                <div className="flex items-start gap-3.5">
                  <UserAvatar
                    name={u.name}
                    color={u.avatar_color}
                    size="lg"
                    roleTitle={u.role_title}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                        {u.name}
                      </h3>
                      {isMe && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded-md font-bold">
                          You
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-indigo-400 mt-0.5 truncate">
                      {u.role_title || 'Team Member'}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Active Member</span>
                  </span>
                  <span>Joined {new Date(u.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


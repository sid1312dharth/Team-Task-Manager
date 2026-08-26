import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  User,
  Shield,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import UserAvatar from '../components/UserAvatar';

const DEFAULT_DEMO_USERS = [
  { id: 1, name: 'Alex Rivera', email: 'alex@example.com', avatar_color: '#6366F1', role_title: 'Lead Architect & Admin' },
  { id: 2, name: 'Sarah Chen', email: 'sarah@example.com', avatar_color: '#EC4899', role_title: 'Senior Frontend Engineer' },
  { id: 3, name: 'Mike Ross', email: 'mike@example.com', avatar_color: '#10B981', role_title: 'UI/UX Product Designer' },
  { id: 4, name: 'Elena Rostova', email: 'elena@example.com', avatar_color: '#F59E0B', role_title: 'Backend Lead' }
];

export default function AuthPage() {
  const { login, signup } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Frontend Engineer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [demoUsers, setDemoUsers] = useState(DEFAULT_DEMO_USERS);

  useEffect(() => {
    api.auth
      .getDemoUsers()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDemoUsers(data);
        }
      })
      .catch(() => { });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        showToast('Welcome back! Successfully logged in.', 'success');
      } else {
        if (!name.trim()) {
          showToast('Please enter your full name', 'error');
          setLoading(false);
          return;
        }
        await signup({ name: name.trim(), email: email.trim(), password, role_title: roleTitle });
        showToast('Account created successfully! Welcome to Team Task Manager.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Authentication failed. Please check your inputs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demo) => {
    setEmail(demo.email);
    setPassword('password123');
    setLoading(true);
    try {
      await login(demo.email, 'password123');
      showToast(`Logged in as ${demo.name}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Demo login failed. Is the server running?', 'error');
    } finally {
      setLoading(false);
    }
  };

  const userList = Array.isArray(demoUsers) ? demoUsers : DEFAULT_DEMO_USERS;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/25 mb-4">
          <Layers className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Team Task Manager
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Collaborative project management with role-based access & Kanban sprints.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Main Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-8 px-6 sm:px-8 shadow-2xl rounded-3xl space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Lead Architect, Designer"
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In to Workspace' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Accounts */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Instant 1-Click Demo Logins</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {userList.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(demo)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 text-left transition-all group"
                >
                  <UserAvatar name={demo.name} color={demo.avatar_color} size="xs" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate group-hover:text-indigo-300">
                      {demo.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{demo.role_title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

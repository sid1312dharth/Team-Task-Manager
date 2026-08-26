import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  Plus,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  Menu,
  X,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';

export default function Sidebar({
  activeView,
  setActiveView,
  selectedProjectId,
  setSelectedProjectId,
  projects = [],
  onOpenCreateProject,
  isOpenMobile,
  setIsOpenMobile
}) {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const projectList = Array.isArray(projects) ? projects : [];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects Hub', icon: FolderKanban },
    { id: 'my-tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'team', label: 'Team Directory', icon: Users },
    { id: 'profile', label: 'Settings & Profile', icon: Settings }
  ];

  const handleNavClick = (viewId) => {
    setActiveView(viewId);
    if (viewId !== 'project-detail') {
      setSelectedProjectId(null);
    }
    setIsOpenMobile(false);
  };

  const handleProjectClick = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveView('project-detail');
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900/95 lg:bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          isOpenMobile
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* App Branding */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="font-extrabold text-sm text-slate-100 tracking-tight block">
                  Team Task Manager
                </span>
                <span className="text-[10px] text-indigo-400 font-medium tracking-wide uppercase block">
                  Workspace
                </span>
              </div>
            )}
          </div>

          {/* Close mobile button */}
          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id && !selectedProjectId;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 font-semibold border border-indigo-500/20 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Projects Quick List */}
          {!collapsed && (
            <div className="pt-2">
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Projects ({projectList.length})
                </span>
                <button
                  onClick={onOpenCreateProject}
                  title="Create Project"
                  className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {projectList.length === 0 ? (
                  <p className="px-3 text-xs text-slate-400 py-1 italic">No projects yet</p>
                ) : (
                  projectList.slice(0, 7).map((proj) => {
                    const isSelected = activeView === 'project-detail' && selectedProjectId === proj.id;
                    return (
                      <button
                        key={proj.id}
                        onClick={() => handleProjectClick(proj.id)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-slate-800 text-slate-100 border border-slate-700 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-white/10"
                            style={{ backgroundColor: proj.color || '#6366F1' }}
                          />
                          <span className="truncate">{proj.name}</span>
                        </div>
                        {proj.task_count > 0 && (
                          <span className="text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded-md text-slate-400 shrink-0">
                            {proj.completed_task_count || 0}/{proj.task_count}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}

                {projectList.length > 7 && (
                  <button
                    onClick={() => handleNavClick('projects')}
                    className="w-full text-left px-3 py-1.5 text-xs text-indigo-400 hover:underline"
                  >
                    + {projectList.length - 7} more projects...
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card & Controls Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 shrink-0 space-y-2">
          {/* Theme & Collapse Controls */}
          <div className="flex items-center justify-between px-2 py-1">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-xs"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              {!collapsed && <span className="text-[11px] font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>

            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>

          {/* User Profile Info */}
          {user && (
            <div
              className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-800 ${
                collapsed ? 'justify-center' : 'justify-between'
              }`}
            >
              <div
                onClick={() => handleNavClick('profile')}
                className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1 hover:opacity-80 transition-opacity"
              >
                <UserAvatar
                  name={user.name}
                  color={user.avatar_color}
                  size="sm"
                  roleTitle={user.role_title}
                />
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.role_title || user.email}</p>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

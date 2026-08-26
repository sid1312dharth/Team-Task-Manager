import React from 'react';
import { Menu, Search, Plus, Sparkles, FolderPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';

export default function Header({
  pageTitle,
  pageSubtitle,
  searchQuery,
  setSearchQuery,
  onOpenCreateTask,
  onOpenCreateProject,
  setIsOpenMobile
}) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setIsOpenMobile(true)}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base lg:text-lg font-bold text-slate-100 truncate tracking-tight">
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="text-xs text-slate-400 hidden sm:block truncate">
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center/Right: Search Bar & Actions */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        {setSearchQuery && (
          <div className="relative hidden md:block w-48 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks & projects..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenCreateProject && (
            <button
              onClick={onOpenCreateProject}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all shadow-xs"
            >
              <FolderPlus className="w-4 h-4 text-slate-400" />
              <span>New Project</span>
            </button>
          )}

          {onOpenCreateTask && (
            <button
              onClick={onOpenCreateTask}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Task</span>
            </button>
          )}

          {/* User Avatar Mini */}
          {user && (
            <div className="pl-1 hidden sm:block">
              <UserAvatar
                name={user.name}
                color={user.avatar_color}
                size="sm"
                showTooltip
                roleTitle={user.role_title}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


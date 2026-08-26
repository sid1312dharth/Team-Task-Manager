import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserAvatar from '../components/UserAvatar';

const CATEGORIES = ['All', 'Frontend', 'Backend', 'Mobile', 'Design', 'DevOps', 'General'];

export default function ProjectsHub({ onOpenProject, onOpenCreateProject }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadProjects = async () => {
    try {
      const data = await api.projects.list();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Error loading projects list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDeleteProject = async (e, projectId, projectName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"? This will remove all associated tasks.`)) return;

    try {
      await api.projects.delete(projectId);
      setProjects((prev) => (Array.isArray(prev) ? prev.filter((p) => p.id !== projectId) : []));
      showToast(`Project "${projectName}" deleted`, 'success');
    } catch (err) {
      showToast(err.message || 'Error deleting project', 'error');
    }
  };

  const projectList = Array.isArray(projects) ? projects : [];

  const filteredProjects = projectList.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' ||
      (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Projects Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your team workspaces, deliverables, and sprints.
          </p>
        </div>

        <button
          onClick={onOpenCreateProject}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700/70 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No projects found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || selectedCategory !== 'All'
              ? 'Try adjusting your search query or category filter.'
              : 'Create your first project to begin managing tasks and team members!'}
          </p>
          <button
            onClick={onOpenCreateProject}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const total = parseInt(p.task_count || 0, 10);
            const completed = parseInt(p.completed_task_count || 0, 10);
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isOwnerOrAdmin = p.user_role === 'Admin' || (user && Number(p.owner_id) === Number(user.id));

            return (
              <div
                key={p.id}
                onClick={() => onOpenProject(p.id)}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 shadow-xl cursor-pointer transition-all hover:scale-[1.01] hover:shadow-indigo-500/5 group flex flex-col justify-between space-y-5"
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-2 ring-white/10"
                        style={{ backgroundColor: p.color || '#6366F1' }}
                      />
                      <h3 className="text-base font-extrabold text-white group-hover:text-indigo-300 truncate transition-colors">
                        {p.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700/60">
                        {p.category || 'General'}
                      </span>

                      {isOwnerOrAdmin && (
                        <button
                          onClick={(e) => handleDeleteProject(e, p.id, p.name)}
                          title="Delete Project"
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Sprint Progress</span>
                    <span className="font-bold text-indigo-400">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: p.color || '#6366F1'
                      }}
                    />
                  </div>
                </div>

                {/* Footer Metrics & Owner */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-300">
                      {completed}/{total} tasks
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Users className="w-3.5 h-3.5" />
                      {p.member_count || 1}
                    </span>
                  </div>

                  {p.target_date ? (
                    <span className="flex items-center gap-1 text-[11px] bg-slate-800/60 px-2 py-0.5 rounded-md text-slate-300">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {p.target_date}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">No deadline</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

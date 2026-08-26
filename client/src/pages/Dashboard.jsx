import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Plus,
  TrendingUp,
  Activity,
  Calendar,
  Sparkles
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserAvatar from '../components/UserAvatar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import DateBadge from '../components/DateBadge';

export default function Dashboard({
  onOpenProject,
  onOpenTask,
  onOpenCreateTask,
  onOpenCreateProject
}) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [dashData, tasksData] = await Promise.all([
        api.stats.getDashboard(),
        api.tasks.getMyTasks()
      ]);
      setStats(dashData && typeof dashData === 'object' ? dashData : null);
      setMyTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      showToast('Could not load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading workspace insights...</p>
      </div>
    );
  }

  const overdueCount = stats?.overdue_tasks || 0;
  const projectList = Array.isArray(stats?.projects) ? stats.projects : [];
  const deadlinesList = Array.isArray(stats?.upcoming_deadlines) ? stats.upcoming_deadlines : [];
  const activityList = Array.isArray(stats?.recent_activity) ? stats.recent_activity : [];
  const assignedTasks = Array.isArray(myTasks) ? myTasks : [];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Workspace Overview</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            You have <span className="text-indigo-400 font-semibold">{stats?.my_tasks_count || 0} active tasks</span> assigned across {stats?.total_projects || 0} active projects.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={onOpenCreateTask}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
          <button
            onClick={onOpenCreateProject}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Overdue Task Banner if any */}
      {overdueCount > 0 && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-4 flex items-center justify-between gap-4 text-rose-200 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600/20 rounded-xl text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-100">
                {overdueCount} {overdueCount === 1 ? 'Task is' : 'Tasks are'} overdue!
              </p>
              <p className="text-xs text-rose-300/80">
                Action required on overdue milestones to keep project sprints on schedule.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Projects
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {stats?.total_projects || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Across all team workspaces</p>
        </div>

        {/* Total Tasks */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {stats?.total_tasks || 0}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span className="text-blue-400 font-semibold">{stats?.in_progress_tasks || 0} in progress</span>
            <span>•</span>
            <span>{stats?.todo_tasks || 0} backlog</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Completion Rate
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {stats?.completion_rate || 0}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats?.completion_rate || 0}%` }}
            />
          </div>
        </div>

        {/* Urgent & Overdue */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Urgent & Alerts
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400">
            {stats?.urgent_tasks || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {stats?.overdue_tasks || 0} overdue tasks
          </p>
        </div>
      </div>

      {/* Main Grid: Projects Hub & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Active Projects ({projectList.length})
            </h3>
            <button
              onClick={onOpenCreateProject}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>+ New Project</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectList.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj.id)}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 cursor-pointer transition-all shadow-md group space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: proj.color || '#6366F1' }}
                    />
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 truncate transition-colors">
                      {proj.name}
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
                    {proj.category || 'General'}
                  </span>
                </div>

                {proj.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Progress</span>
                    <span className="font-bold text-indigo-400">{proj.progress_percent || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${proj.progress_percent || 0}%`,
                        backgroundColor: proj.color || '#6366F1'
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>{proj.completed_tasks || 0}/{proj.total_tasks || 0} tasks</span>
                  {proj.target_date && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      {proj.target_date}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines (Right 1 col) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Upcoming Deadlines
          </h3>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            {deadlinesList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No upcoming deadlines on schedule!
              </p>
            ) : (
              deadlinesList.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onOpenTask(task.id)}
                  className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 truncate">
                      {task.title}
                    </h5>
                    <PriorityBadge priority={task.priority} size="xs" />
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: task.project_color || '#6366F1' }}
                      />
                      {task.project_name}
                    </span>
                    <DateBadge dueDate={task.due_date} status={task.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: My Assigned Tasks & Recent Team Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Assigned Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              My Assigned Tasks ({assignedTasks.length})
            </h3>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            {assignedTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                You have no pending assigned tasks.
              </p>
            ) : (
              assignedTasks.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  onClick={() => onOpenTask(t.id)}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.project_color || '#6366F1' }}
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          t.status === 'completed'
                            ? 'line-through text-slate-400'
                            : 'text-slate-100'
                        }`}
                      >
                        {t.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{t.project_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={t.status} size="xs" />
                    {t.due_date && <DateBadge dueDate={t.due_date} status={t.status} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Team Activity */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Recent Team Activity
          </h3>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md max-h-[380px] overflow-y-auto">
            {activityList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No recent activity logged yet.
              </p>
            ) : (
              activityList.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/30 border border-slate-800/60"
                >
                  <UserAvatar
                    name={act.user_name || 'Team Member'}
                    color={act.user_avatar_color}
                    size="xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 leading-snug break-words">
                      <span className="font-bold text-indigo-300">{act.user_name}</span>{' '}
                      {act.details || act.action}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      {act.project_name && <span>{act.project_name}</span>}
                      <span>•</span>
                      <span>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

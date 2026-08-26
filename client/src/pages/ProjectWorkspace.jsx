import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  ListFilter,
  Users,
  Activity,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  CircleDot,
  Clock,
  Eye,
  Calendar,
  UserPlus,
  ChevronRight,
  MoreVertical,
  ArrowRight,
  MessageSquare,
  CheckSquare,
  Sparkles,
  MoveRight
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserAvatar from '../components/UserAvatar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import DateBadge from '../components/DateBadge';
import ProjectMembersModal from '../components/ProjectMembersModal';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#94A3B8', bg: 'bg-slate-800/40', border: 'border-slate-700/50' },
  { id: 'in_progress', title: 'In Progress', color: '#3B82F6', bg: 'bg-blue-950/20', border: 'border-blue-800/30' },
  { id: 'review', title: 'In Review', color: '#F59E0B', bg: 'bg-amber-950/20', border: 'border-amber-800/30' },
  { id: 'completed', title: 'Done', color: '#10B981', bg: 'bg-emerald-950/20', border: 'border-emerald-800/30' }
];

export default function ProjectWorkspace({
  projectId,
  onOpenTask,
  onOpenCreateTask,
  onBackToProjects
}) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab: 'kanban' | 'list' | 'members' | 'activity'
  const [activeTab, setActiveTab] = useState('kanban');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  // Members modal
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const loadProjectData = async () => {
    try {
      const [projData, tasksData, actData] = await Promise.all([
        api.projects.get(projectId),
        api.tasks.listByProject(projectId),
        api.projects.getActivity(projectId).catch(() => [])
      ]);
      setProject(projData);
      setTasks(tasksData || []);
      setActivity(actData || []);
    } catch (err) {
      showToast(err.message || 'Error loading project workspace', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      loadProjectData();
    }
  }, [projectId]);

  const handleQuickMove = async (e, task, newStatus) => {
    e.stopPropagation();
    if (task.status === newStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await api.tasks.update(task.id, { status: newStatus });
      showToast(`Task moved to ${newStatus.replace('_', ' ')}`, 'success');
      loadProjectData();
    } catch (err) {
      showToast(err.message || 'Failed to move task', 'error');
      loadProjectData();
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === 'all' || String(t.assigned_to) === String(assigneeFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading project workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center space-y-3">
        <h3 className="text-base font-bold text-slate-200">Project not found</h3>
        <button
          onClick={onBackToProjects}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const isProjectAdmin = project.user_role === 'Admin' || (user && Number(project.owner_id) === Number(user.id));
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Project Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="w-4 h-4 rounded-full shadow-xs ring-2 ring-white/10"
                style={{ backgroundColor: project.color || '#6366F1' }}
              />
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {project.name}
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                {project.category || 'General'}
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${isProjectAdmin
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}
              >
                {project.user_role || 'Member'}
              </span>
            </div>

            {project.description && (
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsMembersModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Users className="w-4 h-4 text-slate-400" />
              <span>Team ({project.members?.length || 0})</span>
            </button>

            <button
              onClick={() => onOpenCreateTask(project.id)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Progress bar & Member Avatars Stack */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="flex-1 space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-400">Completion</span>
                <span className="text-indigo-400">{progressPercent}% ({completedTasks}/{totalTasks})</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: project.color || '#6366F1'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Members Avatar Stack */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-medium">Team:</span>
            <div className="flex -space-x-2">
              {project.members?.slice(0, 5).map((m) => (
                <UserAvatar
                  key={m.user_id || m.id}
                  name={m.name}
                  color={m.avatar_color}
                  size="sm"
                  showTooltip
                  roleTitle={m.role}
                />
              ))}
              {project.members?.length > 5 && (
                <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center justify-center">
                  +{project.members.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Filters Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Workspace View Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'kanban'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'list'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>List View</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'members'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Users className="w-4 h-4" />
            <span>Team ({project.members?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'activity'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity</span>
          </button>
        </div>

        {/* Task Filters (Active on Kanban and List views) */}
        {(activeTab === 'kanban' || activeTab === 'list') && (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tasks..."
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 w-36 sm:w-48"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Assignees</option>
              {project.members?.map((m) => (
                <option key={m.user_id || m.id} value={m.user_id || m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* --- TAB 1: KANBAN BOARD VIEW --- */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-3 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {col.title}
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenCreateTask(project.id)}
                    title={`Add task to ${col.title}`}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnTasks.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400 italic">
                      No tasks in {col.title.toLowerCase()}
                    </div>
                  ) : (
                    columnTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onOpenTask(t.id)}
                        className="p-4 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-750 hover:border-indigo-500/50 cursor-pointer shadow-md transition-all group space-y-3 task-card-enter"
                      >
                        {/* Card Header: Priority & Quick Move */}
                        <div className="flex items-center justify-between gap-2">
                          <PriorityBadge priority={t.priority} size="xs" />

                          {/* Quick Move Dropdown */}
                          <select
                            value={t.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleQuickMove(e, t, e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-[10px] text-slate-300 rounded-md px-1.5 py-0.5 focus:outline-hidden"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">In Review</option>
                            <option value="completed">Done</option>
                          </select>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 leading-snug line-clamp-2 transition-colors">
                          {t.title}
                        </h4>

                        {/* Description Preview */}
                        {t.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {t.description}
                          </p>
                        )}

                        {/* Subtasks Progress if any */}
                        {t.subtask_count > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md w-fit">
                            <CheckSquare className="w-3 h-3" />
                            <span>
                              {t.subtask_completed_count || 0}/{t.subtask_count} subtasks
                            </span>
                          </div>
                        )}

                        {/* Card Footer: Due Date, Comments & Assignee */}
                        <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {t.due_date && (
                              <DateBadge dueDate={t.due_date} status={t.status} />
                            )}
                            {t.comment_count > 0 && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <MessageSquare className="w-3 h-3" />
                                {t.comment_count}
                              </span>
                            )}
                          </div>

                          {t.assignee_name ? (
                            <UserAvatar
                              name={t.assignee_name}
                              color={t.assignee_avatar_color}
                              size="xs"
                              showTooltip
                              roleTitle={t.assignee_role_title}
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- TAB 2: LIST / TABLE VIEW --- */}
      {activeTab === 'list' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Task</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Subtasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400 italic">
                      No tasks found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => onOpenTask(t.id)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3 font-bold text-slate-100 max-w-xs truncate">
                        {t.title}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} size="xs" />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={t.priority} size="xs" />
                      </td>
                      <td className="px-4 py-3">
                        {t.assignee_name ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              name={t.assignee_name}
                              color={t.assignee_avatar_color}
                              size="xs"
                            />
                            <span className="truncate">{t.assignee_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {t.due_date ? (
                          <DateBadge dueDate={t.due_date} status={t.status} />
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {t.subtask_count > 0 ? (
                          <span>
                            {t.subtask_completed_count || 0}/{t.subtask_count}
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: TEAM MEMBERS TAB --- */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Project Team Roster ({project.members?.length || 0})
            </h3>
            {isProjectAdmin && (
              <button
                onClick={() => setIsMembersModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Member</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.members?.map((m) => (
              <div
                key={m.user_id || m.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center gap-4"
              >
                <UserAvatar
                  name={m.name}
                  color={m.avatar_color}
                  size="lg"
                  roleTitle={m.role_title}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-100 truncate">{m.name}</h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${m.role === 'Admin'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                    >
                      {m.role || 'Member'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{m.role_title || m.email}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Assigned: {m.assigned_tasks_count || 0} tasks ({m.completed_tasks_count || 0} done)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: ACTIVITY FEED TAB --- */}
      {activeTab === 'activity' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Project Event Timeline
          </h3>

          {activity.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No recent activity recorded for this project yet.
            </p>
          ) : (
            <div className="space-y-4">
              {activity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800/80"
                >
                  <UserAvatar
                    name={act.user_name || 'Team Member'}
                    color={act.user_avatar_color}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-200 leading-snug">
                      <span className="font-bold text-indigo-300">{act.user_name}</span>{' '}
                      {act.details || act.action}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Project Members Modal */}
      <ProjectMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        projectId={project.id}
        members={project.members || []}
        onMembersUpdated={loadProjectData}
      />
    </div>
  );
}


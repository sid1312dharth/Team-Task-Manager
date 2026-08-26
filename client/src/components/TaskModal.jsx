import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Tag,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  MessageSquare,
  Send,
  AlertTriangle,
  Flame,
  CheckSquare,
  Sparkles,
  Save
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserAvatar from './UserAvatar';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import DateBadge from './DateBadge';

export default function TaskModal({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  projectMembers = []
}) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [tags, setTags] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');

  // Subtasks & Comments
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [comments, setComments] = useState([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Load full task details
  useEffect(() => {
    if (!taskId || !isOpen) return;

    let isMounted = true;
    setLoading(true);

    api.tasks.get(taskId)
      .then((data) => {
        if (!isMounted) return;
        setTask(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setStatus(data.status || 'todo');
        setPriority(data.priority || 'medium');
        setDueDate(data.due_date || '');
        setAssignedTo(data.assigned_to ? String(data.assigned_to) : '');
        setTags(data.tags || '');
        setEstimatedHours(data.estimated_hours ? String(data.estimated_hours) : '');
        setSubtasks(data.subtasks || []);
        setComments(data.comments || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        showToast(err.message || 'Error loading task details', 'error');
        onClose();
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [taskId, isOpen]);

  if (!isOpen) return null;

  const handleQuickStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      const updated = await api.tasks.update(taskId, { status: newStatus });
      setTask((prev) => ({ ...prev, ...updated }));
      if (onTaskUpdated) onTaskUpdated({ ...task, ...updated, status: newStatus });
      showToast(`Status updated to "${newStatus.replace('_', ' ')}"`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleSaveDetails = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      showToast('Task title cannot be empty', 'error');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        description,
        status,
        priority,
        due_date: dueDate || null,
        assigned_to: assignedTo ? parseInt(assignedTo, 10) : null,
        tags,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : 0
      };

      const updated = await api.tasks.update(taskId, payload);
      setTask((prev) => ({ ...prev, ...updated }));
      if (onTaskUpdated) onTaskUpdated({ ...task, ...updated });
      showToast('Task details saved successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save task changes', 'error');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm(`Are you sure you want to delete "${task?.title}"?`)) return;

    try {
      await api.tasks.delete(taskId);
      showToast('Task deleted successfully', 'success');
      if (onTaskDeleted) onTaskDeleted(taskId);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  // --- Subtask Actions ---
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      const newSt = await api.subtasks.create(taskId, newSubtaskTitle.trim());
      setSubtasks((prev) => [...prev, newSt]);
      setNewSubtaskTitle('');
      if (onTaskUpdated) {
        onTaskUpdated({
          ...task,
          subtask_count: subtasks.length + 1
        });
      }
    } catch (err) {
      showToast(err.message || 'Failed to add subtask', 'error');
    }
  };

  const handleToggleSubtask = async (subtask) => {
    const nextCompleted = subtask.completed ? 0 : 1;
    try {
      const updatedSt = await api.subtasks.update(taskId, subtask.id, {
        completed: nextCompleted
      });
      setSubtasks((prev) =>
        prev.map((st) => (st.id === subtask.id ? { ...st, completed: nextCompleted } : st))
      );
      if (onTaskUpdated) {
        const completedCount = subtasks.filter((st) =>
          st.id === subtask.id ? nextCompleted : st.completed
        ).length;
        onTaskUpdated({
          ...task,
          subtask_completed_count: completedCount
        });
      }
    } catch (err) {
      showToast(err.message || 'Failed to toggle subtask', 'error');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await api.subtasks.delete(taskId, subtaskId);
      setSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
      if (onTaskUpdated) {
        onTaskUpdated({
          ...task,
          subtask_count: Math.max(0, subtasks.length - 1)
        });
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete subtask', 'error');
    }
  };

  // --- Comments Actions ---
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim() || postingComment) return;

    setPostingComment(true);
    try {
      const newC = await api.comments.create(taskId, newCommentContent.trim());
      setComments((prev) => [...prev, newC]);
      setNewCommentContent('');
      if (onTaskUpdated) {
        onTaskUpdated({
          ...task,
          comment_count: (task.comment_count || 0) + 1
        });
      }
    } catch (err) {
      showToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setPostingComment(false);
    }
  };

  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;
  const subtaskProgressPercent =
    subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Body */}
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Loading task details...</p>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: task?.project_color || '#6366F1' }}
                />
                <span className="text-xs font-bold text-slate-400 truncate">
                  {task?.project_name || 'Project'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400">Task #{task?.id}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDeleteTask}
                  title="Delete Task"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Area (Left 2 Columns) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveDetails}
                    className="w-full text-lg lg:text-xl font-bold bg-transparent border-b border-slate-700/80 focus:border-indigo-500 px-0 py-1 text-slate-100 focus:outline-hidden transition-colors"
                    placeholder="Task title..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleSaveDetails}
                    placeholder="Add detailed task instructions, requirements, or links..."
                    className="w-full bg-slate-800/60 border border-slate-700/70 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-y"
                  />
                </div>

                {/* Subtasks Section */}
                <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Subtasks & Checklist ({completedSubtasksCount}/{subtasks.length})
                      </span>
                    </div>
                    {subtasks.length > 0 && (
                      <span className="text-xs font-semibold text-indigo-400">
                        {subtaskProgressPercent}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {subtasks.length > 0 && (
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                        style={{ width: `${subtaskProgressPercent}%` }}
                      />
                    </div>
                  )}

                  {/* Subtask Items List */}
                  <div className="space-y-1.5 pt-1">
                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 group transition-colors"
                      >
                        <div
                          onClick={() => handleToggleSubtask(st)}
                          className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0"
                        >
                          <button
                            type="button"
                            className={`shrink-0 transition-colors ${st.completed ? 'text-emerald-400' : 'text-slate-400 hover:text-indigo-400'
                              }`}
                          >
                            {st.completed ? (
                              <CheckCircle2 className="w-4 h-4 fill-emerald-500/20" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <span
                            className={`text-xs truncate ${st.completed ? 'line-through text-slate-400' : 'text-slate-200'
                              }`}
                          >
                            {st.title}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteSubtask(st.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 p-1 rounded-md transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Subtask Input */}
                  <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Add a step or subtask..."
                      className="flex-1 bg-slate-900/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!newSubtaskTitle.trim()}
                      className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>

                {/* Comments Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Activity & Comments ({comments.length})
                    </h4>
                  </div>

                  {/* Comments Thread */}
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        No comments yet. Start the conversation below!
                      </p>
                    ) : (
                      comments.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800/80"
                        >
                          <UserAvatar
                            name={c.user_name || 'Team Member'}
                            color={c.user_avatar_color}
                            size="sm"
                            roleTitle={c.user_role_title}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-200">
                                {c.user_name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                              {c.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Post Comment Input */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newCommentContent}
                      onChange={(e) => setNewCommentContent(e.target.value)}
                      placeholder="Write a comment or status update..."
                      className="flex-1 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!newCommentContent.trim() || postingComment}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Sidebar Metadata Area (Right 1 Column) */}
              <div className="bg-slate-800/30 border border-slate-800/80 rounded-xl p-4 space-y-5 h-fit">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  Properties
                </h4>

                {/* Status Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => handleQuickStatusChange(e.target.value)}
                    className="w-full bg-slate-850 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Priority Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value);
                      api.tasks.update(taskId, { priority: e.target.value }).then((res) => {
                        setTask((prev) => ({ ...prev, ...res }));
                        if (onTaskUpdated) onTaskUpdated({ ...task, priority: e.target.value });
                        showToast(`Priority set to ${e.target.value}`, 'info');
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Assignee Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Assignee
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => {
                      setAssignedTo(e.target.value);
                      api.tasks
                        .update(taskId, {
                          assigned_to: e.target.value ? parseInt(e.target.value, 10) : null
                        })
                        .then((res) => {
                          setTask((prev) => ({ ...prev, ...res }));
                          if (onTaskUpdated) onTaskUpdated({ ...task, ...res });
                          showToast('Assignee updated', 'success');
                        });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map((m) => (
                      <option key={m.user_id || m.id} value={m.user_id || m.id}>
                        {m.name} ({m.role || 'Member'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      api.tasks.update(taskId, { due_date: e.target.value || null }).then((res) => {
                        setTask((prev) => ({ ...prev, ...res }));
                        if (onTaskUpdated) onTaskUpdated({ ...task, due_date: e.target.value });
                        showToast('Due date updated', 'info');
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                  {dueDate && (
                    <div className="mt-2">
                      <DateBadge dueDate={dueDate} status={status} />
                    </div>
                  )}
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Estimated Effort (Hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    onBlur={handleSaveDetails}
                    placeholder="e.g. 6.5"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    onBlur={handleSaveDetails}
                    placeholder="e.g. Frontend, Design, Bug"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


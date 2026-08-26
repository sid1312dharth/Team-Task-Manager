import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Calendar, User, Tag, Clock } from 'lucide-react';
import Modal from './Modal';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

export default function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  defaultProjectId = null,
  projects = [],
  members = []
}) {
  const { showToast } = useToast();

  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [tags, setTags] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync defaultProjectId
  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    } else if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [defaultProjectId, projects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a task title', 'error');
      return;
    }
    if (!projectId) {
      showToast('Please select a project for this task', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        due_date: dueDate || null,
        assigned_to: assignedTo ? parseInt(assignedTo, 10) : null,
        tags: tags.trim(),
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : 0
      };

      const created = await api.tasks.create(projectId, payload);
      showToast(`Task "${created.title}" created successfully!`, 'success');

      // Reset form
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setDueDate('');
      setAssignedTo('');
      setTags('');
      setEstimatedHours('');

      if (onTaskCreated) onTaskCreated(created, projectId);
      onClose();
    } catch (err) {
      showToast(err.message || 'Error creating task', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description="Add an actionable task to your project workspace."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Selector (if not locked) */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Project <span className="text-rose-400">*</span>
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={!!defaultProjectId}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500 disabled:opacity-60"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Task Title */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Task Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement drag-and-drop Kanban columns"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed requirements, user story, or acceptance criteria..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 resize-y"
          />
        </div>

        {/* Status & Priority Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Assignee & Due Date Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Assignee
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id || m.id} value={m.user_id || m.id}>
                  {m.name} ({m.role || 'Member'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Tags & Estimated Effort */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Tags (optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Design, Frontend"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Est. Hours
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="e.g. 4"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{loading ? 'Creating...' : 'Create Task'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}


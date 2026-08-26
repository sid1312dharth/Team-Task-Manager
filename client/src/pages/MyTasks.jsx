import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import DateBadge from '../components/DateBadge';

const TABS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'today', label: 'Due Today' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' }
];

export default function MyTasks({ onOpenTask }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const loadMyTasks = async () => {
    try {
      const data = await api.tasks.getMyTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Error loading your tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyTasks();
  }, []);

  const handleToggleComplete = async (e, task) => {
    e.stopPropagation();
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    setTasks((prev) =>
      Array.isArray(prev) ? prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)) : []
    );

    try {
      await api.tasks.update(task.id, { status: nextStatus });
      showToast(
        nextStatus === 'completed' ? 'Task marked as completed! 🎉' : 'Task marked as To Do',
        'success'
      );
      loadMyTasks();
    } catch (err) {
      showToast(err.message || 'Error updating task', 'error');
      loadMyTasks();
    }
  };

  // Date calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const taskList = Array.isArray(tasks) ? tasks : [];

  const filteredTasks = taskList.filter((t) => {
    const matchesSearch =
      (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.project_name && t.project_name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'overdue') {
      return t.status !== 'completed' && t.due_date && t.due_date < todayStr;
    }
    if (activeTab === 'today') {
      return t.status !== 'completed' && t.due_date === todayStr;
    }
    if (activeTab === 'in_progress') {
      return t.status === 'in_progress';
    }
    if (activeTab === 'completed') {
      return t.status === 'completed';
    }

    return true;
  });

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">
          My Assigned Tasks
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Everything assigned to you across all projects in one unified view.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your tasks..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading your tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <CheckSquare className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No tasks found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || activeTab !== 'all'
              ? 'No tasks match the active filters.'
              : 'You have no assigned tasks at the moment!'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 shadow-xl overflow-hidden">
          {filteredTasks.map((t) => (
            <div
              key={t.id}
              onClick={() => onOpenTask(t.id)}
              className="p-4 hover:bg-slate-800/40 cursor-pointer transition-colors flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Complete checkbox */}
                <button
                  type="button"
                  onClick={(e) => handleToggleComplete(e, t)}
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                    t.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-600 hover:border-indigo-400 text-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                </button>

                {/* Project Color & Title */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: t.project_color || '#6366F1' }}
                    />
                    <span className="text-[11px] font-bold text-slate-400 truncate">
                      {t.project_name}
                    </span>
                  </div>

                  <p
                    className={`text-sm font-bold truncate group-hover:text-indigo-300 transition-colors ${
                      t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-100'
                    }`}
                  >
                    {t.title}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2.5 shrink-0">
                <PriorityBadge priority={t.priority} size="xs" />
                <StatusBadge status={t.status} size="xs" />
                {t.due_date && <DateBadge dueDate={t.due_date} status={t.status} />}
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

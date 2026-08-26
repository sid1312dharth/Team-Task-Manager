import React from 'react';
import { CircleDot, Clock, Eye, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/50',
    dot: 'bg-slate-400',
    icon: CircleDot
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
    dot: 'bg-blue-500',
    icon: Clock
  },
  review: {
    label: 'In Review',
    bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    dot: 'bg-amber-500',
    icon: Eye
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
    icon: CheckCircle2
  }
};

export default function StatusBadge({ status = 'todo', size = 'sm', showIcon = true, className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px] font-medium gap-1.5',
    sm: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    md: 'px-3 py-1.5 text-sm font-semibold gap-2'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs transition-colors ${config.bg} ${sizeClasses[size] || sizeClasses.sm} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}


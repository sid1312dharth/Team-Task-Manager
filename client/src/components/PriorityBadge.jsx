import React from 'react';
import { ArrowDown, Minus, ArrowUp, AlertTriangle } from 'lucide-react';

const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    bg: 'bg-slate-500/10 text-slate-500 border-slate-500/20 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/40',
    icon: ArrowDown
  },
  medium: {
    label: 'Medium',
    bg: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
    icon: Minus
  },
  high: {
    label: 'High',
    bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    icon: ArrowUp
  },
  urgent: {
    label: 'Urgent',
    bg: 'bg-rose-500/15 text-rose-600 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 font-bold animate-pulse',
    icon: AlertTriangle
  }
};

export default function PriorityBadge({ priority = 'medium', size = 'sm', className = '' }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5'
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium transition-colors ${config.bg} ${sizeClasses[size] || sizeClasses.sm} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}


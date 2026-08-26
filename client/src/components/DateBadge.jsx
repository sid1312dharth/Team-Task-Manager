import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

export default function DateBadge({ dueDate, status = 'todo', className = '' }) {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const isCompleted = status === 'completed';
  const isOverdue = !isCompleted && diffDays < 0;
  const isToday = !isCompleted && diffDays === 0;
  const isTomorrow = !isCompleted && diffDays === 1;

  // Format display string
  let label = dueDate;
  try {
    const d = new Date(dueDate);
    label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { }

  let badgeStyle = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  let prefix = '';

  if (isCompleted) {
    badgeStyle = 'bg-slate-800/40 text-slate-400 border-slate-700/40 line-through opacity-75';
  } else if (isOverdue) {
    const overdueDays = Math.abs(diffDays);
    prefix = `${overdueDays}d overdue`;
    badgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold';
  } else if (isToday) {
    prefix = 'Due today';
    badgeStyle = 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold';
  } else if (isTomorrow) {
    prefix = 'Due tomorrow';
    badgeStyle = 'bg-blue-500/15 text-blue-400 border-blue-500/30 font-medium';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs transition-colors ${badgeStyle} ${className}`}
      title={`Due: ${dueDate}`}
    >
      {isOverdue ? (
        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
      ) : (
        <Calendar className="w-3.5 h-3.5 shrink-0 opacity-70" />
      )}
      <span>{prefix || label}</span>
    </span>
  );
}


import React from 'react';

export default function UserAvatar({
  name = 'User',
  color = '#6366F1',
  size = 'md',
  className = '',
  showTooltip = false,
  roleTitle = ''
}) {
  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-16 h-16 text-xl'
  };

  return (
    <div
      className={`relative group inline-flex items-center justify-center font-bold text-white rounded-full shadow-sm ring-2 ring-slate-900/10 dark:ring-white/10 shrink-0 select-none ${sizeClasses[size] || sizeClasses.md} ${className}`}
      style={{ backgroundColor: color || '#6366F1' }}
      title={!showTooltip ? `${name}${roleTitle ? ` (${roleTitle})` : ''}` : undefined}
    >
      <span>{getInitials(name)}</span>

      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
          <div className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap border border-slate-700">
            {name}
            {roleTitle && <span className="block text-[10px] text-slate-400 font-normal">{roleTitle}</span>}
          </div>
          <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700"></div>
        </div>
      )}
    </div>
  );
}


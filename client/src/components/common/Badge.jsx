import React from 'react';

/**
 * Reusable Badge component.
 * variant: 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'purple'
 */
const variants = {
  green:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  amber:  'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  red:    'bg-red-500/15 text-red-400 border border-red-500/25',
  blue:   'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  purple: 'bg-violet-500/15 text-violet-400 border border-violet-500/25',
  slate:  'bg-slate-500/15 text-slate-400 border border-slate-500/25',
};

export function Badge({ variant = 'slate', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

/** Status dot — animated when online */
export function StatusDot({ status }) {
  const colors = {
    online:  'bg-emerald-500',
    offline: 'bg-red-500',
    disabled: 'bg-slate-500',
  };
  return (
    <span className="relative inline-flex items-center justify-center w-3 h-3">
      {status === 'online' && (
        <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500/40 animate-ping" />
      )}
      <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${colors[status] ?? 'bg-slate-500'}`} />
    </span>
  );
}

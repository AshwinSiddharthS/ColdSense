import React from 'react';
import { Loader } from './Loader';

/**
 * Reusable Button component.
 * variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
 * size: 'sm' | 'md' | 'lg'
 */
const variants = {
  primary:   'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 shadow-lg shadow-blue-500/20',
  secondary: 'bg-white/8 hover:bg-white/12 text-slate-200 border border-white/10',
  danger:    'bg-red-600 hover:bg-red-500 text-white border border-red-500/50 shadow-lg shadow-red-500/20',
  ghost:     'bg-transparent hover:bg-white/6 text-slate-400 hover:text-slate-200 border border-transparent',
  outline:   'bg-transparent hover:bg-white/6 text-slate-300 border border-white/15 hover:border-white/25',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  onClick,
  type = 'button',
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader size="sm" className="shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
      {!loading && IconRight && <IconRight className="w-4 h-4 shrink-0" />}
    </button>
  );
}

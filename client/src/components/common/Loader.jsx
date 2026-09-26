import React from 'react';

/**
 * Loader spinner
 * size: 'sm' | 'md' | 'lg'
 */
export function Loader({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' };
  return (
    <div
      className={`rounded-full border-transparent border-t-blue-400 animate-spin ${sizes[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Full-page loading overlay
 */
export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-4">
      <Loader size="lg" />
      <p className="text-sm text-slate-500">Loading data…</p>
    </div>
  );
}

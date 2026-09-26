/**
 * formatDate – date/time formatting utilities.
 * Uses the Intl.DateTimeFormat API — no external dependencies.
 */

const DATE_LOCALE = 'en-IN'; // change to your locale if needed

/**
 * Format an ISO string or Date to "26 Sep 2026, 09:15 AM"
 */
export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(DATE_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format to just date: "26 Sep 2026"
 */
export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(DATE_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format to just time: "09:15 AM"
 */
export function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString(DATE_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Relative time — "2 minutes ago", "just now", etc.
 */
export function timeAgo(value) {
  if (!value) return '—';
  const diff = (Date.now() - new Date(value).getTime()) / 1000; // seconds

  if (diff < 60)        return 'just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000)   return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(value);
}

/**
 * Format duration in seconds to "1h 23m" or "45m"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

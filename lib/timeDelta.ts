/**
 * Time delta utilities for timeline UX
 * Calculates duration, formats deltas, detects stale jobs
 */

export type TimeDelta = {
  days: number;
  hours: number;
  label: string;
  isStale: boolean; // >10 days
};

/**
 * Calculate time delta from timestamp to now
 */
export function calculateDelta(timestamp: number): TimeDelta {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  let label: string;
  if (days === 0) {
    if (hours === 0) label = "< 1h";
    else label = `${hours}h`;
  } else if (days === 1) {
    label = "1d";
  } else {
    label = `${days}d`;
  }

  return {
    days,
    hours,
    label,
    isStale: days > 10,
  };
}

/**
 * Format duration between two timestamps
 */
export function formatDuration(startMs: number, endMs?: number): string {
  const end = endMs || Date.now();
  const diff = end - startMs;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${mins}m`;
  } else {
    return `${mins}m`;
  }
}

/**
 * Format timestamp as readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format timestamp with time
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}


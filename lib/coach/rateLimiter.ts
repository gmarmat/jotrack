/**
 * Rate Limiter for AI API calls
 * v1.3: Simple in-memory rate limiting (10 calls per 5 minutes)
 * 
 * In production, this should use Redis or a distributed cache.
 * For now, we use an in-memory Map with cleanup.
 */

interface RateLimitEntry {
  timestamps: number[];
  lastCleanup: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Configuration
const MAX_CALLS = 1000; // Temporarily very high for testing
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL = 60 * 1000; // Clean up every minute

/**
 * Check if a user/session is rate limited
 * Returns true if allowed, false if rate limited
 */
export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  
  // Get or create entry
  let entry = rateLimitMap.get(identifier);
  if (!entry) {
    entry = {
      timestamps: [],
      lastCleanup: now,
    };
    rateLimitMap.set(identifier, entry);
  }

  // Remove old timestamps outside the window
  entry.timestamps = entry.timestamps.filter(ts => now - ts < WINDOW_MS);

  // Check if limit exceeded
  if (entry.timestamps.length >= MAX_CALLS) {
    return false; // Rate limited
  }

  // Add current timestamp
  entry.timestamps.push(now);

  // Periodic cleanup of old entries
  if (now - entry.lastCleanup > CLEANUP_INTERVAL) {
    cleanupOldEntries();
    entry.lastCleanup = now;
  }

  return true; // Allowed
}

/**
 * Get remaining calls in current window
 */
export function getRemainingCalls(identifier: string): number {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry) {
    return MAX_CALLS;
  }

  // Remove old timestamps
  entry.timestamps = entry.timestamps.filter(ts => now - ts < WINDOW_MS);
  
  return Math.max(0, MAX_CALLS - entry.timestamps.length);
}

/**
 * Get time until rate limit resets (in seconds)
 */
export function getResetTime(identifier: string): number {
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || entry.timestamps.length === 0) {
    return 0;
  }

  const oldestTimestamp = Math.min(...entry.timestamps);
  const resetTime = oldestTimestamp + WINDOW_MS;
  const now = Date.now();
  
  return Math.max(0, Math.ceil((resetTime - now) / 1000));
}

/**
 * Reset rate limit for an identifier (for testing)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}

/**
 * Clean up entries that haven't been used in a while
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  // Convert to array to avoid iteration issues
  const entries = Array.from(rateLimitMap.entries());
  for (const [key, entry] of entries) {
    // If all timestamps are old, remove entry
    const hasRecentCall = entry.timestamps.some((ts: number) => now - ts < WINDOW_MS * 2);
    if (!hasRecentCall) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => rateLimitMap.delete(key));

  if (keysToDelete.length > 0) {
    console.log(`[RateLimiter] Cleaned up ${keysToDelete.length} stale entries`);
  }
}

/**
 * Get identifier from request (IP or session)
 * For now, use a global key since we don't have auth
 */
export function getIdentifier(request: Request): string {
  // In production, use IP address or session ID
  // For now, use a global identifier
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'global';
  return `ai_calls:${ip}`;
}


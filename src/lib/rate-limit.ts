/**
 * T01 — per-instance rate limiting for the BFF auth routes.
 *
 * Defence in depth, not the primary control: the backend already limits auth
 * (10 / 15 min) and now does so against shared state. This layer exists so that
 * hammering the Next origin is cheap to absorb before it becomes load on the API.
 *
 * Per-instance by design. A Next deployment has no shared store available here,
 * and the upstream limiter is the one that must not be bypassable — which is why
 * it is the shared one (ADR-005).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

const buckets = new Map<string, Bucket>();

let lastSweep = Date.now();

function sweep(now: number) {
  // Amortised cleanup so the map cannot grow without bound on a long-lived
  // instance. Without this every distinct client IP is retained forever.
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkAuthRateLimit(request: Request): RateLimitResult {
  if (process.env.NODE_ENV !== 'production') {
    return { limited: false, remaining: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  const now = Date.now();
  sweep(now);

  // Proxy headers first so the limit follows the real client rather than the
  // load balancer, and so a single client cannot rotate through forwarded values.
  const forwarded = request.headers.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const key = `auth:${ip}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, remaining: MAX_ATTEMPTS - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;

  if (existing.count > MAX_ATTEMPTS) {
    return {
      limited: true,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    limited: false,
    remaining: MAX_ATTEMPTS - existing.count,
    retryAfterSeconds: 0,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(MAX_ATTEMPTS),
    'X-RateLimit-Remaining': String(result.remaining),
  };
  if (result.limited) headers['Retry-After'] = String(result.retryAfterSeconds);
  return headers;
}
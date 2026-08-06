import 'server-only';

// Best-effort, in-memory rate limiter for guest (no-signup) usage.
//
// Caveats (by design, not oversight):
// - State lives in the Node process, so it resets on cold start and is NOT
//   shared across serverless instances on Vercel. A determined abuser can
//   get more than the nominal limit by hitting different instances.
// - This is meant to keep casual/accidental overuse of paid AI provider
//   quota in check for a portfolio demo, not to be a hard security boundary.
// - For a hardened version, swap this for a shared store (e.g. Upstash Redis).

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 15;

const hits = new Map<string, number[]>();

export function checkGuestRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, timestamps);
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - timestamps.length };
}

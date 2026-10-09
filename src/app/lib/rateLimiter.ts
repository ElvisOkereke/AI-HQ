import 'server-only';

// Best-effort, in-memory per-IP rate limiter for app-hosted (FuelIX) messages.
// Applies to everyone, signed in or not; BYOK traffic uses the user's own key and is exempt.
//
// Caveats (by design, not oversight):
// - State lives in the Node process, so it resets on cold start and is NOT
//   shared across serverless instances on Vercel. A determined abuser can
//   get more than the nominal limit by hitting different instances.
// - This keeps casual/accidental overuse of the app's FuelIX key in check,
//   it is not a hard security boundary.
// - For a hardened version, swap this for a shared store (e.g. Upstash Redis).

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const MAX_REQUESTS_PER_WINDOW = 60;

const hits = new Map<string, number[]>();

export function checkRateLimit(key: string, now = Date.now()): { allowed: boolean; remaining: number } {
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

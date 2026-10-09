// Visitors who haven't signed in get a random, unguessable id in an httpOnly
// cookie. Their chats and BYOK keys are stored under `anon:<id>` in the same
// field that holds a signed-in user's email, so the id doubles as a bearer token.
// Pure and edge-safe: imported by middleware as well as server code.

export const ANON_COOKIE = 'aihq_anon';
export const ANON_PREFIX = 'anon:';
export const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year, in seconds

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidAnonId(value: string | undefined | null): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function isAnonymousIdentity(identity: string): boolean {
  return identity.startsWith(ANON_PREFIX);
}

export const anonCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: ANON_COOKIE_MAX_AGE,
};

// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { checkRateLimit, MAX_REQUESTS_PER_WINDOW } from './rateLimiter';

describe('checkRateLimit', () => {
  it('allows up to the limit, then blocks', () => {
    const now = 1_000_000;
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) {
      expect(checkRateLimit('1.1.1.1', now).allowed).toBe(true);
    }
    expect(checkRateLimit('1.1.1.1', now)).toEqual({ allowed: false, remaining: 0 });
  });

  it('tracks each key separately', () => {
    const now = 2_000_000;
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) checkRateLimit('2.2.2.2', now);
    expect(checkRateLimit('3.3.3.3', now).allowed).toBe(true);
  });

  it('allows requests again once the window has passed', () => {
    const now = 3_000_000;
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) checkRateLimit('4.4.4.4', now);
    expect(checkRateLimit('4.4.4.4', now).allowed).toBe(false);
    expect(checkRateLimit('4.4.4.4', now + 60 * 60 * 1000 + 1).allowed).toBe(true);
  });
});

// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getServerSessionMock, cookieGetMock, cookieSetMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  cookieGetMock: vi.fn(),
  cookieSetMock: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('./authOptions', () => ({
  authOptions: {},
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: cookieGetMock, set: cookieSetMock }),
}));

import { getRequestIdentity } from './getServerUser';

const ANON_ID = '123e4567-e89b-42d3-a456-426614174000';

describe('getRequestIdentity', () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    cookieGetMock.mockReset();
    cookieSetMock.mockReset();
  });

  it('returns the session email when signed in, ignoring the anonymous cookie', async () => {
    getServerSessionMock.mockResolvedValue({ user: { email: 'user@example.com' } });
    cookieGetMock.mockReturnValue({ value: ANON_ID });
    await expect(getRequestIdentity()).resolves.toBe('user@example.com');
  });

  it('returns the anonymous id from the cookie when not signed in', async () => {
    getServerSessionMock.mockResolvedValue(null);
    cookieGetMock.mockReturnValue({ value: ANON_ID });
    await expect(getRequestIdentity()).resolves.toBe(`anon:${ANON_ID}`);
    expect(cookieSetMock).not.toHaveBeenCalled();
  });

  it('issues a fresh anonymous id when the cookie is missing', async () => {
    getServerSessionMock.mockResolvedValue({ user: {} });
    cookieGetMock.mockReturnValue(undefined);
    const identity = await getRequestIdentity();
    expect(identity).toMatch(/^anon:[0-9a-f-]{36}$/);
    expect(cookieSetMock).toHaveBeenCalledWith('aihq_anon', identity.slice(5), expect.objectContaining({ httpOnly: true }));
  });

  it('rejects a tampered cookie value instead of trusting it', async () => {
    getServerSessionMock.mockResolvedValue(null);
    cookieGetMock.mockReturnValue({ value: 'someone@example.com' });
    const identity = await getRequestIdentity();
    expect(identity).not.toContain('someone@example.com');
    expect(identity).toMatch(/^anon:[0-9a-f-]{36}$/);
  });
});

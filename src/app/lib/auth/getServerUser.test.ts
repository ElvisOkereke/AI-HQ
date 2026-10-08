// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('./authOptions', () => ({
  authOptions: {},
}));

import { getVerifiedEmail } from './getServerUser';

describe('getVerifiedEmail', () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
  });

  it('returns the session email when authenticated', async () => {
    getServerSessionMock.mockResolvedValue({ user: { email: 'user@example.com' } });
    await expect(getVerifiedEmail()).resolves.toBe('user@example.com');
  });

  it('throws when there is no session', async () => {
    getServerSessionMock.mockResolvedValue(null);
    await expect(getVerifiedEmail()).rejects.toThrow('Not authenticated');
  });

  it('throws when the session has no email (e.g. guest)', async () => {
    getServerSessionMock.mockResolvedValue({ user: {} });
    await expect(getVerifiedEmail()).rejects.toThrow('Not authenticated');
  });
});

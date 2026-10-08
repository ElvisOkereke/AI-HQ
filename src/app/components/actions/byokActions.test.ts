// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getVerifiedEmailMock, listByokConnectionsMock, addByokConnectionMock, deleteByokConnectionMock } = vi.hoisted(() => ({
  getVerifiedEmailMock: vi.fn(),
  listByokConnectionsMock: vi.fn(),
  addByokConnectionMock: vi.fn(),
  deleteByokConnectionMock: vi.fn(),
}));

vi.mock('../../lib/auth/getServerUser', () => ({
  getVerifiedEmail: getVerifiedEmailMock,
}));

vi.mock('../server/db', () => ({
  listByokConnections: listByokConnectionsMock,
  addByokConnection: addByokConnectionMock,
  deleteByokConnection: deleteByokConnectionMock,
}));

import { listByokConnectionsAction, addByokConnectionAction, deleteByokConnectionAction } from './byokActions';

describe('byokActions', () => {
  beforeEach(() => {
    getVerifiedEmailMock.mockReset();
    listByokConnectionsMock.mockReset();
    addByokConnectionMock.mockReset();
    deleteByokConnectionMock.mockReset();
  });

  describe('listByokConnectionsAction', () => {
    it('passes the verified email (not a client-supplied one) to the db layer', async () => {
      getVerifiedEmailMock.mockResolvedValue('real@example.com');
      listByokConnectionsMock.mockResolvedValue([{ id: '1', label: 'x', baseUrl: 'https://api.example.com', modelId: 'm', createdAt: 'now' }]);

      const result = await listByokConnectionsAction();

      expect(getVerifiedEmailMock).toHaveBeenCalled();
      expect(listByokConnectionsMock).toHaveBeenCalledWith('real@example.com');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('fails closed when unauthenticated', async () => {
      getVerifiedEmailMock.mockRejectedValue(new Error('Not authenticated'));

      const result = await listByokConnectionsAction();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
      expect(listByokConnectionsMock).not.toHaveBeenCalled();
    });
  });

  describe('addByokConnectionAction', () => {
    it('passes the verified email to the db layer, ignoring any client-side identity', async () => {
      getVerifiedEmailMock.mockResolvedValue('real@example.com');
      const connection = { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', modelId: 'some-model', apiKey: 'sk-test' };
      addByokConnectionMock.mockResolvedValue({ id: '1', label: connection.label, baseUrl: connection.baseUrl, modelId: connection.modelId, createdAt: 'now' });

      const result = await addByokConnectionAction(connection);

      expect(addByokConnectionMock).toHaveBeenCalledWith('real@example.com', connection);
      expect(result.success).toBe(true);
    });

    it('fails closed when unauthenticated', async () => {
      getVerifiedEmailMock.mockRejectedValue(new Error('Not authenticated'));

      const result = await addByokConnectionAction({ label: 'x', baseUrl: 'https://x.com', modelId: 'm', apiKey: 'k' });

      expect(result.success).toBe(false);
      expect(addByokConnectionMock).not.toHaveBeenCalled();
    });
  });

  describe('deleteByokConnectionAction', () => {
    it('passes the verified email and connection id to the db layer', async () => {
      getVerifiedEmailMock.mockResolvedValue('real@example.com');
      deleteByokConnectionMock.mockResolvedValue({ success: true });

      const result = await deleteByokConnectionAction('conn-1');

      expect(deleteByokConnectionMock).toHaveBeenCalledWith('real@example.com', 'conn-1');
      expect(result.success).toBe(true);
    });

    it('fails closed when unauthenticated', async () => {
      getVerifiedEmailMock.mockRejectedValue(new Error('Not authenticated'));

      const result = await deleteByokConnectionAction('conn-1');

      expect(result.success).toBe(false);
      expect(deleteByokConnectionMock).not.toHaveBeenCalled();
    });
  });
});

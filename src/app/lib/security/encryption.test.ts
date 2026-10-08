// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptSecret, decryptSecret } from './encryption';

describe('encryptSecret / decryptSecret', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key';
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalKey;
  });

  it('round-trips plaintext', () => {
    const secret = encryptSecret('sk-super-secret-api-key');
    expect(decryptSecret(secret)).toBe('sk-super-secret-api-key');
  });

  it('produces a different IV (and ciphertext) on every call', () => {
    const a = encryptSecret('same-plaintext');
    const b = encryptSecret('same-plaintext');
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('fails to decrypt if the ciphertext is tampered with', () => {
    const secret = encryptSecret('sk-super-secret-api-key');
    const tampered = { ...secret, ciphertext: Buffer.from('tampered-data').toString('base64') };
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it('fails to decrypt if the auth tag is tampered with', () => {
    const secret = encryptSecret('sk-super-secret-api-key');
    const tampered = { ...secret, authTag: Buffer.from('0'.repeat(16)).toString('base64') };
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it('fails to decrypt with the wrong key', () => {
    const secret = encryptSecret('sk-super-secret-api-key');
    process.env.ENCRYPTION_KEY = 'a-different-key';
    expect(() => decryptSecret(secret)).toThrow();
  });
});

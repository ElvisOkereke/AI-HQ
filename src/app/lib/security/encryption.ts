import 'server-only';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT = 'ai-hq-byok-encryption';

export type EncryptedSecret = {
  iv: string;
  authTag: string;
  ciphertext: string;
};

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || 'placeholder-encryption-key';
  return crypto.scryptSync(secret, SALT, 32);
}

export function encryptSecret(plaintext: string): EncryptedSecret {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

export function decryptSecret(secret: EncryptedSecret): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(secret.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(secret.authTag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(secret.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

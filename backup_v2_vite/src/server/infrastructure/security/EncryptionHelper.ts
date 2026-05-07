import { ValueTransformer } from "typeorm";
import crypto from "crypto";

/**
 * Enterprise PII Encryption Transformer for TypeORM
 * Uses AES-256-GCM for Authenticated Encryption
 */
export class PIIEncryptionTransformer implements ValueTransformer {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12;
  private static readonly AUTH_TAG_LENGTH = 16;

  private get encryptionKey(): Buffer {
    const key = process.env.KMS_MASTER_KEY;
    if (!key || key.length < 64) {
      // Provide a stable development fallback key if missing (32 bytes as 64 hex chars)
      const devFallback = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      console.warn("CRITICAL: KMS_MASTER_KEY is missing or invalid. Using development fallback key. DO NOT USE IN PRODUCTION.");
      return Buffer.from(devFallback, 'hex');
    }
    return Buffer.from(key, 'hex');
  }

  // To (DB): Encrypt
  to(value: string | null): string | null {
    if (!value) return value;

    const iv = crypto.randomBytes(PIIEncryptionTransformer.IV_LENGTH);
    const cipher = crypto.createCipheriv(PIIEncryptionTransformer.ALGORITHM, this.encryptionKey, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  // From (DB): Decrypt
  from(value: string | null): string | null {
    if (!value) return value;

    try {
      const [ivHex, authTagHex, encryptedHex] = value.split(':');
      if (!ivHex || !authTagHex || !encryptedHex) return value;

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(PIIEncryptionTransformer.ALGORITHM, this.encryptionKey, iv);
      
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error("Decryption failed. Data might be corrupted or key changed.");
      return "[DECRYPTION_ERROR]";
    }
  }
}

import bcrypt from "bcryptjs";

/**
 * Enterprise Hash Helper
 * Provides abstraction for secure password hashing using bcryptjs.
 */
export class HashHelper {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hashes a password using bcrypt
   */
  static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verifies a password against a hash
   */
  static async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }
}

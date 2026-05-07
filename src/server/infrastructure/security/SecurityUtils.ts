import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY = crypto.scryptSync(process.env.ENCRYPTION_SECRET || "default_secret_key_32_chars_long!!", "salt", 32);

/**
 * Utilitas Enkripsi untuk Kepatuhan UU PDP Indonesia
 */
export class SecurityUtils {
  /**
   * Enkripsi teks biasa menjadi format yang aman
   */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const tag = cipher.getAuthTag();
    
    // Format: iv.encrypted.tag
    return `${iv.toString("hex")}.${encrypted}.${tag.toString("hex")}`;
  }

  /**
   * Dekripsi data terenkripsi kembali ke teks biasa
   */
  static decrypt(encryptedData: string): string {
    const [ivHex, encryptedText, tagHex] = encryptedData.split(".");
    
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  }

  /**
   * Masking data sensitif (Contoh: 0812****1234)
   */
  static maskPhone(phone: string): string {
    if (phone.length < 7) return phone;
    return phone.replace(/(\d{4})(\d+)(\d{4})/, "$1****$3");
  }
}

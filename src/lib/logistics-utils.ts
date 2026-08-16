/**
 * NINOC Enterprise — Data Obfuscation Utilities
 * 
 * Reusable privacy/security functions for masking sensitive buyer data
 * across supplier dashboards, logistics views, and packing slips.
 */

/**
 * Masks a phone number, showing only the first 3 digits and last 1 digit.
 * Example: "085123456787" → "085********7"
 */
export function obfuscatePhone(phone: string): string {
  if (!phone || phone === 'N/A' || phone.length < 5) return phone;
  const first3 = phone.slice(0, 3);
  const last1 = phone.slice(-1);
  return `${first3}${'*'.repeat(phone.length - 4)}${last1}`;
}

/**
 * Masks a full name, showing only the first letter of each word.
 * Example: "Siti Nurhaliza" → "S*** N********"
 */
export function obfuscateName(name: string): string {
  if (!name || name === 'N/A') return name;
  return name.split(' ').map(word => {
    if (word.length <= 1) return word;
    return word[0] + '*'.repeat(word.length - 1);
  }).join(' ');
}

/**
 * Normalizes a courier name string into a clean, uppercase label.
 * Used across the logistics table and order detail pages for consistency.
 */
export function normalizeCourierLabel(courier: string | null | undefined): string {
  if (!courier) return '--';
  const lower = courier.toLowerCase();
  if (lower.includes('jnt')) return 'JNT';
  if (lower.includes('jne')) return 'JNE';
  if (lower.includes('sicepat')) return 'SICEPAT';
  if (lower.includes('grab')) return 'GRAB';
  if (lower.includes('gojek')) return 'GOJEK';
  if (lower.includes('anteraja')) return 'ANTERAJA';
  return courier.substring(0, 10).toUpperCase();
}

/**
 * Formats a total price number into a compact "K" representation.
 * Example: 289000 → "289K", 1500000 → "1,500K"
 */
export function formatValueK(totalPrice: number | null | undefined): string {
  if (!totalPrice) return '-';
  const k = Math.round(totalPrice / 1000);
  return k >= 1000 ? `${(k / 1000).toFixed(1).replace(/\.0$/, ',')}${k % 1000}K` : `${k}K`;
}

/**
 * Calculates the age of an order from its creation date as a human-readable string.
 * Returns "Xh" for hours, or "Xd" if older than 48 hours.
 */
export function formatOrderAge(createdAt: string | null | undefined): string {
  if (!createdAt) return '-';
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours >= 48) {
    return `${Math.floor(diffHours / 24)}d`;
  }
  return `${diffHours}h`;
}

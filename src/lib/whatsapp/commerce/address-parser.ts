import type { ShippingAddress } from './types';

/**
 * Extracts address fields from a free-text WhatsApp message.
 * Expected format:
 * Nama Penerima: ...
 * No HP: ...
 * Kota/Kabupaten: ...
 * Kode Pos: ...
 * Alamat Lengkap: ...
 */
export function parseAddressText(text: string, phone: string): ShippingAddress | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Basic heuristic: if it doesn't look like a form, try to find postal code
  const postalCodeMatch = text.match(/\b\d{5}\b/);
  if (!postalCodeMatch) {
    return null; // Require at least a postal code for Biteship rating
  }

  const postalCode = postalCodeMatch[0];
  
  // Try to extract structured data
  const extractField = (keywords: string[]): string => {
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (keywords.some(kw => lower.includes(kw))) {
        const parts = line.split(':');
        if (parts.length > 1) return parts.slice(1).join(':').trim();
      }
    }
    return '';
  };

  const name = extractField(['nama', 'penerima', 'name']) || 'Pelanggan';
  const noHp = extractField(['hp', 'whatsapp', 'wa', 'no hp', 'phone']) || phone;
  const city = extractField(['kota', 'kab', 'kabupaten', 'city']) || 'Kota Tujuan';
  
  // Everything else is full address
  const fullAddress = text.replace(/nama penerima.*|no hp.*|kota.*|kode pos.*/gi, '').trim() || text;

  return {
    recipient_name: name,
    phone: noHp,
    province: '', // Biteship will resolve this from postal code
    city: city,
    district: '', 
    full_address: fullAddress.substring(0, 200), // Trim if too long
    postal_code: postalCode,
  };
}

import { rateLimit } from '@/lib/rate-limit';
import { DomainResult, DomainSuccess, DomainFailure } from '@/lib/types/domain';

export interface CustomerDetails {
  user_id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  address_type?: string;
  street?: string;
  house_number?: string;
  rt?: string;
  rw?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  address?: string;
  referral_code?: string;
}

export interface ShippingDetails {
  method: string;
  cost: number;
}

export interface PromoDetails {
  code: string;
  discountAmount: number;
}

export interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  size_surcharge?: number;
  variant_id?: string;
  flash_sale_item_id?: string;
  flash_sale_max_qty?: number;
}

export class CheckoutValidator {
  private static readonly MAX_QTY_PER_ITEM = 10;
  private static readonly PHONE_REGEX = /^(08|628|\+628)[0-9]{7,13}$/;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Sanitizes and validates customer contact details and cart structure.
   */
  public static validateRequest(
    items: CheckoutItem[],
    customer: CustomerDetails,
    ip: string
  ): DomainResult<{ sanitizedPhone: string; fullName: string; sanitizedItems: CheckoutItem[] }> {
    // 1. Cart validation & Aggregation (Fixes Cart Split Exploit)
    if (!Array.isArray(items) || items.length === 0) {
      return DomainFailure('Keranjang belanja kosong', 'VALIDATION_ERROR');
    }

    const aggregatedMap = new Map<string, CheckoutItem>();

    for (const item of items) {
      // Create a unique composite key for this cart line
      const key = `${item.id}-${item.size || ''}-${item.color || ''}-${item.variant_id || ''}-${item.flash_sale_item_id || ''}`;
      
      if (aggregatedMap.has(key)) {
        const existing = aggregatedMap.get(key)!;
        existing.quantity += item.quantity;
      } else {
        // Deep clone to prevent mutating the original request
        aggregatedMap.set(key, { ...item });
      }
    }

    const aggregatedItems = Array.from(aggregatedMap.values());

    for (const item of aggregatedItems) {
      if (item.quantity > this.MAX_QTY_PER_ITEM) {
        return DomainFailure(`Jumlah pesanan untuk item ${item.name} melebihi batas maksimal ${this.MAX_QTY_PER_ITEM} unit.`, 'VALIDATION_ERROR');
      }
    }

    // 2. Phone sanitation and strict regex check
    const rawPhone = customer.phone || '';
    const hasPlus = rawPhone.startsWith('+');
    const phoneDigits = rawPhone.replace(/\D/g, '');
    const sanitizedPhone = hasPlus ? `+${phoneDigits}` : phoneDigits;

    if (!this.PHONE_REGEX.test(sanitizedPhone) || /(.)\1{6,}/.test(phoneDigits) || /^0+$/.test(phoneDigits)) {
      console.warn(`[Security] Blocked spam/invalid phone pattern: ${rawPhone} -> ${sanitizedPhone}`);
      return DomainFailure('Nomor telepon tidak valid. Pastikan memakai format 08x atau 628x yang benar.', 'VALIDATION_ERROR');
    }

    // 3. Email check
    const email = customer.email || '';
    if (email && (!this.EMAIL_REGEX.test(email) || email.endsWith('.xyz') || email.endsWith('.site') || email.includes('mailinator'))) {
      console.warn(`[Security] Blocked suspicious email: ${email}`);
      return DomainFailure('Alamat email tidak valid atau terdeteksi berisiko (spam).', 'VALIDATION_ERROR');
    }

    // 4. Name check
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    if (fullName.length < 3 || /(.)\1{4,}/.test(fullName) || fullName.toLowerCase() === 'a d') {
      console.warn(`[Security] Blocked spam name pattern: ${fullName}`);
      return DomainFailure('Nama penerima tidak valid (terdeteksi spam).', 'VALIDATION_ERROR');
    }

    // 5. Rate limiting
    const { isAllowed, headers } = rateLimit(`checkout_${ip}`, 6, 5 * 60 * 1000);
    if (!isAllowed) {
      console.warn(`[Security] Rate limit exceeded for IP: ${ip} at checkout`);
      return DomainFailure('Terlalu banyak request. Silakan coba lagi nanti.', 'TOO_MANY_REQUESTS', { headers });
    }

    return DomainSuccess({ sanitizedPhone, fullName, sanitizedItems: aggregatedItems });
  }
}

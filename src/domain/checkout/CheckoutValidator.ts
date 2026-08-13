import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

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
  ): { isValid: boolean; errorResponse?: NextResponse; sanitizedPhone?: string; fullName?: string; sanitizedItems?: CheckoutItem[] } {
    // 1. Cart validation
    if (!Array.isArray(items) || items.length === 0) {
      return { isValid: false, errorResponse: NextResponse.json({ error: 'Keranjang belanja kosong' }, { status: 400 }) };
    }

    for (const item of items) {
      if (item.quantity > this.MAX_QTY_PER_ITEM) {
        return {
          isValid: false,
          errorResponse: NextResponse.json(
            { error: `Quantity for item ${item.name} exceeds the maximum limit of ${this.MAX_QTY_PER_ITEM}.` },
            { status: 400 }
          ),
        };
      }
    }

    // 2. Phone sanitation and strict regex check
    const rawPhone = customer.phone || '';
    const hasPlus = rawPhone.startsWith('+');
    const phoneDigits = rawPhone.replace(/\D/g, '');
    const sanitizedPhone = hasPlus ? `+${phoneDigits}` : phoneDigits;

    if (!this.PHONE_REGEX.test(sanitizedPhone) || /(.)\1{6,}/.test(phoneDigits) || /^0+$/.test(phoneDigits)) {
      console.warn(`[Security] Blocked spam/invalid phone pattern: ${rawPhone} -> ${sanitizedPhone}`);
      return {
        isValid: false,
        errorResponse: NextResponse.json(
          { error: 'Nomor telepon tidak valid. Pastikan memakai format 08x atau 628x yang benar.' },
          { status: 400 }
        ),
      };
    }

    // 3. Email check
    const email = customer.email || '';
    if (email && (!this.EMAIL_REGEX.test(email) || email.endsWith('.xyz') || email.endsWith('.site') || email.includes('mailinator'))) {
      console.warn(`[Security] Blocked suspicious email: ${email}`);
      return {
        isValid: false,
        errorResponse: NextResponse.json({ error: 'Alamat email tidak valid atau terdeteksi berisiko (spam).' }, { status: 400 }),
      };
    }

    // 4. Name check
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    if (fullName.length < 3 || /(.)\1{4,}/.test(fullName) || fullName.toLowerCase() === 'a d') {
      console.warn(`[Security] Blocked spam name pattern: ${fullName}`);
      return { isValid: false, errorResponse: NextResponse.json({ error: 'Nama penerima tidak valid (terdeteksi spam).' }, { status: 400 }) };
    }

    // 5. Rate limiting
    const { isAllowed, headers } = rateLimit(`checkout_${ip}`, 6, 5 * 60 * 1000);
    if (!isAllowed) {
      console.warn(`[Security] Rate limit exceeded for IP: ${ip} at checkout`);
      return {
        isValid: false,
        errorResponse: NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers }),
      };
    }

    return { isValid: true, sanitizedPhone, fullName, sanitizedItems: items };
  }
}

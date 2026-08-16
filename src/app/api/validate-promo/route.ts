import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';



export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const upperCode = code.toUpperCase();

    // 1. Check Vouchers first
    const { data: voucher, error: vError } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('code', upperCode)
      .eq('is_active', true)
      .single();

    if (voucher) {
      // Check expiry
      if (voucher.valid_until && new Date(voucher.valid_until) < new Date()) {
        return NextResponse.json({ error: 'Voucher has expired' }, { status: 400 });
      }
      // Check usage limits (if configured)
      if (voucher.max_usage && voucher.usage_count !== undefined) {
        if (voucher.usage_count >= voucher.max_usage) {
          return NextResponse.json({ error: 'Voucher usage limit reached' }, { status: 400 });
        }
      }
      // Check min order
      if (voucher.min_order_amount && subtotal < voucher.min_order_amount) {
        return NextResponse.json({ error: `Minimum order amount is Rp ${Number(voucher.min_order_amount).toLocaleString('id-ID')}` }, { status: 400 });
      }
      
      // Calculate discount amount
      let discountAmount = 0;
      if (voucher.type === 'percentage') {
        discountAmount = subtotal * (Number(voucher.value) / 100);
        if (voucher.max_discount && discountAmount > Number(voucher.max_discount)) {
          discountAmount = Number(voucher.max_discount);
        }
      } else if (voucher.type === 'fixed_amount') {
        discountAmount = Number(voucher.value);
      } else if (voucher.type === 'free_shipping') {
        // Free shipping is handled specially on frontend
        discountAmount = 0; 
      }

      return NextResponse.json({
        type: 'voucher',
        code: upperCode,
        discountType: voucher.type,
        discountValue: Number(voucher.value),
        discountAmount: discountAmount,
        message: 'Voucher applied successfully!'
      });
    }

    // 2. Check Affiliates if no voucher found
    const { data: affiliate, error: aError } = await supabaseAdmin
      .from('affiliates')
      .select('id, customer_discount_type, customer_discount_value, status')
      .eq('code', upperCode)
      .eq('status', 'active')
      .single();

    if (affiliate) {
      let discountAmount = 0;
      const dType = affiliate.customer_discount_type || 'percentage';
      const dValue = Number(affiliate.customer_discount_value || 0);

      if (dValue > 0) {
        if (dType === 'percentage') {
          discountAmount = subtotal * (dValue / 100);
        } else {
          discountAmount = dValue;
        }
      }

      return NextResponse.json({
        type: 'affiliate',
        code: upperCode,
        affiliateId: affiliate.id,
        discountType: dType,
        discountValue: dValue,
        discountAmount: discountAmount,
        message: dValue > 0 ? 'Affiliate discount applied!' : 'Affiliate code applied!'
      });
    }

    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 });

  } catch (error) {
    console.error('Validate Promo Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

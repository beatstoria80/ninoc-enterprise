import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSnapApi } from '@/lib/midtrans';
import { getAppUrl } from '@/lib/utils';
import { CheckoutValidator } from '@/domain/checkout/CheckoutValidator';
import { PricingEngine } from '@/domain/checkout/PricingEngine';
import { OrderRepository } from '@/repositories/OrderRepository';

export async function POST(req: Request) {
  try {
    const { items, customerDetails, shippingDetails, promo } = await req.json();

    // 1. Validate & Sanitize Input
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
    
    const validation = CheckoutValidator.validateRequest(items, customerDetails, ip);
    if (!validation.isValid) {
      return validation.errorResponse!;
    }

    customerDetails.phone = validation.sanitizedPhone!;
    const firstName = (customerDetails.first_name || '').toUpperCase();
    const lastName = (customerDetails.last_name || '').toUpperCase();

    // 2. Data Access Layer Initialization
    const supabaseAdmin = getSupabaseAdmin();
    const orderRepo = new OrderRepository(supabaseAdmin);

    // 3. Fetch Product Costings & Variants
    const productIds = Array.from(new Set(items.map((i: any) => i.id))) as string[];
    const { data: dbProducts, error: dbError } = await orderRepo.getProductsByIds(productIds);

    if (dbError || !dbProducts || dbProducts.length === 0) {
      console.error('[Checkout API] Product verification failed:', dbError);
      return NextResponse.json({ error: 'Failed to verify products' }, { status: 500 });
    }

    // 4. Calculate Prices & Build Breakdown via O(1) Pricing Engine
    const pricing = PricingEngine.calculateOrderBreakdown(items, dbProducts, shippingDetails, promo);
    if (pricing.error) {
      return NextResponse.json({ error: pricing.error }, { status: 400 });
    }

    // 5. Resolve Affiliate Tracking
    let affiliateId: string | null = null;
    try {
      let targetRefCode = customerDetails.referral_code;
      if (!targetRefCode) {
        const cookieStore = cookies();
        const resolvedCookies = await Promise.resolve(cookieStore);
        targetRefCode = resolvedCookies.get('ninoc_affiliate_ref')?.value;
      }
      if (targetRefCode) {
        const { data: affData } = await supabaseAdmin
          .from('affiliates')
          .select('id, user_id')
          .eq('code', targetRefCode.toUpperCase())
          .maybeSingle();
        if (affData && affData.user_id !== customerDetails.user_id) {
          affiliateId = affData.id;
        }
      }
    } catch (e) {
      console.error('[Checkout API] Affiliate lookup error:', e);
    }

    // 6. Upsert Address if Authenticated
    if (customerDetails.user_id) {
      await orderRepo.upsertCustomerAddress(customerDetails.user_id, customerDetails, firstName, lastName);
    }

    // 7. Generate IDs and Create Order with Row-Level Lock
    const orderId = `NINOC-${Date.now()}`;
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `NC-${datePart}-${randPart}`;

    const orderCreation = await orderRepo.createOrderWithInventoryLock(
      orderId,
      pricing.grossAmount,
      affiliateId,
      customerDetails,
      shippingDetails,
      firstName,
      lastName,
      pricing.dbOrderItems
    );

    if (!orderCreation.success) {
      return NextResponse.json({ error: orderCreation.error }, { status: 409 });
    }

    // 8. Generate Midtrans Snap Token
    const snap = getSnapApi();
    const appUrl = getAppUrl();
    const parameter = {
      transaction_details: { order_id: orderId, gross_amount: pricing.grossAmount },
      enabled_payments: [
        'credit_card', 'bca_va', 'bni_va', 'bri_va', 'permata_va', 'other_va',
        'gopay', 'shopeepay', 'qris', 'indomaret', 'alfamart', 'echannel'
      ],
      customer_details: {
        first_name: firstName,
        last_name: lastName,
        ...(customerDetails.email ? { email: customerDetails.email } : {}),
        phone: customerDetails.phone,
        billing_address: {
          first_name: firstName,
          last_name: lastName,
          address: (customerDetails.address || '').toUpperCase(),
          city: (customerDetails.city || '').toUpperCase(),
          postal_code: customerDetails.postal_code || '',
        },
        shipping_address: {
          first_name: firstName,
          last_name: lastName,
          ...(customerDetails.email ? { email: customerDetails.email } : {}),
          phone: customerDetails.phone,
          address: (customerDetails.address || '').toUpperCase(),
          city: (customerDetails.city || '').toUpperCase(),
          postal_code: customerDetails.postal_code || '',
        },
      },
      item_details: pricing.midtransItems,
      credit_card: { secure: true },
      custom_expiry: { expiry_duration: 24, unit: 'hour' },
      callbacks: {
        finish: `${appUrl}/payment/success?order_id=${orderId}&courier=${shippingDetails.method}`,
        unfinish: `${appUrl}/shop`,
        error: `${appUrl}/checkout`,
      },
      override_notification_url: [`${appUrl}/api/payments/webhook`],
    };

    const transaction = await snap.createTransaction(parameter);
    const snapToken = transaction.token as string;
    await orderRepo.updateSnapToken(orderId, snapToken);

    return NextResponse.json({
      token: snapToken,
      redirect_url: transaction.redirect_url,
      orderId,
      orderNumber,
    });
  } catch (err) {
    const error = err as Error;
    console.error('[Checkout API] Critical Error:', error?.message, error?.stack);
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    const errorMessage = isProduction
      ? 'An error occurred during checkout. Please try again.'
      : `Checkout error: ${error?.message || 'Unknown error'}`;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

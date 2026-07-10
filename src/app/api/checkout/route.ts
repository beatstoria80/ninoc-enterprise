import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { CheckoutService } from '@/domain/checkout/CheckoutService';

export async function POST(req: Request) {
  try {
    const { items, customerDetails, shippingDetails, promo } = await req.json();

    // 1. Extract HTTP/Request specifics
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
    
    // Resolve cookies before passing to Domain Service
    const cookieStore = cookies();
    const resolvedCookies = await Promise.resolve(cookieStore);
    const affiliateCookieValue = resolvedCookies.get('ninoc_affiliate_ref')?.value;

    // 2. Delegate to Domain Orchestrator
    const supabaseAdmin = getSupabaseAdmin();
    const checkoutService = new CheckoutService(supabaseAdmin);
    
    const { status, payload } = await checkoutService.processCheckout(
      items,
      customerDetails,
      shippingDetails,
      promo,
      clientIp,
      affiliateCookieValue
    );

    return NextResponse.json(payload, { status });
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

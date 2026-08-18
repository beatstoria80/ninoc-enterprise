import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { CheckoutService } from '@/domain/checkout/CheckoutService';
import { withErrorHandler, apiSuccess, apiError } from '@/lib/apiResponse';

export const POST = withErrorHandler(async (req: Request) => {
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

    if (status >= 400) {
        return apiError(payload.error || 'Checkout failed', status, payload);
    }

    return apiSuccess(payload, status);
});

import { SupabaseClient } from '@supabase/supabase-js';
import { CheckoutValidator } from './CheckoutValidator';
import { PricingEngine } from './PricingEngine';
import { OrderRepository } from '@/repositories/OrderRepository';
import { getSnapApi } from '@/lib/midtrans';
import { getAppUrl } from '@/lib/utils';
import { StockValidator } from './StockValidator';
import { sendCheckoutPendingWA, formatPhoneNumber } from '@/lib/whatsapp';
import { unstable_after as after } from 'next/server';

export class CheckoutService {
  constructor(private readonly supabaseAdmin: SupabaseClient) {}

  public async processCheckout(
    items: any[],
    customerDetails: any,
    shippingDetails: any,
    promo: any,
    clientIp: string,
    affiliateCookieValue: string | undefined
  ): Promise<{ status: number; payload: any }> {
    // 1. Validate & Sanitize Input
    const validation = CheckoutValidator.validateRequest(items, customerDetails, clientIp);
    if (!validation.isValid) {
      return { status: 400, payload: validation.errorResponse?.json || { error: 'Invalid input' } };
    }

    customerDetails.phone = validation.sanitizedPhone!;
    const firstName = (customerDetails.first_name || '').toUpperCase();
    const lastName = (customerDetails.last_name || '').toUpperCase();

    // 2. Data Access Layer Initialization
    const orderRepo = new OrderRepository(this.supabaseAdmin);

    // 3. Fetch Product Costings & Variants
    const productIds = Array.from(new Set(items.map((i: any) => i.id))) as string[];
    const { data: dbProducts, error: dbError } = await orderRepo.getProductsByIds(productIds);

    if (dbError) {
      console.error('[CheckoutService] Database error during product verification:', dbError);
      return { status: 500, payload: { error: 'Gangguan koneksi database saat memverifikasi produk. Tim teknis sedang menangani.' } };
    }

    if (!dbProducts || dbProducts.length === 0) {
      console.warn(`[CheckoutService] Product verification failed: requested IDs [${productIds.join(', ')}] not found in active catalog.`);
      return { status: 400, payload: { error: 'Produk di dalam keranjang Anda sudah tidak tersedia atau telah diperbarui di katalog LIVE. Silakan hapus item di keranjang dan pilih ulang dari halaman Shop.' } };
    }

    if (dbProducts.length !== productIds.length) {
      const foundIds = new Set(dbProducts.map((p: any) => p.id));
      const missingIds = productIds.filter(id => !foundIds.has(id));
      console.warn(`[CheckoutService] Partial product mismatch. Missing IDs: [${missingIds.join(', ')}]`);
      return { status: 400, payload: { error: 'Beberapa produk di dalam keranjang Anda sudah tidak tersedia di katalog LIVE. Silakan perbarui keranjang Anda dan coba kembali.' } };
    }

    // 4. Calculate Prices & Build Breakdown via O(1) Pricing Engine
    const pricing = PricingEngine.calculateOrderBreakdown(items, dbProducts, shippingDetails, promo);
    if (pricing.error) {
      return { status: 400, payload: { error: pricing.error } };
    }

    // 4.5 Pre-validate stock availability strictly and case-insensitively per AGENTS.md Rule #3
    const stockValidation = StockValidator.validateStock(items, dbProducts);
    if (!stockValidation.isValid) {
      return { status: 409, payload: { 
        error: stockValidation.error,
        out_of_stock_item: stockValidation.outOfStockItemId 
      }};
    }

    // 5. Resolve Affiliate Tracking
    let affiliateId: string | null = null;
    try {
      const targetRefCode = customerDetails.referral_code || affiliateCookieValue;
      if (targetRefCode) {
        const { data: affData } = await this.supabaseAdmin
          .from('affiliates')
          .select('id, user_id')
          .eq('code', targetRefCode.toUpperCase())
          .maybeSingle();
        if (affData && affData.user_id !== customerDetails.user_id) {
          affiliateId = affData.id;
        }
      }
    } catch (e) {
      console.error('[CheckoutService] Affiliate lookup error:', e);
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

    const shipments = shippingDetails.shipments || (Array.isArray(shippingDetails) ? shippingDetails : []);
    
    const orderCreation = await orderRepo.createOrderWithInventoryLock(
      orderId,
      pricing.grossAmount,
      affiliateId,
      customerDetails,
      shippingDetails,
      firstName,
      lastName,
      pricing.dbOrderItems,
      shipments
    );

    if (!orderCreation.success) {
      return { status: 409, payload: { error: orderCreation.error } };
    }

    // 8. Generate Midtrans Snap Token
    const snap = getSnapApi();
    const appUrl = getAppUrl();
    const parameter = {
      transaction_details: { order_id: orderId, gross_amount: pricing.grossAmount },
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

    // 9. Fire Asynchronous WhatsApp Notification (Non-blocking using Next.js after)
    after(() => {
      try {
        const formattedPhone = formatPhoneNumber(customerDetails.phone);
        if (formattedPhone) {
          // Estimated Delivery usually 2-5 days for standard couriers
          const estDelivery = '2-5 hari kerja'; 
          sendCheckoutPendingWA({
            phone: formattedPhone,
            customer_name: firstName,
            order_id: orderNumber,
            estimated_delivery: estDelivery
          }).catch(err => console.error('[CheckoutService Async] WA Notification Error:', err));
        }
      } catch (err) {
        console.error('[CheckoutService Async] Failed to queue WA Notification:', err);
      }
    });

    return {
      status: 200,
      payload: {
        token: snapToken,
        redirect_url: transaction.redirect_url,
        orderId,
        orderNumber,
      }
    };
  }
}

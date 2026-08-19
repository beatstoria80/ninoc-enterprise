import { SupabaseClient } from '@supabase/supabase-js';
import { CheckoutValidator, CustomerDetails, CheckoutItem } from './CheckoutValidator';
import { PricingEngine } from './PricingEngine';
import { OrderRepository } from '@/repositories/OrderRepository';
import { getSnapApiSingleton } from '@/lib/midtrans';
import { getAppUrl } from '@/lib/utils';
import { StockValidator, StockValidationResult } from './StockValidator';
import { sendCheckoutPendingWA, formatPhoneNumber } from '@/lib/whatsapp';
import { FlashSaleService } from '@/lib/domain/flashSale';
import { after } from 'next/server';

export interface CheckoutProcessResponse {
  status: number;
  payload: {
    token?: string;
    redirect_url?: string;
    orderId?: string;
    orderNumber?: string;
    error?: string;
    out_of_stock_item?: string;
  };
}

export class CheckoutService {
  constructor(private readonly supabaseAdmin: SupabaseClient) {}

  /**
   * SECURITY: Re-validates promo/voucher discount from database.
   * NEVER trust discountAmount sent from the frontend — it can be manipulated via DevTools.
   */
  private async revalidatePromoFromDB(
    promoInput: { code?: string; type?: string; affiliateId?: string } | null | undefined,
    subtotal: number
  ): Promise<{ code: string; discountAmount: number } | undefined> {
    if (!promoInput || !promoInput.code) return undefined;

    const upperCode = promoInput.code.toUpperCase();

    // 1. Check vouchers table
    const { data: voucher } = await this.supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('code', upperCode)
      .eq('is_active', true)
      .single();

    if (voucher) {
      // Validate expiry
      if (voucher.valid_until && new Date(voucher.valid_until) < new Date()) {
        return undefined; // expired — silently ignore
      }
      // Validate usage limit
      if (voucher.max_usage && voucher.usage_count !== undefined && voucher.usage_count >= voucher.max_usage) {
        return undefined;
      }
      // Validate minimum order
      if (voucher.min_order_amount && subtotal < voucher.min_order_amount) {
        return undefined;
      }

      let discountAmount = 0;
      if (voucher.type === 'percentage') {
        discountAmount = subtotal * (Number(voucher.value) / 100);
        if (voucher.max_discount && discountAmount > Number(voucher.max_discount)) {
          discountAmount = Number(voucher.max_discount);
        }
      } else if (voucher.type === 'fixed_amount') {
        discountAmount = Number(voucher.value);
      }
      // free_shipping handled by frontend display only

      // Validation only: Do NOT increment usage_count here to prevent race conditions
      // and financial loss if the user abandons checkout.
      // Usage increment will be securely handled in the payment webhook upon successful payment.

      return { code: upperCode, discountAmount };
    }

    // 2. Check affiliates table
    const { data: affiliate } = await this.supabaseAdmin
      .from('affiliates')
      .select('id, customer_discount_type, customer_discount_value, status')
      .eq('code', upperCode)
      .eq('status', 'active')
      .single();

    if (affiliate) {
      const dType = affiliate.customer_discount_type || 'percentage';
      const dValue = Number(affiliate.customer_discount_value || 0);
      let discountAmount = 0;
      if (dValue > 0) {
        discountAmount = dType === 'percentage' ? subtotal * (dValue / 100) : dValue;
      }
      return { code: upperCode, discountAmount };
    }

    // Code not found — no discount
    return undefined;
  }

  public async processCheckout(
    items: CheckoutItem[] | any[],
    customerDetails: CustomerDetails,
    shippingDetails: Record<string, unknown>,
    promo: unknown,
    clientIp: string,
    affiliateCookieValue: string | undefined
  ): Promise<CheckoutProcessResponse> {
    // 1. Validate & Sanitize Input
    const validation = CheckoutValidator.validateRequest(items as CheckoutItem[], customerDetails, clientIp);
    if (!validation.isValid) {
      return {
        status: 400,
        payload: (validation.errorResponse?.json as { error?: string }) || { error: 'Invalid request input' },
      };
    }

    customerDetails.phone = validation.sanitizedPhone!;
    const firstName = (customerDetails.first_name || '').toUpperCase();
    const lastName = (customerDetails.last_name || '').toUpperCase();

    // 2. Data Access Layer Initialization
    const orderRepo = new OrderRepository(this.supabaseAdmin);

    // 3. Fetch Product Costings & Variants
    const productIds = Array.from(new Set((validation.sanitizedItems || []).map((i: any) => i.id as string)));
    const { data: dbProducts, error: dbError } = await orderRepo.getProductsByIds(productIds);

    if (dbError) {
      console.error('[CheckoutService] Database error during product verification:', dbError);
      return {
        status: 500,
        payload: { error: 'Gangguan koneksi database saat memverifikasi produk. Tim teknis sedang menangani.' },
      };
    }

    if (!dbProducts || dbProducts.length === 0) {
      console.warn(`[CheckoutService] Product verification failed: requested IDs [${productIds.join(', ')}] not found.`);
      return {
        status: 400,
        payload: {
          error:
            'Produk di dalam keranjang Anda sudah tidak tersedia atau telah diperbarui di katalog LIVE. Silakan hapus item di keranjang dan pilih ulang dari halaman Shop.',
        },
      };
    }

    if (dbProducts.length !== productIds.length) {
      const foundIds = new Set(dbProducts.map((p: any) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      console.warn(`[CheckoutService] Partial product mismatch. Missing IDs: [${missingIds.join(', ')}]`);
      return {
        status: 400,
        payload: {
          error:
            'Beberapa produk di dalam keranjang Anda sudah tidak tersedia di katalog LIVE. Silakan perbarui keranjang Anda dan coba kembali.',
        },
      };
    }

    // 4. SECURITY: Re-validate promo discount from database (NEVER trust frontend discountAmount)
    const itemSubtotal = (validation.sanitizedItems || []).reduce((sum: number, item: any) => {
      const dbProd = dbProducts.find((p: any) => p.id === item.id);
      return sum + (Number(dbProd?.price || item.price || 0) * (item.quantity || 1));
    }, 0);
    const validatedPromo = await this.revalidatePromoFromDB(promo as any, itemSubtotal);

    // Fetch Active Flash Sales
    const activeFlashSales = await FlashSaleService.getActiveFlashSales(this.supabaseAdmin);

    // 4.1 Calculate Prices & Build Breakdown via O(1) Pricing Engine
    const pricing = PricingEngine.calculateOrderBreakdown(
      validation.sanitizedItems!, 
      dbProducts, 
      shippingDetails as any, 
      validatedPromo as any,
      activeFlashSales
    );
    if (pricing.error) {
      return { status: 400, payload: { error: pricing.error } };
    }

    // 4.5 Pre-validate stock availability strictly and case-insensitively
    const stockValidation: StockValidationResult = StockValidator.validateStock(validation.sanitizedItems!, dbProducts);
    if (!stockValidation.isValid) {
      return {
        status: 409,
        payload: {
          error: stockValidation.error,
          out_of_stock_item: stockValidation.outOfStockItemId,
        },
      };
    }

    // 4.6 Backend Warehouse Integrity Validation
    // Prevents API-bypass attacks that mix items from different warehouses in a single order.
    // Perfectly mirrors the single-order warehouse validation rules enforced in useCart.ts
    const sanitizedItems = validation.sanitizedItems!;
    if (sanitizedItems.length > 1) {
      const firstItem = sanitizedItems[0] as any;
      const existingWarehouseId = firstItem.warehouse_id;
      const existingPostal = firstItem.origin_postal_code;

      for (let i = 1; i < sanitizedItems.length; i++) {
        const currentItem = sanitizedItems[i] as any;
        const newWarehouseId = currentItem.warehouse_id;
        const newPostal = currentItem.origin_postal_code;

        let isConflict = false;
        if (existingWarehouseId || newWarehouseId) {
          if (existingWarehouseId !== newWarehouseId) {
            isConflict = true;
          }
        } else {
          if (existingPostal && newPostal && existingPostal !== newPostal) {
            isConflict = true;
          }
        }

        if (isConflict) {
          console.warn(`[CheckoutService] Warehouse conflict detected between items:`, firstItem.name, 'vs', currentItem.name);
          return {
            status: 400,
            payload: {
              error: 'Tidak dapat menggabungkan produk dari lokasi gudang/fasilitas yang berbeda dalam satu pesanan. Silakan checkout terpisah.',
            },
          };
        }
      }
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

    // 7. Generate Identifiers & Create Order with Row-Level Lock
    const orderId = `NINOC-${Date.now()}`;
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `NC-${datePart}-${randPart}`;

    const shipments = (shippingDetails as any)?.shipments || (Array.isArray(shippingDetails) ? shippingDetails : []);

    // 7.5 Flash Sale Inventory Lock
    const flashSaleOrderItems = pricing.dbOrderItems.filter((i: any) => i.flash_sale_item_id);
    let reservedFlashSaleItems: { id: string; qty: number }[] = [];
    
    if (flashSaleOrderItems.length > 0) {
      for (const item of flashSaleOrderItems) {
        const { data: reserved, error: rpcErr } = await this.supabaseAdmin.rpc('reserve_flash_sale_stock', {
          p_flash_sale_item_id: item.flash_sale_item_id,
          p_qty: item.quantity
        });
        
        if (rpcErr || !reserved) {
          // Rollback any successfully reserved items before failing
          for (const res of reservedFlashSaleItems) {
            await this.supabaseAdmin.rpc('reserve_flash_sale_stock', {
              p_flash_sale_item_id: res.id,
              p_qty: -res.qty
            });
          }
          return { status: 409, payload: { error: `Maaf, stok Flash Sale untuk produk ${item.product_name} baru saja habis diborong orang lain.` } };
        }
        reservedFlashSaleItems.push({ id: item.flash_sale_item_id, qty: item.quantity });
      }
    }

    const orderCreation = await orderRepo.createOrderWithInventoryLock(
      orderId,
      pricing.grossAmount,
      affiliateId,
      customerDetails,
      shippingDetails,
      firstName,
      lastName,
      pricing.dbOrderItems,
      shipments,
      validatedPromo?.code
    );

    if (!orderCreation.success) {
      // Rollback Flash Sale locks if main order fails
      if (reservedFlashSaleItems.length > 0) {
        for (const res of reservedFlashSaleItems) {
          await this.supabaseAdmin.rpc('reserve_flash_sale_stock', {
            p_flash_sale_item_id: res.id,
            p_qty: -res.qty
          });
        }
      }
      return { status: 409, payload: { error: orderCreation.error } };
    }

    // 8. Generate Midtrans Snap Token (uses cached singleton instance)
    const appUrl = getAppUrl();
    const snap = getSnapApiSingleton();
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
      custom_expiry: (flashSaleOrderItems && flashSaleOrderItems.length > 0)
        ? { expiry_duration: 15, unit: 'minute' }
        : { expiry_duration: 24, unit: 'hour' },
      callbacks: {
        finish: `${appUrl}/payment/success?order_id=${orderId}&courier=${(shippingDetails.method as string) || ''}`,
        unfinish: `${appUrl}/shop`,
        error: `${appUrl}/checkout`,
      },
      override_notification_url: [`${appUrl}/api/payments/webhook`],
    };

    const transaction = await snap.createTransaction(parameter);
    const snapToken = transaction.token as string;
    await orderRepo.updateSnapToken(orderId, snapToken);

    // 9. Fire Non-Blocking Background Tasks (address sync + WA notification)
    after(() => {
      // 9a. Upsert customer address in background — removed from critical path to save ~200ms
      if (customerDetails.user_id) {
        orderRepo.upsertCustomerAddress(customerDetails.user_id, customerDetails, firstName, lastName)
          .catch((err) => console.error('[CheckoutService Async] Address upsert error:', err));
      }

      // 9b. WhatsApp Checkout Pending notification
      try {
        const formattedPhone = customerDetails.phone ? formatPhoneNumber(customerDetails.phone) : '';
        if (formattedPhone) {
          const estDelivery = '2-5 hari kerja';
          sendCheckoutPendingWA({
            phone: formattedPhone,
            customer_name: firstName,
            order_id: orderId,
            estimated_delivery: estDelivery,
          }).catch((err) => console.error('[CheckoutService Async] WA Notification Error:', err));
        }
      } catch (err) {
        console.error('[CheckoutService Async] Failed to queue WA Notification:', err);
      }
    });

    return {
      status: 200,
      payload: {
        token: snapToken,
        redirect_url: transaction.redirect_url as string,
        orderId,
        orderNumber,
      },
    };
  }
}

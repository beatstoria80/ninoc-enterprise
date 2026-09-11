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
import { WarehouseValidator } from '@/domain/cart/WarehouseValidator';
import { VoucherRepository } from '@/repositories/VoucherRepository';
import { AffiliateRepository } from '@/repositories/AffiliateRepository';
import { DomainResult, DomainSuccess, DomainFailure } from '@/lib/types/domain';

export interface CheckoutProcessPayload {
  token?: string;
  redirect_url?: string;
  orderId?: string;
  orderNumber?: string;
}
export class CheckoutService {
  private readonly voucherRepo: VoucherRepository;
  private readonly affiliateRepo: AffiliateRepository;

  constructor(
    private readonly supabaseAdmin: SupabaseClient,
    private readonly orderRepo: OrderRepository = new OrderRepository(supabaseAdmin)
  ) {
    this.voucherRepo = new VoucherRepository(supabaseAdmin);
    this.affiliateRepo = new AffiliateRepository(supabaseAdmin);
  }

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
    const voucher = await this.voucherRepo.getActiveVoucherByCode(upperCode);

    if (voucher) {
      if (voucher.valid_until && new Date(voucher.valid_until) < new Date()) return undefined;
      if (voucher.max_usage && voucher.usage_count != null && voucher.usage_count >= voucher.max_usage) return undefined;
      if (voucher.min_order_amount && subtotal < voucher.min_order_amount) return undefined;

      let discountAmount = 0;
      if (voucher.type === 'percentage') {
        discountAmount = subtotal * (Number(voucher.value) / 100);
        if (voucher.max_discount && discountAmount > Number(voucher.max_discount)) {
          discountAmount = Number(voucher.max_discount);
        }
      } else if (voucher.type === 'fixed_amount') {
        discountAmount = Number(voucher.value);
      }
      return { code: upperCode, discountAmount };
    }

    // 2. Check affiliates table
    const affiliate = await this.affiliateRepo.getActiveAffiliateByCode(upperCode);

    if (affiliate) {
      const dType = affiliate.customer_discount_type || 'percentage';
      const dValue = Number(affiliate.customer_discount_value || 0);
      let discountAmount = 0;
      if (dValue > 0) {
        discountAmount = dType === 'percentage' ? subtotal * (dValue / 100) : dValue;
      }
      return { code: upperCode, discountAmount };
    }

    return undefined;
  }

  // Removed validateWarehouseIntegrity in favor of centralized WarehouseValidator

  private async resolveAffiliateTracking(customerDetails: CustomerDetails, affiliateCookieValue?: string): Promise<string | null> {
    const targetRefCode = customerDetails.referral_code || affiliateCookieValue;
    if (!targetRefCode) return null;

    try {
      const { data: affData } = await this.supabaseAdmin
        .from('affiliates')
        .select('id, user_id')
        .eq('code', targetRefCode.toUpperCase())
        .maybeSingle();
      if (affData && affData.user_id !== customerDetails.user_id) {
        return affData.id;
      }
    } catch (e) {
      console.error('[CheckoutService] Affiliate lookup error:', e);
    }
    return null;
  }

  private async applyFlashSaleLocks(flashSaleOrderItems: any[], customerDetails: CustomerDetails): Promise<{ success: boolean; reservedItems: any[]; error?: string }> {
    const reservedFlashSaleItems: { id: string; qty: number }[] = [];
    const sessionTracker = new Map<string, number>();
    
    if (flashSaleOrderItems.length === 0) return { success: true, reservedItems: [] };

    for (const item of flashSaleOrderItems) {
      if (item.flash_sale_max_qty) {
        const pastPurchasedQty = await FlashSaleService.checkUserPurchaseLimit(
          this.supabaseAdmin,
          item.flash_sale_item_id,
          customerDetails.user_id,
          customerDetails.email,
          customerDetails.phone
        );
        
        const currentSessionQty = sessionTracker.get(item.flash_sale_item_id) || 0;
        const totalRequestedQty = pastPurchasedQty + currentSessionQty + item.quantity;
        
        if (totalRequestedQty > item.flash_sale_max_qty) {
          await this.rollbackFlashSaleLocks(reservedFlashSaleItems);
          return { success: false, reservedItems: [], error: `Anda telah mencapai batas maksimal pembelian (Maks ${item.flash_sale_max_qty} pcs) untuk produk promosi ${item.product_name}.` };
        }
        
        sessionTracker.set(item.flash_sale_item_id, currentSessionQty + item.quantity);
      }

      const { data: reserved, error: rpcErr } = await this.supabaseAdmin.rpc('reserve_flash_sale_stock', {
        p_flash_sale_item_id: item.flash_sale_item_id,
        p_qty: item.quantity
      });
      
      if (rpcErr || !reserved) {
        await this.rollbackFlashSaleLocks(reservedFlashSaleItems);
        return { success: false, reservedItems: [], error: `Maaf, stok Flash Sale untuk produk ${item.product_name} baru saja habis diborong orang lain.` };
      }
      reservedFlashSaleItems.push({ id: item.flash_sale_item_id, qty: item.quantity });
    }

    return { success: true, reservedItems: reservedFlashSaleItems };
  }

  public async rollbackFlashSaleLocks(reservedItems: { id: string; qty: number }[]) {
    for (const res of reservedItems) {
      await this.supabaseAdmin.rpc('rollback_flash_sale_stock', {
        p_flash_sale_item_id: res.id,
        p_qty: res.qty
      });
    }
  }

  private async processPaymentGateway(orderId: string, grossAmount: number, customerDetails: CustomerDetails, domainItems: any[], shippingDetails: any, flashSaleOrderItems: any[]) {
    const appUrl = getAppUrl();
    const snap = getSnapApiSingleton();
    const firstName = (customerDetails.first_name || '').toUpperCase();
    const lastName = (customerDetails.last_name || '').toUpperCase();

    // Map domainItems strictly to Midtrans Schema to prevent data leaks (supplier_hpp, markup, etc)
    const midtransItems = domainItems.map(item => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      name: item.name
    }));

    const parameter = {
      transaction_details: { order_id: orderId, gross_amount: grossAmount },
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
      item_details: midtransItems,
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
    await this.orderRepo.updateSnapToken(orderId, transaction.token as string);
    return transaction;
  }

  private dispatchAsyncTasks(customerDetails: CustomerDetails, orderId: string) {
    const firstName = (customerDetails.first_name || '').toUpperCase();
    const lastName = (customerDetails.last_name || '').toUpperCase();

    after(() => {
      if (customerDetails.user_id) {
        this.orderRepo.upsertCustomerAddress(customerDetails.user_id, customerDetails, firstName, lastName)
          .catch((err) => console.error('[CheckoutService Async] Address upsert error:', err));
      }

      try {
        const formattedPhone = customerDetails.phone ? formatPhoneNumber(customerDetails.phone) : '';
        if (formattedPhone) {
          sendCheckoutPendingWA({
            phone: formattedPhone,
            customer_name: firstName,
            order_id: orderId,
            estimated_delivery: '2-5 hari kerja',
          }).catch((err) => console.error('[CheckoutService Async] WA Notification Error:', err));
        }
      } catch (err) {
        console.error('[CheckoutService Async] Failed to queue WA Notification:', err);
      }
    });
  }

  public async processCheckout(
    items: CheckoutItem[] | any[],
    customerDetails: CustomerDetails,
    shippingDetails: Record<string, unknown>,
    promo: unknown,
    clientIp: string,
    affiliateCookieValue: string | undefined
  ): Promise<DomainResult<CheckoutProcessPayload>> {
    
    // 1. Validate & Sanitize Input
    const validation = CheckoutValidator.validateRequest(items as CheckoutItem[], customerDetails, clientIp);
    if (!validation.success || !validation.data) {
      return DomainFailure(validation.error || 'Invalid request input', validation.errorType || 'VALIDATION_ERROR', validation.meta);
    }

    customerDetails.phone = validation.data.sanitizedPhone;
    const sanitizedItems = validation.data.sanitizedItems;

    // 2. Fetch Products
    const productIds = Array.from(new Set(sanitizedItems.map((i: any) => i.id as string)));
    const { data: dbProducts, error: dbError } = await this.orderRepo.getProductsByIds(productIds);

    if (dbError) {
      return DomainFailure('Gangguan koneksi database saat memverifikasi produk. Tim teknis sedang menangani.', 'INTERNAL_ERROR');
    }
    if (!dbProducts || dbProducts.length !== productIds.length) {
      return DomainFailure('Beberapa produk di dalam keranjang Anda sudah tidak tersedia di katalog LIVE. Silakan perbarui keranjang Anda.', 'VALIDATION_ERROR');
    }

    // 3. Pricing & Validation
    const itemSubtotal = sanitizedItems.reduce((sum: number, item: any) => {
      const dbProd = dbProducts.find((p: any) => p.id === item.id);
      return sum + (Number(dbProd?.price || item.price || 0) * (item.quantity || 1));
    }, 0);
    
    const validatedPromo = await this.revalidatePromoFromDB(promo as any, itemSubtotal);
    const activeFlashSales = await FlashSaleService.getActiveFlashSales(this.supabaseAdmin);

    const pricing = PricingEngine.calculateOrderBreakdown(
      sanitizedItems, dbProducts, shippingDetails as any, validatedPromo as any, activeFlashSales
    );
    if (pricing.error) return DomainFailure(pricing.error, 'VALIDATION_ERROR');

    const stockValidation = StockValidator.validateStock(sanitizedItems, dbProducts);
    if (!stockValidation.isValid) {
      return DomainFailure(stockValidation.error || 'Stock error', 'CONFLICT', { out_of_stock_item: stockValidation.outOfStockItemId });
    }

    const warehouseValidation = WarehouseValidator.validateWarehouseConflict(sanitizedItems);
    if (!warehouseValidation.isValid) return DomainFailure(warehouseValidation.error || 'Warehouse conflict', 'VALIDATION_ERROR');

    const affiliateId = await this.resolveAffiliateTracking(customerDetails, affiliateCookieValue);

    // 4. Identifiers & Locks
    const orderId = `NINOC-${Date.now()}`;
    const datePart = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `NC-${datePart}-${randPart}`;
    const shipments = (shippingDetails as any)?.shipments || (Array.isArray(shippingDetails) ? shippingDetails : []);

    const flashSaleOrderItems = pricing.dbOrderItems.filter((i: any) => i.flash_sale_item_id);
    const lockResult = await this.applyFlashSaleLocks(flashSaleOrderItems, customerDetails);
    
    if (!lockResult.success) {
      return DomainFailure(lockResult.error || 'Failed to lock flash sale', 'CONFLICT');
    }

    // 5. Create Order
    const firstName = (customerDetails.first_name || '').toUpperCase();
    const lastName = (customerDetails.last_name || '').toUpperCase();
    
    const orderCreation = await this.orderRepo.createOrderWithInventoryLock(
      orderId, orderNumber, pricing.grossAmount, affiliateId, customerDetails, shippingDetails,
      firstName, lastName, pricing.dbOrderItems, shipments, validatedPromo?.code
    );

    if (!orderCreation.success) {
      await this.rollbackFlashSaleLocks(lockResult.reservedItems);
      return DomainFailure(orderCreation.error || 'Failed to create order', 'CONFLICT');
    }

    // 6. Payment Gateway with Rollback on Failure
    try {
      const transaction = await this.processPaymentGateway(
        orderId, pricing.grossAmount, customerDetails, pricing.domainItems, shippingDetails, flashSaleOrderItems
      );

      this.dispatchAsyncTasks(customerDetails, orderId);

      return DomainSuccess({
        token: transaction.token as string,
        redirect_url: transaction.redirect_url as string,
        orderId,
        orderNumber,
      });
    } catch (paymentError) {
      console.error(`[CheckoutService] Midtrans Snap failed for ${orderId}, initiating inventory rollback:`, paymentError);
      
      // Rollback: restock inventory + flash sale locks
      await this.supabaseAdmin.rpc('restock_inventory', { p_order_id: orderId });
      await this.rollbackFlashSaleLocks(lockResult.reservedItems);
      
      // Mark order as failed so it doesn't linger
      await this.supabaseAdmin.from('orders').update({ status: 'cancelled', payment_status: 'failed' }).eq('id', orderId);
      
      return DomainFailure('Gagal menghubungi sistem pembayaran. Silakan coba lagi dalam beberapa saat.', 'INTERNAL_ERROR');
    }
  }
}

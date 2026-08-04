import { SupabaseClient } from '@supabase/supabase-js';
import { CustomerDetails, ShippingDetails } from '@/domain/checkout/CheckoutValidator';

export class OrderRepository {
  constructor(private readonly db: SupabaseClient) {}

  /**
   * Fetches product catalog with costings and variants in a single query,
   * falling back to split independent queries if embedded relationships or columns error out.
   */
  public async getProductsByIds(productIds: string[]) {
    // 1. Try primary embedded query first
    let { data: products, error } = await this.db
      .from('products')
      .select(`
        id, price, name, supplier_id, stock_quantity,
        product_costings ( supplier_base_price, supplier_surcharge_cost, ninoc_markup ),
        variants ( id, size, color, stock_quantity )
      `)
      .in('id', productIds);

    // 2. If embedded query fails (e.g. schema differences, missing columns, or PostgREST relationship error),
    // automatically fallback to independent queries so checkout verification never fails.
    if (error || !products) {
      console.warn('[OrderRepository] Embedded getProductsByIds query failed, falling back to split queries:', error?.message || error);

      const { data: baseProducts, error: baseError } = await this.db
        .from('products')
        .select('id, price, name, supplier_id, stock_quantity')
        .in('id', productIds);

      let rawProducts: any[] = [];
      if (baseError || !baseProducts) {
        console.warn('[OrderRepository] Base products query failed, trying wildcard select:', baseError?.message || baseError);
        const { data: wildcardProducts, error: wildcardError } = await this.db
          .from('products')
          .select('*')
          .in('id', productIds);

        if (wildcardError || !wildcardProducts) {
          console.error('[OrderRepository] Fatal product verification failure:', wildcardError || baseError);
          return { data: null, error: wildcardError || baseError || error };
        }
        rawProducts = wildcardProducts;
      } else {
        rawProducts = baseProducts;
      }

      // Independent fetch for variants
      const variantsMap = new Map<string, any[]>();
      try {
        const { data: variantsData } = await this.db
          .from('variants')
          .select('id, product_id, size, color, stock_quantity')
          .in('product_id', productIds);
        if (variantsData) {
          for (const v of variantsData) {
            if (!variantsMap.has(v.product_id)) variantsMap.set(v.product_id, []);
            variantsMap.get(v.product_id)!.push(v);
          }
        }
      } catch (e) {
        console.warn('[OrderRepository] Fallback variants fetch skipped/failed:', e);
      }

      // Independent fetch for product_costings
      const costingsMap = new Map<string, any>();
      try {
        const { data: costingsData } = await this.db
          .from('product_costings')
          .select('*')
          .in('product_id', productIds);
        if (costingsData) {
          for (const c of costingsData) {
            costingsMap.set(c.product_id, {
              supplier_base_price: c.supplier_base_price ?? c.supplier_cost ?? 0,
              supplier_surcharge_cost: c.supplier_surcharge_cost ?? 0,
              ninoc_markup: c.ninoc_markup ?? 0,
            });
          }
        }
      } catch (err) {
        console.warn('[OrderRepository] Fallback costings fetch skipped/failed:', err);
      }

      const stitchedProducts = rawProducts.map((p: any) => ({
        ...p,
        variants: variantsMap.get(p.id) || p.variants || [],
        product_costings: costingsMap.get(p.id) ? [costingsMap.get(p.id)] : (p.product_costings || []),
      }));

      return { data: stitchedProducts, error: null };
    }

    return { data: products, error };
  }

  /**
   * Upserts customer address cleanly.
   */
  public async upsertCustomerAddress(userId: string, customer: CustomerDetails, firstName: string, lastName: string) {
    const addressType = customer.address_type || 'Home';
    try {
      const { data: existing } = await this.db
        .from('customer_addresses')
        .select('id')
        .eq('user_id', userId)
        .eq('address_type', addressType)
        .maybeSingle();

      const payload = {
        user_id: userId,
        address_type: addressType,
        first_name: firstName,
        last_name: lastName,
        phone: customer.phone || '',
        street: (customer.street || '').toUpperCase(),
        house_number: (customer.house_number || '').toUpperCase(),
        rt: customer.rt || '',
        rw: customer.rw || '',
        kelurahan: (customer.kelurahan || '').toUpperCase(),
        kecamatan: (customer.kecamatan || '').toUpperCase(),
        city: (customer.city || '').toUpperCase(),
        province: (customer.province || '').toUpperCase(),
        postal_code: customer.postal_code || '',
      };

      if (existing) {
        await this.db.from('customer_addresses').update(payload).eq('id', existing.id);
      } else {
        await this.db.from('customer_addresses').insert({ ...payload, is_default: addressType === 'Home' });
      }
    } catch (e) {
      console.error('[OrderRepository] Failed to upsert customer address:', e);
    }
  }

  /**
   * Creates draft order, order items, and reserves inventory using atomic RPC.
   */
  public async createOrderWithInventoryLock(
    orderId: string,
    grossAmount: number,
    affiliateId: string | null,
    customer: any,
    shippingAddressData: any, // Basic info without single cost
    firstName: string,
    lastName: string,
    dbOrderItems: any[],
    shipments: any[] // Array of { warehouse_id, origin_postal_code, courier_name, courier_service, shipping_cost }
  ): Promise<{ success: boolean; error?: string }> {
    
    const aggregatedCourier = shipments.length > 0 
      ? shipments.map(s => `${s.courier_name} ${s.courier_service}`).join(', ')
      : (shippingAddressData.method || '');
      
    const totalShippingCost = shipments.length > 0
      ? shipments.reduce((sum, s) => sum + Number(s.shipping_cost), 0)
      : Number(shippingAddressData.cost || 0);

    const shippingAddress = {
      ...customer,
      first_name: firstName,
      last_name: lastName,
      address: (customer.address || '').toUpperCase(),
      city: (customer.city || '').toUpperCase(),
      shipping_method: aggregatedCourier,
      shipping_cost: totalShippingCost,
    };

    const customerName = customer.name || `${firstName} ${lastName}`.trim() || null;

    // Execute atomic Postgres transaction
    const { data, error } = await this.db.rpc('create_order_transaction', {
      p_order_id: orderId,
      p_user_id: customer.user_id || null,
      p_affiliate_id: affiliateId,
      p_customer_name: customerName,
      p_customer_email: customer.email || null,
      p_customer_phone: customer.phone || null,
      p_total_price: grossAmount,
      p_courier: aggregatedCourier,
      p_shipping_address: shippingAddress,
      p_items: dbOrderItems,
      p_shipments: shipments
    });

    if (error) {
      console.error('[OrderRepository] Atomic order creation failed:', error);
      return { success: false, error: `DB Error: ${error.message}` };
    }

    if (data && data.success === false) {
      console.error('[OrderRepository] Atomic transaction rejected:', data.error);
      return { success: false, error: data.error || 'Gagal memproses transaksi pesanan.' };
    }

    return { success: true };
  }

  /**
   * Updates Snap Token once generated.
   */
  public async updateSnapToken(orderId: string, snapToken: string) {
    await this.db.from('orders').update({ snap_token: snapToken }).eq('id', orderId);
  }
}

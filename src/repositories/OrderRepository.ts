import { SupabaseClient } from '@supabase/supabase-js';
import { CustomerDetails, ShippingDetails } from '@/domain/checkout/CheckoutValidator';

export class OrderRepository {
  constructor(private readonly db: SupabaseClient) {}

  /**
   * Fetches product catalog with costings and variants in a single query.
   */
  public async getProductsByIds(productIds: string[]) {
    return await this.db
      .from('products')
      .select(`
        id, price, name, supplier_id,
        product_costings ( supplier_base_price, supplier_surcharge_cost, ninoc_markup ),
        variants ( id, size, color )
      `)
      .in('id', productIds);
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
    customer: CustomerDetails,
    shipping: ShippingDetails,
    firstName: string,
    lastName: string,
    dbOrderItems: any[]
  ): Promise<{ success: boolean; error?: string }> {
    
    const shippingAddress = {
      ...customer,
      first_name: firstName,
      last_name: lastName,
      address: (customer.address || '').toUpperCase(),
      city: (customer.city || '').toUpperCase(),
      shipping_method: shipping.method,
      shipping_cost: shipping.cost,
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
      p_courier: shipping.method,
      p_shipping_address: shippingAddress,
      p_items: dbOrderItems
    });

    if (error) {
      console.error('[OrderRepository] Atomic order creation failed:', error);
      return { success: false, error: `DB Error: ${error.message}` };
    }

    if (data && data.success === false) {
      console.error('[OrderRepository] Atomic transaction rejected:', data.error);
      return { success: false, error: `Transaction Failed: ${data.error}` };
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
